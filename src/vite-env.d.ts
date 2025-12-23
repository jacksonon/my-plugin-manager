/// <reference types="vite/client" />

interface ElectronAPI {
  installPackage: (data: { engine: 'unreal' | 'unity', projectPath: string, packageId: string, version: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
  scanInstalled: (data: { engine: 'unreal' | 'unity', projectPath: string }) => Promise<{ id: string; version: string }[]>;
}

interface Window {
  electronAPI: ElectronAPI;
}
