import { useState, useEffect } from 'react';
import { Package, Download, Upload, Search, Settings, Layers, Folder, RefreshCw, CheckCircle, AlertCircle, Trash2, ArrowRight, Box, Save, FileCode, Send } from 'lucide-react';

// --- Types ---
type Engine = 'unreal' | 'unity';
type Tab = 'project' | 'registry' | 'publish' | 'settings';

interface RegistryPackage {
  id: string;
  name: string;
  version: string | null;
  latest: string;
  description: string;
  author: string;
  category: string;
  engines: Engine[];
  dependencies: string[];
}

interface InstalledPackage {
  id: string;
  version: string;
}

interface AppSettings {
  unreal: { release: string; snapshot: string };
  unity: { release: string; snapshot: string };
}

// --- Mock Registry Data ---
const MOCK_REMOTE_PACKAGES: RegistryPackage[] = [
  {
    id: 'com.company.network',
    name: 'Core Networking',
    version: '1.2.0',
    latest: '1.2.0',
    description: 'Standardized networking layer for all MMO projects.',
    author: 'Tech Art Team',
    category: 'Core',
    engines: ['unreal', 'unity'],
    dependencies: []
  },
  {
    id: 'com.company.ui-kit',
    name: 'Common UI Kit',
    version: '2.0.1',
    latest: '2.1.0',
    description: 'Shared UMG/UGUI widgets and styles.',
    author: 'UI Team',
    category: 'UI',
    engines: ['unreal', 'unity'],
    dependencies: ['com.company.network']
  },
  {
    id: 'com.company.analytics',
    name: 'Game Analytics',
    version: '0.9.0',
    latest: '0.9.5',
    description: 'Firebase and GA wrapper.',
    author: 'Backend Team',
    category: 'Services',
    engines: ['unreal'],
    dependencies: []
  },
  {
    id: 'com.company.unity-tools',
    name: 'Unity Editor Tools',
    version: null,
    latest: '3.0.0',
    description: 'Custom inspectors and build pipeline tools.',
    author: 'Tools Team',
    category: 'Editor',
    engines: ['unity'],
    dependencies: []
  },
  {
    id: 'com.company.interaction',
    name: 'Interaction System',
    version: null,
    latest: '1.0.0',
    description: 'GAS based interaction framework.',
    author: 'Gameplay Team',
    category: 'Gameplay',
    engines: ['unreal'],
    dependencies: []
  }
];

