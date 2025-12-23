import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  installPackage: (data: { engine: 'unreal' | 'unity', projectPath: string, packageId: string, version: string }) => 
    ipcRenderer.invoke('install-package', data),
  scanInstalled: (data: { engine: 'unreal' | 'unity', projectPath: string }) => 
    ipcRenderer.invoke('scan-installed', data),
});
