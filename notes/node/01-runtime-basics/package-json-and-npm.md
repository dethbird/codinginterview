**package-json-and-npm.md**

# package.json and npm

## 📌 Definition

`package.json` is the **manifest file** for a Node.js project.
 It defines metadata, dependencies, scripts, and configuration for npm/yarn/pnpm.
 Think of it as the "control center" for your project.

------

## 📋 Anatomy of `package.json`

Example:

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "description": "A sample Node.js project",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "keywords": ["node", "example"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "express": "^4.19.0"
  },
  "devDependencies": {
    "jest": "^29.6.0"
  },
  "engines": {
    "node": ">=18"
  }
}
```

------

## 🛠 Key Fields

| Field             | Purpose                                                      |
| ----------------- | ------------------------------------------------------------ |
| `name`            | Package name (must be lowercase, no spaces).                 |
| `version`         | Follows [semver](https://semver.org/) — `MAJOR.MINOR.PATCH`. |
| `main`            | Entry point for CommonJS imports.                            |
| `type`            | `"module"` for ESM, omit or `"commonjs"` for CJS.            |
| `scripts`         | Shortcuts for CLI commands (`npm run <script>`).             |
| `dependencies`    | Runtime dependencies installed in production.                |
| `devDependencies` | Dependencies only for development/testing.                   |
| `engines`         | Minimum Node version support.                                |

------

## 📋 Dependency Types & Install Commands

### Regular Dependency

```bash
npm install express
```

- Saved under `"dependencies"`.
- Needed in production.

### Dev Dependency

```bash
npm install --save-dev jest
```

- Saved under `"devDependencies"`.
- Not required in production (e.g., testing tools).

### Global Dependency

```bash
npm install -g nodemon
```

- Installed system-wide (not in `package.json`).

------

## 🛠 Real-World Example: Environment-specific scripts

```json
"scripts": {
  "start": "NODE_ENV=production node server.js",
  "dev": "NODE_ENV=development nodemon server.js",
  "test": "jest --coverage"
}
```

In a job, you'd often switch between **dev mode** (hot reload) and **prod mode** (optimized run).

------

## 📦 Version Ranges in Dependencies

- `"^1.2.3"` → Updates **minor** and **patch** versions (`1.x.x`).
- `"~1.2.3"` → Updates only **patch** versions (`1.2.x`).
- `"1.2.3"` → Exact version only.
- `"*"` → Any version (risky in production).

------

## ⚡ Useful npm Commands

```bash
npm init -y            # Create default package.json
npm run dev            # Run a custom script
npm install            # Install all deps from package.json
npm outdated           # See outdated packages
npm audit fix          # Fix vulnerabilities
npm uninstall pkgname  # Remove dependency
```

------

## ✅ Interview Tips

- Be ready to **explain `dependencies` vs `devDependencies`**.
- Know how to **lock versions** (package-lock.json).
- Employers may ask you to **add a new script** or **migrate to ESM** by editing `package.json`.

------

Next up:
 **typescript-in-node.md** — covering TypeScript setup, configuration, and usage in Node.js.
 Do you want me to also include **tsconfig.json field explanations** in that one? That’s a common interview question.