const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = process.cwd(); // Executed from project root
const NODE_MODULES_PATH = path.join(PROJECT_ROOT, 'node_modules');
const UE_PLUGINS_SCOPE = '@ue-plugins';
const SOURCE_DIR = path.join(NODE_MODULES_PATH, UE_PLUGINS_SCOPE);
const DEST_PLUGINS_DIR = path.join(PROJECT_ROOT, 'Plugins');

console.log(`Syncing plugins from ${SOURCE_DIR} to ${DEST_PLUGINS_DIR}...`);

if (!fs.existsSync(SOURCE_DIR)) {
  console.log('No @ue-plugins found in node_modules.');
  process.exit(0);
}

if (!fs.existsSync(DEST_PLUGINS_DIR)) {
  fs.mkdirSync(DEST_PLUGINS_DIR, { recursive: true });
}

// Helper to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const plugins = fs.readdirSync(SOURCE_DIR, { withFileTypes: true });

for (const plugin of plugins) {
  if (!plugin.isDirectory()) continue;
  
  const pluginName = plugin.name;
  const pluginSrcPath = path.join(SOURCE_DIR, pluginName);
  const pluginDestPath = path.join(DEST_PLUGINS_DIR, pluginName);
  
  // 1. Check for .uplugin file
  const files = fs.readdirSync(pluginSrcPath);
  const hasUPlugin = files.some(file => file.endsWith('.uplugin'));
  
  if (!hasUPlugin) {
    console.log(`Skipping ${pluginName}: No .uplugin file found.`);
    continue;
  }
  
  // 2. Check for "unity" field in package.json
  const packageJsonPath = path.join(pluginSrcPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (pkg.unity) {
        console.log(`Skipping ${pluginName}: Marked for Unity.`);
        continue;
      }
    } catch (e) {
      console.warn(`Warning: Could not read package.json for ${pluginName}`);
    }
  }
  
  // 3. Copy
  console.log(`Copying ${pluginName}...`);
  try {
    // Basic copy - in production you might want to clear destination first or use rsync
    copyDir(pluginSrcPath, pluginDestPath);
    console.log(`Successfully synced ${pluginName}`);
  } catch (err) {
    console.error(`Failed to copy ${pluginName}:`, err);
  }
}

console.log('Sync complete.');
