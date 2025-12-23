import { useState, useEffect } from 'react';
import { Settings, Box, Gamepad2, FolderOpen, Download, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

// Types
type Engine = 'unreal' | 'unity';
type NavItem = 'project' | 'registry';

interface Package {
  id: string;
  name: string;
  version: string;
  description: string;
}

const MOCK_REGISTRY: Package[] = [
  { id: 'com.example.physics', name: 'AdvPhysics', version: '1.2.0', description: 'Advanced physics simulation engine.' },
  { id: 'com.example.net', name: 'EzNet', version: '2.0.1', description: 'Easy networking for multiplayer games.' },
  { id: 'com.example.ui', name: 'SuperUI', version: '3.5.0', description: 'High performance UI components.' },
  { id: 'com.example.analytics', name: 'GameStats', version: '1.0.0', description: 'Real-time player analytics.' },
];

function App() {
  const [engine, setEngine] = useState<Engine>('unreal');
  const [activeNav, setActiveNav] = useState<NavItem>('registry');
  const [projectPath, setProjectPath] = useState<string>('/Users/os/Documents/MyGameProject');
  const [installed, setInstalled] = useState<{ id: string, version: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    // Clear installed list on engine/path change
    setInstalled([]);
    setStatus(null);
  }, [engine, projectPath]);

  const handleScan = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const result = await window.electronAPI.scanInstalled({ engine, projectPath });
      setInstalled(result);
      setStatus({ type: 'success', msg: `Found ${result.length} packages.` });
    } catch (e: any) {
      setStatus({ type: 'error', msg: 'Scan failed. Check path.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (pkg: Package) => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await window.electronAPI.installPackage({
        engine,
        projectPath,
        packageId: pkg.id,
        version: pkg.version
      });

      if (res.success) {
        setStatus({ type: 'success', msg: res.message || 'Operation successful' });
        handleScan(); // Refresh installed list
      } else {
        setStatus({ type: 'error', msg: res.error || 'Unknown error' });
      }
    } catch (e: any) {
      setStatus({ type: 'error', msg: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-900 text-gray-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col">
        <div className="p-4 flex items-center gap-2 border-b border-neutral-800">
          <Box className="text-blue-500" />
          <h1 className="font-bold text-lg tracking-tight">GamePack</h1>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Engine</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => setEngine('unreal')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                  engine === 'unreal' 
                    ? 'bg-blue-900/20 border-blue-500 text-blue-400' 
                    : 'bg-neutral-900 border-neutral-800 text-gray-400 hover:bg-neutral-800'
                }`}
              >
                <Gamepad2 size={24} />
                <span className="text-xs mt-1">Unreal</span>
              </button>
              <button
                onClick={() => setEngine('unity')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                  engine === 'unity' 
                    ? 'bg-indigo-900/20 border-indigo-500 text-indigo-400' 
                    : 'bg-neutral-900 border-neutral-800 text-gray-400 hover:bg-neutral-800'
                }`}
              >
                <Box size={24} />
                <span className="text-xs mt-1">Unity</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</label>
            <nav className="mt-2 space-y-1">
              <button
                onClick={() => setActiveNav('project')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeNav === 'project' ? 'bg-neutral-800 text-white' : 'text-gray-400 hover:bg-neutral-900'
                }`}
              >
                <FolderOpen size={18} />
                Installed
              </button>
              <button
                onClick={() => setActiveNav('registry')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeNav === 'registry' ? 'bg-neutral-800 text-white' : 'text-gray-400 hover:bg-neutral-900'
                }`}
              >
                <Settings size={18} />
                Registry
              </button>
            </nav>
          </div>
        </div>
        
        <div className="mt-auto p-4 border-t border-neutral-800">
           <div className="text-xs text-gray-600">v0.1.0 Beta</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-4 w-full max-w-2xl">
             <div className="flex-shrink-0 text-gray-400">Project Path:</div>
             <input 
                type="text" 
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
             />
             <button onClick={handleScan} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-gray-300 transition-colors" title="Scan Project">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
             </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {status && (
            <div className={`mb-4 px-4 py-3 rounded border flex items-center gap-2 ${
              status.type === 'success' ? 'bg-green-900/20 border-green-800 text-green-300' : 'bg-red-900/20 border-red-800 text-red-300'
            }`}>
              {status.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
              <span className="text-sm">{status.msg}</span>
            </div>
          )}

          {activeNav === 'registry' && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Settings className="text-purple-400" />
                Package Registry
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MOCK_REGISTRY.map(pkg => (
                  <div key={pkg.id} className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{pkg.name}</h3>
                      <span className="text-xs bg-neutral-900 text-gray-500 px-2 py-0.5 rounded border border-neutral-800">{pkg.version}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4 h-10 line-clamp-2">{pkg.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <code className="text-xs text-gray-600 bg-neutral-900 px-1.5 py-0.5 rounded">{pkg.id}</code>
                      <button 
                        onClick={() => handleInstall(pkg)}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs px-3 py-1.5 rounded transition-colors"
                      >
                        <Download size={14} />
                        Install
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'project' && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FolderOpen className="text-yellow-400" />
                Installed Packages
              </h2>
              {installed.length === 0 ? (
                <div className="text-center py-12 text-gray-500 border border-dashed border-neutral-800 rounded-lg">
                  <p>No packages found or scan not run.</p>
                  <button onClick={handleScan} className="text-blue-400 hover:underline mt-2 text-sm">Scan Now</button>
                </div>
              ) : (
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg divide-y divide-neutral-800">
                  {installed.map((pkg, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded bg-neutral-900 flex items-center justify-center text-gray-500 font-bold text-xs">
                           PKG
                         </div>
                         <div>
                           <div className="font-medium text-gray-200">{pkg.id}</div>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">v{pkg.version}</span>
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;