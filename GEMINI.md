# Project Context: my-plugin-manager

## Overview
This is a frontend web application initialized with **Vite**, using **React** and **TypeScript**. 
Currently, the project matches the default Vite template for React + SWC/TypeScript. No custom business logic has been implemented yet.

## Tech Stack
- **Framework:** React 19
- **Build Tool:** Vite 7
- **Language:** TypeScript (~5.9)
- **Linting:** ESLint 9
- **Package Manager:** npm (implied by `package-lock.json`)

## Key Commands
| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server with HMR. |
| `npm run build` | Runs TypeScript compilation (`tsc -b`) and builds the app for production. |
| `npm run lint` | Runs ESLint to check for code quality issues. |
| `npm run preview` | Previews the production build locally. |

## Project Structure
- **`src/`**: Contains the application source code.
    - `App.tsx`: Main component (currently default template).
    - `main.tsx`: Entry point rendering the React root.
- **`public/`**: Static assets served at the root.
- **`vite.config.ts`**: Configuration for Vite.
- **`tsconfig.app.json`**: TypeScript configuration for the application code.
- **`tsconfig.node.json`**: TypeScript configuration for Node.js scripts (like vite config).

## Development Conventions
- **Strict Mode:** TypeScript `strict` mode is enabled.
- **Linting:** ESLint is configured for React hooks and refresh.
- **Module Resolution:** Uses `bundler` resolution strategy.
