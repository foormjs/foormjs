# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**foormjs** is an ATScript-first TypeScript monorepo providing validatable forms as Vue renderless wrapper components. Users bring their own Vue UI components and wrap them in foormjs renderless components to build automated, validated forms.

Forms are defined in ATScript `.as` files — a TypeScript superset with custom annotation syntax. The `@atscript/typescript` compiler processes these files into annotated type objects carrying metadata maps, which foormjs reads at runtime to resolve field properties, validators, and computed values on demand.

## Commands

```bash
pnpm install                    # Install dependencies
node ./scripts/build            # Build all public packages (rollup, parallel)
node ./scripts/build foorm      # Build a specific package
pnpm test                       # Run tests (vitest + Playwright e2e)
pnpm test:cov                   # Run tests with coverage
pnpm lint                       # Lint with oxlint
pnpm lint:fix                   # Lint and auto-fix
pnpm format                     # Format with oxfmt
pnpm format:check               # Check formatting
pnpm check                      # Lint + format check
```

The Vue package (`packages/vue`) uses Vite — run `pnpm dev` and `pnpm build` from within that directory. Packages with `customBuild: true` in their package.json delegate to their own `pnpm build` (vite) instead of rollup.

## Monorepo Structure

| Package          | Published Name | Build Tool | Description                                           |
| ---------------- | -------------- | ---------- | ----------------------------------------------------- |
| `packages/foorm` | `foorm`        | rollup     | ATScript-first form model with validation             |
| `packages/vue`   | `@foormjs/vue` | vite       | Renderless Vue components built on top of foorm core  |

Two export paths for foorm: `foorm` (runtime) and `foorm/plugin` (ATScript plugin for build-time/IDE usage).

Workspace managed by pnpm (`pnpm-workspace.yaml`). Path aliases in `tsconfig.json`: `foorm` → `packages/foorm/src`, `@foormjs/*` → `packages/*/src`.

## Architecture

### ATScript (`.as` files)

ATScript is the foundation. Forms are defined as annotated interfaces in `.as` files:

```typescript
@foorm.fn.title '(data) => "User " + (data.firstName || "<unknown>")'
@foorm.submit.text 'Register'
export interface MyForm {
    @meta.label 'First Name'
    @foorm.type 'text'
    @foorm.validate '(v) => !!v || "First name is required"'
    firstName: string

    @foorm.fn.placeholder '(v, data) => data.firstName ? "Same as " + data.firstName + "?" : "Doe"'
    lastName: string

    @foorm.options 'United States', 'us'
    @foorm.options 'Canada', 'ca'
    country?: foorm.select
}
```

The `@atscript/typescript` compiler generates `.as.d.ts` declarations and runtime annotated type objects where metadata is accessible via `prop.metadata.get('key')`. The `unplugin-atscript` Vite plugin handles `.as` file processing at build time.

### Core (`packages/foorm`)

**`src/runtime/`** — Main runtime (exported as `foorm`):

- `create-foorm.ts` — `createFoormDef(annotatedType)` converts an ATScript annotated type into a `FoormDef` (thin `{ type, fields, flatMap }` object). Fields are `FoormFieldDef` pointers to ATScript props, not copies.
- `utils.ts` — `resolveFieldProp()`, `resolveFormProp()`, `resolveOptions()`, `resolveAttrs()`, `createFormData()`, `evalComputed()`, `getByPath()`/`setByPath()`. Properties are resolved lazily on demand — `resolveFieldProp(prop, fnKey, staticKey, scope)` checks `foorm.fn.*` first (compiles fn string), then falls back to static metadata key.
- `fn-compiler.ts` — `compileFieldFn()`, `compileTopFn()`, `compileValidatorFn()` using `FNPool` from `@prostojs/deserialize-fn` for cached function compilation.
- `validate.ts` — `getFormValidator(def)` returns a reusable validator using ATScript's `Validator` class + `foormValidatorPlugin`.
- `validator-plugin.ts` — `foormValidatorPlugin()` ATScript validator plugin handling disabled/hidden skip, required checks, and `@foorm.validate` custom validators.
- `types.ts` — `FoormDef`, `FoormFieldDef`, `TFoormFnScope`, `TComputed`, `TFoormFieldEvaluated`, `TFoormEntryOptions`.

**`src/plugin/`** — ATScript plugin (exported as `foorm/plugin`):

