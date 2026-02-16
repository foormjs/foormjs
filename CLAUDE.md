# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**foormjs** is a TypeScript monorepo providing validatable forms as Vue renderless wrapper components. Users bring their own favourite Vue UI components and wrap them in foormjs renderless components to build automated, validated forms.

The core form model (`foorm`) defines fields, validators, and computed properties that can be serialized for wire transport — enabling backend-controlled forms where the server defines the form structure and validators run on both ends. Uses `@prostojs/serialize-fn` / `@prostojs/deserialize-fn` to convert functions to strings for transport.

## Commands

```bash
pnpm install                    # Install dependencies
node ./scripts/bootstrap        # Scaffold package.json/index.ts stubs for packages
node ./scripts/build            # Build all public packages (rollup, parallel)
node ./scripts/build foorm      # Build a specific package
pnpm test                       # Run tests (jest --runInBand)
pnpm test:cov                   # Run tests with coverage
pnpm lint                       # Lint TypeScript source files
```

The Vue package (`packages/vue`) uses Vite instead of rollup — run `pnpm dev` and `pnpm build` from within that directory.

## Monorepo Structure

| Package | Published Name | Build Tool | Description |
|---------|---------------|------------|-------------|
| `packages/foorm` | `foorm` | rollup | Core form model with serializer/deserializer for backend-controlled forms |
| `packages/vue` | `@foormjs/vue` | vite | Renderless Vue components built on top of foorm core |
| `packages/flags` | `@foormjs/flags` | rollup | Lightweight country flags for phone inputs (planned for removal) |
| `packages/moost` | `@foormjs/moost` | — | Planned moost integration (stub, design TBD) |

Workspace managed by pnpm (`pnpm-workspace.yaml`). Path aliases in `tsconfig.json`: `foorm` → `packages/foorm/src`, `@foormjs/*` → `packages/*/src`.

## Architecture

**Core (`packages/foorm`)**: The `Foorm` class holds an array of `TFoormEntry` objects defining form fields. Most entry properties (label, disabled, validators, etc.) accept either a static value or a function via `TComputed<OF, D, C>`. Functions receive `(data, context)` or `(value, data, context, entry)` arguments and are serialized as `{ __fn__: "..." }` objects for transport.

- `foorm.ts` — `Foorm` class with `validate()` and `getFormValidator()` methods
- `types.ts` — All TypeScript types (`TFoormEntry`, `TFoormSerialized`, `TComputed`, etc.)
- `serialize.ts` — `serializeForm()` converts `Foorm` to JSON-serializable `TFoormSerialized`
- `deserialize.ts` — `deserializeForm()` reconstructs `Foorm` from serialized data
- `utils.ts` — `evalParameter()` resolves computed/function fields to values

**Vue (`packages/vue`)**: Renderless wrapper components that let users plug in their own UI components. `OoForm` wraps `vuiless-forms`'s `VuilessForm`, rendering `OoField` per entry. Users supply components via the `components` prop (by name) or `types` prop (by field type), and can further customize via scoped slots. Each `OoField` is a renderless wrapper around `VuilessField` that resolves computed props and validators, then exposes all field state through its default slot.

## Conventions

- **Commit messages**: Enforced by `scripts/verifyCommit.js` (yorkie hook). Format: `type(scope): description` (max 50 chars). Valid types: `feat`, `fix`, `docs`, `dx`, `style`, `refactor`, `perf`, `test`, `workflow`, `build`, `ci`, `chore`, `types`, `wip`, `release`.
- **ESLint**: No default exports (`import/no-default-export`), sorted imports (`simple-import-sort`), strict equality (`eqeqeq`), declaration-style functions with arrow functions allowed.
- **Prettier**: Single quotes, no semicolons, trailing commas (es5), 100 char print width, 2-space indent.
- **Tests**: Co-located `*.spec.ts` files using Jest with `ts-jest`. Uses snapshot and inline snapshot assertions.
- **Build-time replacements**: `__VERSION__`, `__PROJECT__`, `__DYE_*__` constants are replaced at build time via rollup/replace. In tests, `__VERSION__` is `'JEST_TEST'`.
