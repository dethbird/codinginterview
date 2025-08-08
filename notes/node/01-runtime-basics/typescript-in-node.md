**typescript-in-node.md**

# TypeScript in Node.js

## 📌 Definition

TypeScript (TS) is a superset of JavaScript that adds **static typing** and **type-checking**.
 In Node.js, it’s used to:

- Catch errors at compile-time.
- Improve developer experience with IntelliSense.
- Enforce code contracts in large codebases.

------

## 🛠 Basic Setup

1. **Install dependencies**

```bash
npm install --save-dev typescript ts-node @types/node
```

- `typescript` → Compiler (`tsc`).
- `ts-node` → Run TS files directly.
- `@types/node` → Type definitions for Node.js built-in modules.

------

1. **Initialize TypeScript config**

```bash
npx tsc --init
```

Generates a `tsconfig.json` file.

------

## 📋 Key `tsconfig.json` Fields (Interview-relevant)

Example:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Common options:

- **`target`** → JS version output (e.g., `ES2020`, `ES5`).
- **`module`** → Module system (`ESNext` for ESM, `CommonJS` for require).
- **`moduleResolution`** → How imports are resolved (`node` for Node-style).
- **`outDir`** → Output folder for compiled JS.
- **`rootDir`** → Base folder for TS source files.
- **`strict`** → Enables all strict type-checking.
- **`esModuleInterop`** → Allows default imports from CommonJS modules.
- **`skipLibCheck`** → Skips type checking of `.d.ts` files (faster builds).

------

## 📋 Example Project Structure

```
src/
  server.ts
tsconfig.json
package.json
```

------

## 🛠 Running TypeScript in Node.js

**Option 1 — Compile then run:**

```bash
npx tsc       # compiles to /dist
node dist/server.js
```

**Option 2 — Direct with ts-node:**

```bash
npx ts-node src/server.ts
```

------

## 📋 Example: Typed Express Server

```ts
// src/server.ts
import express, { Request, Response } from 'express';

const app = express();

app.get('/user/:id', (req: Request, res: Response) => {
  const userId: string = req.params.id; // Explicitly typed
  res.json({ id: userId, name: "Alice" });
});

app.listen(3000, () => console.log('Server running'));
```

**Benefits:**

- Type checks request parameters.
- Auto-completion for Express methods.

------

## 🛠 Real-World Pattern: Type-safe Config Loader

```ts
type Config = {
  port: number;
  dbUrl: string;
};

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  dbUrl: process.env.DB_URL ?? "postgres://localhost/db"
};

export default config;
```

This ensures no missing or incorrectly typed env variables slip through.

------

## ✅ Interview Tips

- Know how to **set up `tsconfig.json`** from scratch.
- Be able to explain **`esModuleInterop`** and **`moduleResolution`**.
- Expect a question like “**How would you add TypeScript to an existing Node.js project?**”

------

Next up is:
 **callbacks-promises-async-await.md** — where we’ll break down async patterns, parameters for each, and real-world use cases.

Do you want me to **cover `error-first callbacks`** in depth there? They’re a favorite in interviews for legacy Node.js work.