"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    installPackage: (data) => electron_1.ipcRenderer.invoke('install-package', data),
    scanInstalled: (data) => electron_1.ipcRenderer.invoke('scan-installed', data),
});
