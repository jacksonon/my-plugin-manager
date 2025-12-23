/// <reference types="vite/client" />

interface RegistryConfig {
  release: string;
  snapshot: string;
}

interface AppSettings {
  unreal: RegistryConfig;
  unity: RegistryConfig;
}

interface ElectronAPI {
  installPackage: (data: { engine: 'unreal' | 'unity', projectPath: string, packageId: string, version: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
  scanInstalled: (data: { engine: 'unreal' | 'unity', projectPath: string }) => Promise<{ id: string; version: string }[]>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<{ success: boolean; error?: string }>;
  selectDirectory: () => Promise<string | null>;
  readFile: (path: string) => Promise<string | null>;
  writeFile: (data: { filePath: string; content: string }) => Promise<{ success: boolean; error?: string }>;
  publishPackage: (data: { cwd: string; registry: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
}

interface Window {
  electronAPI: ElectronAPI;
}
