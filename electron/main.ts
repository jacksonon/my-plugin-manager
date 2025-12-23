import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { exec } from 'child_process';
import fs from 'fs';
import util from 'util';

const execPromise = util.promisify(exec);

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- Config Management ---
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

const loadConfig = () => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load config', e);
  }
  return {
    unreal: { release: 'https://registry.npmjs.org/', snapshot: '' },
    unity: { release: '', snapshot: '' }
  };
};

ipcMain.handle('get-settings', async () => {
  return loadConfig();
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
});

// --- New Handlers for Publish Tool ---

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('read-file', async (event, filePath) => {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return null;
});

ipcMain.handle('write-file', async (event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('publish-package', async (event, { cwd, registry }) => {
  try {
    const cmd = `npm publish --registry=${registry}`;
    // console.log(`Executing ${cmd} in ${cwd}`);
    const { stdout, stderr } = await execPromise(cmd, { cwd });
    return { success: true, message: stdout || stderr };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
});

// --- IPC Handlers ---

ipcMain.handle('install-package', async (event, { engine, projectPath, packageId, version }) => {
  try {
    const config = loadConfig();

    if (engine === 'unreal') {
      // 1. Ensure Scripts directory exists in target
      const targetScriptsDir = path.join(projectPath, 'Scripts');
      if (!fs.existsSync(targetScriptsDir)) {
        fs.mkdirSync(targetScriptsDir, { recursive: true });
      }

      // 2. Copy our sync script
      const sourceSyncScript = path.join(process.cwd(), 'scripts', 'sync-plugins.js');
      const targetSyncScript = path.join(targetScriptsDir, 'sync-plugins.js');
      // Ensure source exists (development vs production paths might differ)
      if (fs.existsSync(sourceSyncScript)) {
         fs.copyFileSync(sourceSyncScript, targetSyncScript);
      }

      // 3. Construct npm install command with registry
      // Prioritize snapshot if version contains '-' (e.g. 1.0.0-beta), otherwise release
      // This is a simple heuristic.
      let registryUrl = config.unreal.release;
      if (version.includes('-') && config.unreal.snapshot) {
        registryUrl = config.unreal.snapshot;
      }
      
      const registryFlag = registryUrl ? ` --registry=${registryUrl}` : '';
      const installCmd = `npm install ${packageId}@${version}${registryFlag}`;
      
      await execPromise(installCmd, { cwd: projectPath });
      
      // 4. Run sync script
      await execPromise(`node Scripts/sync-plugins.js`, { cwd: projectPath });
      
      return { success: true, message: 'Unreal package installed and synced.' };
    } else {
      // Unity logic
      const manifestPath = path.join(projectPath, 'Packages', 'manifest.json');
      if (!fs.existsSync(manifestPath)) throw new Error('manifest.json not found');
      
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      manifest.dependencies = manifest.dependencies || {};
      manifest.dependencies[packageId] = version;
      
      // Optional: Add scopedRegistry if configured
      if (config.unity.release) {
        manifest.scopedRegistries = manifest.scopedRegistries || [];
        // Check if we need to add a registry entry for this scope
      }

      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      return { success: true, message: 'Unity manifest updated.' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('scan-installed', async (event, { engine, projectPath }) => {
  try {
    const filePath = engine === 'unreal' 
      ? path.join(projectPath, 'package.json')
      : path.join(projectPath, 'Packages', 'manifest.json');

    if (!fs.existsSync(filePath)) return [];
    
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const deps = engine === 'unreal' 
      ? { ...content.dependencies, ...content.devDependencies }
      : content.dependencies || {};

    return Object.entries(deps).map(([id, version]) => ({ id, version }));
  } catch (e) {
    return [];
  }
});