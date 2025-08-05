# tsconfig Guide

## Overview

The `tsconfig.json` file configures the behavior of the TypeScript compiler for a project, specifying files, compiler options, and other settings.

------

## Basic Structure

```json
{
  "compilerOptions": {
    "target": "ES6",
    "module": "commonjs",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.spec.ts"]
}
```

------

## Important Compiler Options

| Option             | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `target`           | ECMAScript target version (`ES5`, `ES6`, etc.)        |
| `module`           | Module system (`commonjs`, `esnext`, etc.)            |
| `strict`           | Enables all strict type-checking options              |
| `strictNullChecks` | Enable strict handling of `null` and `undefined`      |
| `outDir`           | Directory to output compiled JavaScript               |
| `rootDir`          | Root directory of source files                        |
| `esModuleInterop`  | Enables compatibility between CommonJS and ES Modules |
| `skipLibCheck`     | Skip type checking of declaration files               |
| `noImplicitAny`    | Raise error on expressions with implicit `any` type   |

------

## Includes and Excludes

- `include` defines files to compile.
- `exclude` prevents files from being compiled (defaults to excluding `node_modules`).

------

## Example: Strict Mode

Enabling strict mode:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

This turns on many safety flags like `noImplicitAny`, `strictNullChecks`, and more.

------

## Interview Tips

- Know purpose of `tsconfig.json` in a project.
- Understand commonly used compiler options.
- Be ready to explain `strict` mode and its benefits.