- `foorm-plugin.ts` — `foormPlugin(opts?)` registers all foorm annotations and primitives with `@atscript/core`. Used in `atscript.config.ts` for IDE annotation completion/validation.
- `annotations.ts` — Full `AnnotationSpec` tree for `@foorm.*` and `@foorm.fn.*` annotations (title, submit, type, component, label, disabled, hidden, validate, options, attrs, etc.).
- `primitives.ts` — ATScript primitive types: `foorm.action`, `foorm.paragraph`, `foorm.select`, `foorm.radio`, `foorm.checkbox`.

### Vue (`packages/vue`)

Renderless wrapper components letting users plug in their own UI components.

- `src/composables/use-foorm.ts` — `useFoorm(annotatedType)` returns `{ def, formData }` where `def` is `FoormDef` and `formData` is reactive.
- `src/components/oo-form.vue` — `OoForm` wraps `VuilessForm`, resolves form-level props via `resolveFormProp()`, renders `OoField` per field. Slots: `form.header`, `form.before`, `field:{type}`, `form.after`, `form.submit`, `form.footer`. Component resolution: `@foorm.component` → `components` prop → `types` prop → built-in defaults.
- `src/components/oo-field.vue` — `OoField` resolves all field properties through ATScript metadata. Two-path optimization: `allStatic` fast path (no Vue computeds) vs dynamic path (per-property computed detection via `foorm.fn.*`). Lazy scope construction: `baseScope` for constraints, `fullScope` for display/validators.
- `src/components/types.ts` — `TFoormComponentProps` interface that custom components must satisfy.
- `src/forms/` — ATScript `.as` form definitions (e.g. `e2e-test-form.as` for E2E testing).

### Key Performance Patterns

- **Metadata-on-demand resolve**: `FoormFieldDef` keeps a thin pointer to the ATScript prop; properties are resolved lazily via `resolveFieldProp()` rather than eagerly copied.
- **`allStatic` optimization**: `OoField` checks `field.allStatic` (no `foorm.fn.*` or `foorm.validate` annotations) to skip creating Vue `computed()` refs entirely for static fields.
- **`FNPool` caching**: Function strings are compiled once and cached — the same `foorm.fn.label` string across multiple fields only gets compiled once.
- **Dual-scope pattern**: `baseScope` (v, data, context) evaluates constraints (disabled/hidden) first; `fullScope` adds `entry` for display/validation functions, avoiding circular dependency.

### Annotation Reference

Form-level: `@foorm.title`, `@foorm.submit.text`, `@foorm.fn.title`, `@foorm.fn.submit.text`, `@foorm.fn.submit.disabled`

Field-level static: `@foorm.type`, `@foorm.component`, `@foorm.autocomplete`, `@foorm.altAction`, `@foorm.value`, `@foorm.order`, `@foorm.hidden`, `@foorm.disabled`, `@foorm.readonly`, `@foorm.options` (multi), `@foorm.attr` (multi), `@foorm.validate` (multi)

Field-level computed (`@foorm.fn.*`): `label`, `description`, `hint`, `placeholder`, `disabled`, `hidden`, `readonly`, `optional`, `value`, `classes`, `styles`, `options`, `attr` (multi)

All `@foorm.fn.*` take a JS function string `(v, data, context, entry) => result`.

Standard ATScript metadata also used: `@meta.label`, `@meta.description`, `@meta.hint`, `@meta.placeholder`, `@expect.maxLength`, `@expect.min`, etc.

## Conventions

- **Commit messages**: Enforced by `scripts/verifyCommit.js` (yorkie hook). Format: `type(scope): description` (max 50 chars). Valid types: `feat`, `fix`, `docs`, `dx`, `style`, `refactor`, `perf`, `test`, `workflow`, `build`, `ci`, `chore`, `types`, `wip`, `release`.
- **Linting**: oxlint (`.oxlintrc.json`). Key rules: no default exports (`import/no-default-export`), strict equality (`eqeqeq`), consistent type imports (`typescript/consistent-type-imports`), no explicit any (warn).
- **Formatting**: oxfmt.
- **Tests**: Co-located `*.spec.ts` files using vitest (`globals: true`). Vue E2E tests use Playwright (`packages/vue/e2e/`).
- **Build-time replacements**: `__VERSION__`, `__PROJECT__`, `__DYE_*__` constants are replaced at build time via rollup/replace.
