# Game Tech Manager

**Game Tech Manager** is a dual-engine package management solution designed for game development studios. It streamlines the management of internal npm-based plugins for both **Unreal Engine** and **Unity**, providing a unified workflow for artists, designers, and engineers.

It offers two interfaces:
1.  **Desktop App (GUI):** A modern, Electron-based application for visual management.
2.  **CLI Tool (`gpm`):** A command-line interface for automation and power users.

---

## 🚀 Installation

### Desktop Application (GUI)
1.  Go to the [Releases Page](../../releases).
2.  Download the installer for your OS:
    *   **macOS:** `.dmg` or `.zip`
    *   **Windows:** `.exe`
    *   **Linux:** `.AppImage`
3.  Install and run.
    *   *Note for macOS users:* If you see a "damaged" warning, run `sudo xattr -cr /Applications/Game\ Tech\ Manager.app` in Terminal.

### CLI Tool
You can install the CLI tool globally via npm (after publishing) or link it locally.

```bash
# Install from registry (if published)
npm install -g my-plugin-manager

# Verify installation
gpm --help
```

---

## 📖 User Guide

### 🖥️ Desktop App (GUI)

#### 1. Initial Setup
*   **Select Engine:** Toggle between **Unreal** (Blue) and **Unity** (Black) in the sidebar.
*   **Target Project:** Enter the absolute path to your game project root.
    *   *Unreal:* Folder containing `.uproject`.
    *   *Unity:* Folder containing `Packages/manifest.json`.

#### 2. Configuration (Registry)
Navigate to the **Settings** tab to configure your private package registry (e.g., Verdaccio, Nexus, Artifactory).
*   **Release URL:** For stable production packages.
*   **Snapshot URL:** For development/beta packages.
*   *Settings are saved locally and persist across restarts.*

#### 3. Managing Packages
*   **In Project:** View packages currently installed in your project. The app scans `package.json` (Unreal) or `manifest.json` (Unity).
*   **Nexus Registry:** Browse available packages from the remote registry.
    *   **Install:** Click "Install".
        *   *Unreal:* Runs `npm install` and syncs files to `Plugins/`.
        *   *Unity:* Updates `manifest.json`.
    *   **Update:** If a newer version is available, an "Update" button will appear.

---

### ⌨️ CLI Tool (`gpm`)

The `gpm` (Game Package Manager) command allows you to perform operations without leaving your terminal.

#### 1. Configuration
Set up your registry URLs once.
```bash
gpm config
# Follow the interactive prompts to set Release/Snapshot URLs for both engines.
```

#### 2. Scan Project
List all installed packages in the current directory (or a specific path).
```bash
cd /path/to/my/project
gpm scan

# Or specify path
gpm scan /Users/dev/MyUnrealGame
```

#### 3. Install Package
Install a specific package. The CLI automatically detects if it's an Unreal or Unity project.
```bash
# Syntax: gpm install <package-id> [version]
gpm install com.company.combat 1.2.0

# If version is omitted, defaults to 'latest'
gpm install com.company.networking
```
*   **Unreal Behavior:** runs `npm install`, then executes the `Scripts/sync-plugins.js` helper to copy files to `Plugins/`.
*   **Unity Behavior:** Adds dependency to `Packages/manifest.json`.

---

## 🛠️ Developer Documentation

### Project Architecture

The project is a **Monorepo** containing both the Electron App and the CLI.

*   **`electron/`**: Main process code (Backend logic for GUI).
*   **`src/`**: Renderer process code (React + Tailwind UI).
*   **`cli/`**: Source code for the `gpm` CLI tool.
*   **`scripts/`**: Shared utility scripts (e.g., `sync-plugins.js`).

### Prerequisites
*   Node.js (v18 or v20 recommended)
*   npm

### Local Development

#### 1. Setup
```bash
git clone https://github.com/jacksonon/my-plugin-manager.git
cd my-plugin-manager
npm install
```

#### 2. Running the GUI
Start the Vite dev server and Electron in parallel:
```bash
npm run dev:electron
```

#### 3. Building the CLI
The CLI is written in TypeScript and needs to be compiled.
```bash
npm run build:cli

# Link command globally for testing
npm link
```
Now you can run `gpm` anywhere on your machine.

### Building for Production

To generate installers (GUI) and compile the CLI:

```bash
npm run build
```

*   **GUI Artifacts:** Located in `release/` (dmg, exe, AppImage).
*   **CLI Artifacts:** Located in `dist-cli/` (JS files).

### Release Process
The project uses **GitHub Actions** for CI/CD.
1.  Update version in `package.json`.
2.  Push code to `main`.
3.  Create and push a tag (e.g., `v1.0.9`).
    ```bash
    git tag v1.0.9
    git push origin v1.0.9
    ```
4.  GitHub Actions will automatically build artifacts and create a GitHub Release.

---

### 📂 Directory Structure

```text
├── .github/            # CI/CD Workflows
├── cli/                # CLI Source Code (index.ts)
├── electron/           # Electron Main Process (main.ts, preload.ts)
├── scripts/            # Shared Scripts (sync-plugins.js)
├── src/                # React Frontend (App.tsx, components)
├── dist/               # Compiled Frontend
├── dist-electron/      # Compiled Electron Backend
├── dist-cli/           # Compiled CLI Tool
├── package.json        # Project Manifest & Scripts
└── vite.config.ts      # Vite Configuration
```