export default function App() {
  const [engine, setEngine] = useState<Engine>('unreal');
  const [activeTab, setActiveTab] = useState<Tab>('project');
  const [projectPath, setProjectPath] = useState<string>('/Users/os/Documents/MyGameProject');
  const [installedPackages, setInstalledPackages] = useState<InstalledPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<RegistryPackage | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    unreal: { release: '', snapshot: '' },
    unity: { release: '', snapshot: '' }
  });

  // Load settings on mount
  useEffect(() => {
    window.electronAPI.getSettings().then(setSettings);
  }, []);

  // Scan when engine or path changes
  useEffect(() => {
    handleScan();
  }, [engine, projectPath]);

  const handleScan = async () => {
    setSyncStatus('syncing');
    setStatusMsg('Scanning...');
    try {
      const result = await window.electronAPI.scanInstalled({ engine, projectPath });
      setInstalledPackages(result);
      setSyncStatus('idle');
      setStatusMsg('Ready');
    } catch (e) {
      setSyncStatus('error');
      setStatusMsg('Scan failed');
    }
  };

  const handleInstall = async (pkgId: string, version: string) => {
    setSyncStatus('syncing');
    setStatusMsg(`Installing ${pkgId}...`);
    try {
      const res = await window.electronAPI.installPackage({
        engine,
        projectPath,
        packageId: pkgId,
        version
      });

      if (res.success) {
        setSyncStatus('success');
        setStatusMsg('Installed successfully');
        handleScan(); // Refresh list
        setTimeout(() => setSyncStatus('idle'), 2000);
      } else {
        setSyncStatus('error');
        setStatusMsg(res.error || 'Install failed');
      }
    } catch (e: any) {
      setSyncStatus('error');
      setStatusMsg(e.message);
    }
  };

  const handleSaveSettings = async () => {
    setSyncStatus('syncing');
    await window.electronAPI.saveSettings(settings);
    setSyncStatus('success');
    setStatusMsg('Settings saved');
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const handleUninstall = async (pkgId: string) => {
    // Placeholder: Real uninstall logic would be needed in electronAPI
    console.log(`Uninstalling ${pkgId}`);
    alert("Uninstall not implemented in this demo.");
  };

  // Filter packages based on active tab and search
  const displayedPackages: RegistryPackage[] = (() => {
    if (activeTab === 'project') {
      return installedPackages.map(inst => {
        const meta = MOCK_REMOTE_PACKAGES.find(p => p.id === inst.id);
        if (meta) {
          return { ...meta, version: inst.version };
        }
        return {
          id: inst.id,
          name: inst.id,
          version: inst.version,
          latest: '?',
          description: 'Local package not found in registry.',
          author: 'Unknown',
          category: 'Local',
          engines: [engine],
          dependencies: []
        };
      });
    }
    return MOCK_REMOTE_PACKAGES.filter(p => p.engines.includes(engine));
  })();

  const filteredPackages = displayedPackages.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Theme Config
  const theme = engine === 'unreal' ? {
    bg: 'bg-slate-900',
    sidebar: 'bg-slate-950',
    accent: 'bg-blue-600',
    textAccent: 'text-blue-400',
    border: 'border-slate-800',
    icon: 'U',
    path: 'Plugins/'
  } : {
    bg: 'bg-zinc-900',
    sidebar: 'bg-black',
    accent: 'bg-gray-200 text-black',
    textAccent: 'text-zinc-200',
    border: 'border-zinc-800',
    icon: 'Unity',
    path: 'Packages/'
  };

  return (
    <div className={`flex h-screen ${theme.bg} text-slate-200 font-sans overflow-hidden transition-colors duration-500`}>
      {/* Sidebar */}
      <div className={`w-64 ${theme.sidebar} border-r ${theme.border} flex flex-col`}>
        <div className={`p-4 flex items-center gap-2 border-b ${theme.border}`}>
          <div className={`w-8 h-8 ${engine === 'unreal' ? 'bg-blue-600' : 'bg-white'} rounded flex items-center justify-center transition-colors`}>
            {engine === 'unreal' ? (
                <span className="font-bold text-white">U</span>
            ) : (
                <Box size={20} className="text-black fill-black" />
            )}
          </div>
          <span className="font-bold text-lg tracking-tight">Plugin Manager</span>
        </div>

        {/* Engine Switcher */}
        <div className="px-2 py-3">
          <div className={`flex bg-gray-800/50 p-1 rounded-lg border ${theme.border}`}>
             <button 
               onClick={() => setEngine('unreal')}
               className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${engine === 'unreal' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
             >
               Unreal Engine
             </button>
             <button 
               onClick={() => setEngine('unity')}
               className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${engine === 'unity' ? 'bg-white text-black shadow' : 'text-slate-400 hover:text-white'}`}
             >
               Unity
             </button>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          <button
            onClick={() => { setActiveTab('project'); setSelectedPkg(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'project' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <Layers size={18} />
            In Project
          </button>
          <button
            onClick={() => { setActiveTab('registry'); setSelectedPkg(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'registry' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <Download size={18} />
            Nexus Registry
          </button>
          <button
            onClick={() => { setActiveTab('publish'); setSelectedPkg(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'publish' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <Upload size={18} />
            Publish Tool
          </button>
        </nav>

        <div className="p-2 border-t border-b border-gray-800">
           <button
            onClick={() => { setActiveTab('settings'); setSelectedPkg(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <Settings size={18} />
            Settings
          </button>
        </div>

        <div className={`p-4 border-t ${theme.border}`}>
          <div className="flex flex-col gap-2 mb-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <Folder size={12} />
                    <span>Target Project:</span>
                </div>
                <button 
                    onClick={async () => {
                        const path = await window.electronAPI.selectDirectory();
                        if (path) setProjectPath(path);
                    }}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                    Select
                </button>
            </div>
            <input 
                type="text" 
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-white/30 w-full"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-green-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Nexus Online
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`h-16 border-b ${theme.border} bg-opacity-50 flex items-center justify-between px-6`}>
          <div className="text-lg font-medium text-white">
            {activeTab === 'project' && `Installed ${engine === 'unreal' ? 'Plugins' : 'Packages'}`}
            {activeTab === 'registry' && 'Browse Packages'}
            {activeTab === 'publish' && 'Publish to Nexus'}
            {activeTab === 'settings' && 'Registry Settings'}
          </div>
          
          <div className="flex items-center gap-4">
             {/* Sync Indicator */}
             {syncStatus !== 'idle' && (
              <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${syncStatus === 'error' ? 'bg-red-900/20 border-red-800' : 'bg-slate-800 border-slate-700'}`}>
                {syncStatus === 'syncing' ? (
                   <RefreshCw size={14} className={`animate-spin ${theme.textAccent}`} />
                ) : syncStatus === 'success' ? (
                   <CheckCircle size={14} className="text-green-400" />
                ) : (
                   <AlertCircle size={14} className="text-red-400" />
                )}
                <span className={syncStatus === 'success' ? 'text-green-400' : syncStatus === 'error' ? 'text-red-400' : 'text-slate-300'}>
                  {statusMsg || 'Ready'}
                </span>
              </div>
            )}
            
            {activeTab !== 'settings' && activeTab !== 'publish' && (
                <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Search packages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black/20 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-white/30 w-64"
                />
                </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
            {activeTab === 'settings' ? (
                <SettingsView settings={settings} setSettings={setSettings} onSave={handleSaveSettings} />
            ) : activeTab === 'publish' ? (
                <PublishView engine={engine} settings={settings} />
            ) : (
            <>
            {/* List View - Width Dynamic */}
            <div className={`${selectedPkg ? 'w-1/2' : 'w-full'} overflow-y-auto border-r ${theme.border} p-4 space-y-2 transition-all duration-300`}>
                {filteredPackages.length > 0 ? (
                filteredPackages.map(pkg => {
                    const installed = installedPackages.find(i => i.id === pkg.id);
                    const isUpdateAvailable = installed && installed.version !== pkg.latest;
                    
                    return (
                    <div 
                        key={pkg.id}
                        onClick={() => setSelectedPkg(pkg)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedPkg?.id === pkg.id 
                        ? 'bg-white/10 border-white/30'
                        : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-slate-200">{pkg.name}</h3>
                        {installed && (
                            <span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded">
                            v{installed.version}
                            </span>
                        )}
                        </div>
                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">{pkg.description}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{pkg.id}</span>
                        {pkg.engines.length > 1 && (
                            <span className="text-slate-600 flex items-center gap-1">
                                <Box size={10} /> Multi-Engine
                            </span>
                        )}
                        {isUpdateAvailable && (
                            <span className="flex items-center gap-1 text-amber-400">
                            <AlertCircle size={12} />
                            v{pkg.latest}
                            </span>
                        )}
                        </div>
                    </div>
                    );
                })
                ) : (
                <div className="text-center text-slate-500 mt-20">
                    <Package size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No packages found.</p>
                </div>
                )}
            </div>

            {/* Details View - Conditional Render */}
            {selectedPkg && (
                <div className="w-1/2 bg-black/20 p-6 overflow-y-auto animate-in slide-in-from-right-10 fade-in duration-200">
                    <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono bg-white/10 text-slate-300 px-2 py-0.5 rounded border border-white/10">
                        {selectedPkg.category}
                        </span>
                        <span className="text-xs text-slate-500">Authored by {selectedPkg.author}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{selectedPkg.name}</h1>
                    <code className="text-sm text-slate-500">{selectedPkg.id}</code>
                    </div>

                    <div className="p-4 bg-black/40 rounded border border-white/10 mt-6">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                    <p className="text-slate-300 leading-relaxed">{selectedPkg.description}</p>
                    </div>

                    <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                        <span className="text-slate-400">Latest Version</span>
                        <span className="text-white font-mono">{selectedPkg.latest}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                        <span className="text-slate-400">Supported Engines</span>
                        <div className="flex gap-2">
                            {selectedPkg.engines.map(e => (
                                <span key={e} className="text-xs bg-white/10 px-2 py-1 rounded capitalize text-slate-300">{e}</span>
                            ))}
                        </div>
                    </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-8">
                    {(() => {
                        const installed = installedPackages.find(i => i.id === selectedPkg.id);
                        
                        if (!installed) {
                        return (
                            <button 
                            onClick={() => handleInstall(selectedPkg.id, selectedPkg.latest)}
                            disabled={syncStatus === 'syncing'}
                            className={`w-full py-3 ${engine === 'unreal' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-200 hover:bg-white text-black'} rounded-md font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50`}
                            >
                            <Download size={18} />
                            Install v{selectedPkg.latest}
                            </button>
                        );
                        }

                        if (installed.version !== selectedPkg.latest) {
                        return (
                            <div className="flex gap-2">
                            <button 
                                onClick={() => handleInstall(selectedPkg.id, selectedPkg.latest)}
                                disabled={syncStatus === 'syncing'}
                                className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-md font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={18} />
                                Update to v{selectedPkg.latest}
                            </button>
                            <button 
                                onClick={() => handleUninstall(selectedPkg.id)}
                                disabled={syncStatus === 'syncing'}
                                className="px-4 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900 rounded-md transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                            </div>
                        );
                        }

                        return (
                        <div className="flex gap-2">
                            <button 
                                className="flex-1 py-3 bg-white/5 text-slate-400 cursor-not-allowed rounded-md font-medium flex items-center justify-center gap-2"
                                disabled
                            >
                                <CheckCircle size={18} />
                                Up to Date (v{installed.version})
                            </button>
                            <button 
                                onClick={() => handleUninstall(selectedPkg.id)}
                                disabled={syncStatus === 'syncing'}
                                className="px-4 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900 rounded-md transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        );
                    })()}
                    
                    <div className="mt-4 p-3 bg-white/5 rounded text-xs text-slate-500 flex items-start gap-2">
                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                        {engine === 'unreal' ? (
                            <p>
                            Installing will update <code>package.json</code> and sync contents to <code>Plugins/{selectedPkg.name}</code>.
                            </p>
                        ) : (
                            <p>
                            Installing will update <code>Packages/manifest.json</code>. Unity UPM will handle the download automatically.
                            </p>
                        )}
                    </div>
                    </div>

                </div>
            )}
            </>
            )}
        </div>
      </div>
    </div>
  );
}

// --- Sub Components ---

function SettingsView({ settings, setSettings, onSave }: any) {
    return (
        <div className="p-8 w-full max-w-3xl mx-auto overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Settings className="text-slate-400" />
                Package Registry Configuration
            </h2>
            
            <div className="space-y-8">
                {/* Unreal Settings */}
                <div className="bg-slate-950/50 border border-blue-900/30 rounded-lg p-6">
                    <h3 className="text-blue-400 font-semibold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Unreal Engine Source
                    </h3>
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">RELEASE REGISTRY URL</label>
                            <input 
                                type="text" 
                                value={settings.unreal.release}
                                onChange={(e) => setSettings({...settings, unreal: {...settings.unreal, release: e.target.value}})
                                placeholder="https://nexus.company.com/repository/npm-release/"
                                className="w-full bg-black/30 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">SNAPSHOT REGISTRY URL</label>
                            <input 
                                type="text" 
                                value={settings.unreal.snapshot}
                                onChange={(e) => setSettings({...settings, unreal: {...settings.unreal, snapshot: e.target.value}})
                                placeholder="https://nexus.company.com/repository/npm-snapshot/"
                                className="w-full bg-black/30 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Unity Settings */}
                <div className="bg-slate-950/50 border border-zinc-800 rounded-lg p-6">
                    <h3 className="text-zinc-200 font-semibold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        Unity Source
                    </h3>
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">RELEASE SCOPED REGISTRY URL</label>
                            <input 
                                type="text" 
                                value={settings.unity.release}
                                onChange={(e) => setSettings({...settings, unity: {...settings.unity, release: e.target.value}})
                                placeholder="https://nexus.company.com/repository/upm-release/"
                                className="w-full bg-black/30 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:border-white focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">SNAPSHOT SCOPED REGISTRY URL</label>
                            <input 
                                type="text" 
                                value={settings.unity.snapshot}
                                onChange={(e) => setSettings({...settings, unity: {...settings.unity, snapshot: e.target.value}})
                                placeholder="https://nexus.company.com/repository/upm-snapshot/"
                                className="w-full bg-black/30 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:border-white focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        onClick={onSave}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-medium flex items-center gap-2 transition-colors"
                    >
                        <Save size={18} />
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    )
}

function PublishView({ engine, settings }: { engine: string, settings: any }) {
  const [cwd, setCwd] = useState<string>('');
  const [pkgData, setPkgData] = useState<any>({ name: '', version: '1.0.0', description: '', keywords: [] });
  const [status, setStatus] = useState<string>('idle'); // idle, analyzing, ready, publishing, success, error
  const [logs, setLogs] = useState<string>('');

  const handleSelectDir = async () => {
    const path = await window.electronAPI.selectDirectory();
    if (path) {
      setCwd(path);
      analyzeFolder(path);
    }
  };

  const analyzeFolder = async (folderPath: string) => {
    setStatus('analyzing');
    try {
      // 1. Try read package.json
      const pkgJsonStr = await window.electronAPI.readFile(`${folderPath}/package.json`);
      let pkg = pkgJsonStr ? JSON.parse(pkgJsonStr) : {};

      // 2. If Unreal, try read .uplugin
      if (engine === 'unreal') {
        // Need to find .uplugin file first. Since we don't have readdir in frontend exposed, 
        // we'd need backend helper or just assume standard name? 
        // Let's rely on package.json if exists, or basic defaults. 
        // *Better approach*: We should have exposed a listFiles or similar. 
        // But assuming user just picked the folder. 
        // For this demo, let's assume we read package.json or init new. 
        // NOTE: Real impl would parse .uplugin here. 
        // For simplicity, let's simulate uplugin parsing if package.json is missing or simple.
        if (!pkg.name) {
            // Simulate extracting name from folder
            const folderName = folderPath.split(/[/\]/).pop();
            pkg.name = folderName?.toLowerCase();
            pkg.description = "Imported from .uplugin";
        }
      }

      setPkgData({
        name: pkg.name || '',
        version: pkg.version || '1.0.0',
        description: pkg.description || '',
        keywords: pkg.keywords || []
      });
      setStatus('ready');
    } catch (e: any) {
      setLogs(`Analysis error: ${e.message}`);
      setStatus('error');
    }
  };

  const handlePublish = async () => {
    setStatus('publishing');
    setLogs('Generating package.json...');
    
    try {
      // 1. Write package.json
      const content = JSON.stringify(pkgData, null, 2);
      await window.electronAPI.writeFile({ filePath: `${cwd}/package.json`, content });

      // 2. Publish
      const registry = pkgData.version.includes('-') 
        ? (engine === 'unreal' ? settings.unreal.snapshot : settings.unity.snapshot)
        : (engine === 'unreal' ? settings.unreal.release : settings.unity.release);

      if (!registry) {
        throw new Error("No registry configured for this engine/version type.");
      }

      setLogs(prev => prev + `\nPublishing to ${registry}...`);
      
      const res = await window.electronAPI.publishPackage({ cwd, registry });
      
      if (res.success) {
        setStatus('success');
        setLogs(prev => prev + `\n${res.message}\nSUCCESS!`);
      } else {
        setStatus('error');
        setLogs(prev => prev + `\nError: ${res.error}`);
      }

    } catch (e: any) {
      setStatus('error');
      setLogs(prev => prev + `\nException: ${e.message}`);
    }
  };

  return (
    <div className="p-8 w-full max-w-4xl mx-auto h-full flex flex-col">
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Upload className="text-blue-400" />
            Publish Package
        </h2>
        
        <div className="flex gap-4 items-center mb-6">
            <button 
                onClick={handleSelectDir}
                className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
            >
                <Folder size={18} />
                Select {engine === 'unreal' ? 'Plugin' : 'Package'} Folder
            </button>
            <div className="text-sm text-slate-400 font-mono flex-1 truncate bg-black/20 p-2 rounded">
                {cwd || "No folder selected"}
            </div>
        </div>

        {status !== 'idle' && status !== 'analyzing' && (
            <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">PACKAGE ID (NAME)</label>
                        <input 
                            type="text" 
                            value={pkgData.name}
                            onChange={e => setPkgData({...pkgData, name: e.target.value})}
                            className="w-full bg-black/30 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">VERSION</label>
                        <input 
                            type="text" 
                            value={pkgData.version}
                            onChange={e => setPkgData({...pkgData, version: e.target.value})}
                            className="w-full bg-black/30 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">DESCRIPTION</label>
                        <textarea 
                            value={pkgData.description}
                            onChange={e => setPkgData({...pkgData, description: e.target.value})}
                            className="w-full bg-black/30 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none h-24 resize-none"
                        />
                    </div>
                </div>

                <div className="flex flex-col">
                    <div className="flex-1 bg-black/40 border border-slate-800 rounded p-4 font-mono text-xs text-slate-400 whitespace-pre-wrap overflow-auto">
                        <div className="flex items-center gap-2 text-slate-500 mb-2 border-b border-slate-800 pb-2">
                            <FileCode size={14}/> 
                            <span>package.json Preview</span>
                        </div>
                        {JSON.stringify(pkgData, null, 2)}
                    </div>
                    
                    <button 
                        onClick={handlePublish}
                        disabled={status === 'publishing'}
                        className={`mt-4 w-full py-3 rounded font-bold flex items-center justify-center gap-2 transition-colors ${status === 'publishing' 
                            ? 'bg-slate-700 text-slate-400 cursor-wait'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                    >
                        {status === 'publishing' ? <RefreshCw className="animate-spin" /> : <Send size={18} />}
                        {status === 'publishing' ? 'Publishing...' : 'Publish to Nexus'}
                    </button>
                </div>
            </div>
        )}
      </div>

      {logs && (
          <div className="flex-1 bg-black rounded border border-slate-800 p-4 font-mono text-xs text-green-400 overflow-auto whitespace-pre-wrap">
              {logs}
          </div>
      )}
    </div>
  )
}
