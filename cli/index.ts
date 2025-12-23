#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import Conf from 'conf';
import path from 'path';
import fs from 'fs-extra';
import { exec } from 'child_process';
import util from 'util';
import { fileURLToPath } from 'url';

const execPromise = util.promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration Setup
const config = new Conf({
  projectName: 'game-tech-manager',
  defaults: {
    unreal: { release: 'https://registry.npmjs.org/', snapshot: '' },
    unity: { release: '', snapshot: '' }
  }
});

const program = new Command();

program
  .name('gpm')
  .description('Game Tech Package Manager CLI')
  .version('1.0.0');

// --- Helper Functions ---

function getEngineType(projectPath: string): 'unreal' | 'unity' | null {
  if (fs.existsSync(path.join(projectPath, 'Packages', 'manifest.json'))) return 'unity';
  // Check for .uproject file
  const files = fs.readdirSync(projectPath);
  if (files.some(f => f.endsWith('.uproject'))) return 'unreal';
  return null;
}

// --- Commands ---

program
  .command('scan [path]')
  .description('Scan installed packages in a project')
  .action(async (targetPath) => {
    const projectPath = path.resolve(targetPath || process.cwd());
    const spinner = ora(`Scanning project at ${projectPath}...`).start();

    const engine = getEngineType(projectPath);

    if (!engine) {
      spinner.fail('No Unity or Unreal project found at path.');
      return;
    }

    try {
      let packages: { id: string; version: string }[] = [];
      if (engine === 'unreal') {
        const pkgJson = path.join(projectPath, 'package.json');
        if (fs.existsSync(pkgJson)) {
          const content = await fs.readJson(pkgJson);
          const deps = { ...content.dependencies, ...content.devDependencies };
          packages = Object.entries(deps).map(([id, version]) => ({ id, version: version as string }));
        }
      } else {
        const manifest = path.join(projectPath, 'Packages', 'manifest.json');
        if (fs.existsSync(manifest)) {
          const content = await fs.readJson(manifest);
          packages = Object.entries(content.dependencies || {}).map(([id, version]) => ({ id, version: version as string }));
        }
      }

      spinner.succeed(chalk.green(`Found ${packages.length} packages in ${chalk.bold(engine)} project:`));
      packages.forEach(p => {
        console.log(`  ${chalk.cyan(p.id)} @ ${chalk.yellow(p.version)}`);
      });

    } catch (e: any) {
      spinner.fail(`Scan failed: ${e.message}`);
    }
  });

program
  .command('install <packageId> [version]')
  .description('Install a package to the project')
  .option('-p, --path <path>', 'Path to project root', process.cwd())
  .action(async (packageId, version, options) => {
    const projectPath = path.resolve(options.path);
    const spinner = ora(`Checking project type...`).start();
    
    const engine = getEngineType(projectPath);
    if (!engine) {
      spinner.fail('No supported project found.');
      return;
    }

    // Default version logic if not supplied
    // In a real CLI, we might fetch 'latest' from registry here.
    const installVersion = version || 'latest'; 

    spinner.text = `Installing ${chalk.cyan(packageId)}@${chalk.yellow(installVersion)} for ${chalk.magenta(engine)}...`;

    try {
      if (engine === 'unreal') {
        // 1. Ensure Scripts dir
        const targetScriptsDir = path.join(projectPath, 'Scripts');
        await fs.ensureDir(targetScriptsDir);

        // 2. Locate and copy sync script
        // We need to find where the CLI is installed and find scripts/sync-plugins.js
        // In dev: ./scripts/sync-plugins.js
        // In prod (npm installed): ../scripts/sync-plugins.js relative to dist-cli/
        
        let sourceSyncScript = path.join(__dirname, '../../scripts/sync-plugins.js'); // Dev path assumption
        if (!fs.existsSync(sourceSyncScript)) {
            // Try prod path
             sourceSyncScript = path.join(__dirname, '../scripts/sync-plugins.js');
        }

        if (fs.existsSync(sourceSyncScript)) {
            await fs.copy(sourceSyncScript, path.join(targetScriptsDir, 'sync-plugins.js'));
        } else {
            spinner.warn('Sync script not found in CLI distribution. Skipping script copy.');
        }

        // 3. Construct npm install
        const conf: any = config.get('unreal');
        let registryUrl = conf.release;
        if (installVersion.includes('-') && conf.snapshot) {
            registryUrl = conf.snapshot;
        }
        
        const registryFlag = registryUrl ? ` --registry=${registryUrl}` : '';
        const installCmd = `npm install ${packageId}@${installVersion}${registryFlag}`;

        spinner.text = `Running: ${installCmd}`;
        await execPromise(installCmd, { cwd: projectPath });

        // 4. Run sync
        spinner.text = 'Syncing plugins...';
        await execPromise(`node Scripts/sync-plugins.js`, { cwd: projectPath });
        
        spinner.succeed('Unreal package installed and synced.');

      } else {
        // Unity
        const manifestPath = path.join(projectPath, 'Packages', 'manifest.json');
        const manifest = await fs.readJson(manifestPath);
        
        manifest.dependencies = manifest.dependencies || {};
        manifest.dependencies[packageId] = installVersion;

        // Note: Unity UPM handles auth via .upmconfig.toml usually, 
        // but if we wanted to inject scopedRegistries, we would read config.get('unity') here.
        
        await fs.writeJson(manifestPath, manifest, { spaces: 2 });
        spinner.succeed('Unity manifest updated. Switch to Unity to finish resolution.');
      }
    } catch (e: any) {
      spinner.fail(`Installation failed: ${e.message}`);
    }
  });

program
  .command('config')
  .description('Configure registry URLs')
  .action(async () => {
    const current: any = config.store;
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'unreal.release',
        message: 'Unreal Release Registry:',
        default: current.unreal?.release
      },
      {
        type: 'input',
        name: 'unreal.snapshot',
        message: 'Unreal Snapshot Registry:',
        default: current.unreal?.snapshot
      },
      {
        type: 'input',
        name: 'unity.release',
        message: 'Unity Release Registry (Scoped):',
        default: current.unity?.release
      }
    ]);

    config.set('unreal', { release: answers['unreal.release'], snapshot: answers['unreal.snapshot'] });
    config.set('unity', { ...current.unity, release: answers['unity.release'] });

    console.log(chalk.green('Configuration saved!'));
  });

program.parse();
