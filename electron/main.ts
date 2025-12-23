import { app, BrowserWindow, ipcMain } from 'electron';
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

// --- IPC Handlers ---

ipcMain.handle('install-package', async (event, { engine, projectPath, packageId, version }) => {
  try {
    if (engine === 'unreal') {
      // 1. Ensure Scripts directory exists in target
      const targetScriptsDir = path.join(projectPath, 'Scripts');
      if (!fs.existsSync(targetScriptsDir)) {
        fs.mkdirSync(targetScriptsDir, { recursive: true });
      }

      // 2. Copy our sync script to the target project (so 'node Scripts/sync-plugins.js' works)
      const sourceSyncScript = path.join(process.cwd(), 'scripts', 'sync-plugins.js');
      const targetSyncScript = path.join(targetScriptsDir, 'sync-plugins.js');
      fs.copyFileSync(sourceSyncScript, targetSyncScript);

      // 3. Run npm install
      await execPromise(`npm install ${packageId}@${version}`, { cwd: projectPath });
      
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
