"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
const execPromise = util_1.default.promisify(child_process_1.exec);
const createWindow = () => {
    const mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
};
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// --- IPC Handlers ---
electron_1.ipcMain.handle('install-package', async (event, { engine, projectPath, packageId, version }) => {
    try {
        if (engine === 'unreal') {
            // 1. Ensure Scripts directory exists in target
            const targetScriptsDir = path_1.default.join(projectPath, 'Scripts');
            if (!fs_1.default.existsSync(targetScriptsDir)) {
                fs_1.default.mkdirSync(targetScriptsDir, { recursive: true });
            }
            // 2. Copy our sync script to the target project (so 'node Scripts/sync-plugins.js' works)
            const sourceSyncScript = path_1.default.join(process.cwd(), 'scripts', 'sync-plugins.js');
            const targetSyncScript = path_1.default.join(targetScriptsDir, 'sync-plugins.js');
            fs_1.default.copyFileSync(sourceSyncScript, targetSyncScript);
            // 3. Run npm install
            await execPromise(`npm install ${packageId}@${version}`, { cwd: projectPath });
            // 4. Run sync script
            await execPromise(`node Scripts/sync-plugins.js`, { cwd: projectPath });
            return { success: true, message: 'Unreal package installed and synced.' };
        }
        else {
            // Unity logic
            const manifestPath = path_1.default.join(projectPath, 'Packages', 'manifest.json');
            if (!fs_1.default.existsSync(manifestPath))
                throw new Error('manifest.json not found');
            const manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf-8'));
            manifest.dependencies = manifest.dependencies || {};
            manifest.dependencies[packageId] = version;
            fs_1.default.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
            return { success: true, message: 'Unity manifest updated.' };
        }
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('scan-installed', async (event, { engine, projectPath }) => {
    try {
        const filePath = engine === 'unreal'
            ? path_1.default.join(projectPath, 'package.json')
            : path_1.default.join(projectPath, 'Packages', 'manifest.json');
        if (!fs_1.default.existsSync(filePath))
            return [];
        const content = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
        const deps = engine === 'unreal'
            ? { ...content.dependencies, ...content.devDependencies }
            : content.dependencies || {};
        return Object.entries(deps).map(([id, version]) => ({ id, version }));
    }
    catch (e) {
        return [];
    }
});
