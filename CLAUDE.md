# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**foormjs** is an ATScript-first TypeScript monorepo providing validatable forms as Vue components with a unified type-based rendering pipeline. Users supply a `types` map (field type → Vue component) and foormjs resolves, validates, and renders the entire form tree automatically.

Forms are defined in ATScript `.as` files — a TypeScript superset with custom annotation syntax. The `@atscript/typescript` compiler processes these files into annotated type objects carrying metadata maps, which foormjs reads at runtime to resolve field properties, validators, and computed values on demand.

## Commands

```bash
pnpm install                    # Install dependencies
node ./scripts/build            # Build all public packages (rollup, parallel)
node ./scripts/build atscript   # Build a specific package
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

| Package                | Published Name         | Build Tool | Description                                                    |
| ---------------------- | ---------------------- | ---------- | -------------------------------------------------------------- |
| `packages/atscript`    | `@foormjs/atscript`    | rollup     | ATScript-first form model with validation                      |
| `packages/composables` | `@foormjs/composables` | vite       | Framework-agnostic form composables (useFoormForm/Field)       |
| `packages/vue`         | `@foormjs/vue`         | vite       | Vue form components with unified type-based rendering pipeline |

Two export paths for atscript: `@foormjs/atscript` (runtime) and `@foormjs/atscript/plugin` (ATScript plugin for build-time/IDE usage).

Workspace managed by pnpm (`pnpm-workspace.yaml`). Path aliases in `tsconfig.json`: `@foormjs/atscript` → `packages/atscript/src`, `@foormjs/*` → `packages/*/src`.

## Architecture

### ATScript (`.as` files)

ATScript is the foundation. Forms are defined as annotated interfaces in `.as` files:

```typescript
@foorm.fn.title '(data) => "User " + (data.firstName || "<unknown>")'
@foorm.submit.text 'Register'
export interface MyForm {
    @meta.label 'First Name'
    @foorm.type 'text'
    @meta.required 'First name is required'
    firstName: string

    @foorm.fn.placeholder '(v, data) => data.firstName ? "Same as " + data.firstName + "?" : "Doe"'
    lastName: string

    @foorm.options 'United States', 'us'
    @foorm.options 'Canada', 'ca'
    country?: foorm.select
}
```

The `@atscript/typescript` compiler generates `.as.d.ts` declarations and runtime annotated type objects where metadata is accessible via `prop.metadata.get('key')`. The `unplugin-atscript` Vite plugin handles `.as` file processing at build time.

### Core (`packages/atscript`)

**`src/runtime/`** — Main runtime (exported as `@foormjs/atscript`):

- `create-foorm.ts` — `createFoormDef(annotatedType)` converts an ATScript annotated type into a `FoormDef` (thin `{ type, rootField, fields, flatMap }` object). `rootField` is a `FoormStructureFieldDef` representing the entire form as a single field (type `'structure'`). Fields are `FoormFieldDef` pointers to ATScript props, not copies.
- `utils.ts` — `resolveFieldProp()`, `resolveFormProp()`, `resolveOptions()`, `resolveAttrs()`, `createFormData()`, `evalComputed()`, `getByPath()`/`setByPath()`. Properties are resolved lazily on demand — `resolveFieldProp(prop, fnKey, staticKey, scope)` checks `foorm.fn.*` first (compiles fn string), then falls back to static metadata key.
- `fn-compiler.ts` — `compileFieldFn()`, `compileTopFn()`, `compileValidatorFn()` using `FNPool` from `@prostojs/deserialize-fn` for cached function compilation.
- `validate.ts` — `getFormValidator(def)` returns a reusable validator using ATScript's `Validator` class + `foormValidatorPlugin`.
- `validator-plugin.ts` — `foormValidatorPlugin()` ATScript validator plugin for `@foorm.validate` custom validators.
- `types.ts` — `FoormDef`, `FoormFieldDef`, `FoormStructureFieldDef`, `FoormArrayFieldDef`, `TFoormFnScope`, `TComputed`, `TFoormFieldEvaluated`, `TFoormEntryOptions`. Structure fields use type `'structure'` (renamed from `'group'`). `isStructureField()` and `isArrayField()` are the type guards.

**`src/plugin/`** — ATScript plugin (exported as `@foormjs/atscript/plugin`):

- `foorm-plugin.ts` — `foormPlugin(opts?)` registers all foorm annotations and primitives with `@atscript/core`. Used in `atscript.config.ts` for IDE annotation completion/validation.
- `annotations.ts` — Full `AnnotationSpec` tree for `@foorm.*` and `@foorm.fn.*` annotations (title, submit, type, component, label, disabled, hidden, validate, options, attrs, etc.).
- `primitives.ts` — ATScript primitive types: `foorm.action`, `foorm.paragraph`, `foorm.select`, `foorm.radio`, `foorm.checkbox`.

### Composables (`packages/composables`)

Framework-agnostic form composables (exported as `@foormjs/composables`):

- `src/composables/use-foorm-form.ts` — `useFoormForm()` manages form state, field registry, submit validation. Provides `TFoormState` via `provide('__foorm_form', ...)`.
- `src/composables/use-foorm-field.ts` — `useFoormField()` manages single field validation, touch tracking, error display. Injects from `'__foorm_form'`.
- `src/types.ts` — `TFoormState`, `TFoormRule`, `TFoormFieldCallbacks`, `TFoormFieldRegistration`, `TFoormSubmitValidator`, `UseFoormFieldOptions`.

### Vue (`packages/vue`)

Unified type-based rendering pipeline where every form element — text inputs, selects, structures, arrays — is a field resolved through the same `types` map.

**Rendering chain:**

```
OoForm → OoField(def.rootField) → types['structure'] → OoStructure → OoIterator
  → OoField(per field) → types[field.type] → component
    → for leaf fields: types['text'](OoInput), types['select'](OoSelect), etc.
    → for nested structure: types['structure'](OoStructure) → OoIterator → ...
    → for array field: types['array'](OoArray) → OoIterator(per item) → OoField → ...
```

**Core components:**

- `src/components/oo-form.vue` — `OoForm` provides context via provide/inject (`__foorm_types`, `__foorm_components`, `__foorm_errors`, `__foorm_action_handler`), resolves form-level props, renders `<OoField :field="def.rootField" />`. The `types` prop (required) maps field types to Vue components. Slots: `form.header`, `form.before`, `form.after`, `form.submit`, `form.footer`.
- `src/components/oo-field.vue` — `OoField` is the core renderer. Injects types/components, resolves the component for each field (`@foorm.component` → `components[name]`, else → `types[field.type]`), resolves all field props, and renders via `<component :is="resolvedComponent" v-bind="componentProps" />`. Manages nesting level tracking (`__foorm_level` provide/inject: root structure = level 0, each nested structure/array increments). Two-path optimization: `allStatic` fast path (no Vue computeds) vs dynamic path (per-property computed detection via `foorm.fn.*`). Lazy scope construction: `baseScope` for constraints, `fullScope` for display/validators.
- `src/components/oo-iterator.vue` — `OoIterator` iterates `def.fields` and renders `<OoField>` per field. Manages path prefix for array items. Passes `onRemove`/`canRemove`/`removeLabel` to child fields. Exported for use in custom structure/array components.

**Default type components** (all receive `TFoormComponentProps`):

- `src/components/default/` — `OoInput` (text/password/number), `OoSelect`, `OoRadio`, `OoCheckbox`, `OoParagraph`, `OoAction`, `OoStructure` (renders title + remove + `<OoIterator>` for sub-fields), `OoArray` (uses `useFoormArray` composable + `<OoIterator>` per item), `OoVariant` (variant picker for union arrays).

**Composables:**

- `src/composables/use-foorm.ts` — `useFoorm(annotatedType)` returns `{ def, formData }` where `def` is `FoormDef` and `formData` is reactive.
- `src/composables/use-foorm-array.ts` — `useFoormArray(field, disabled?)` manages array state: stable keys, variant tracking, add/remove with constraints, item def resolution, custom component resolution. Used by default `OoArray` and available for custom array components.

**Types:**

- `src/components/types.ts` — `TFoormComponentProps` (unified interface for ALL field types including `title`, `level`, `onRemove`, `canRemove`, `removeLabel`), `TFoormAddComponentProps`, `TFoormVariantComponentProps`.

**Provide/inject keys** (set by OoForm, consumed by OoField/OoIterator/composables):
`__foorm_types`, `__foorm_components`, `__foorm_errors`, `__foorm_action_handler`, `__foorm_root_data`, `__foorm_path_prefix`, `__foorm_level`

- `src/forms/` — ATScript `.as` form definitions (e.g. `e2e-test-form.as` for E2E testing).

### Key Design Patterns

- **Unified type-based rendering**: Every form element (leaf fields, structures, arrays) flows through `OoField` → `types[field.type]`. Custom components swap in via the `types` map or per-field `@foorm.component` annotation. No special-casing for different field categories.
- **Root field in FoormDef**: `createFoormDef()` produces a `rootField` representing the entire form as a structure field. OoForm renders `<OoField :field="def.rootField" />` — no fabrication needed.
- **Nesting level tracking**: `OoField` injects `__foorm_level` (default -1), increments for structure/array fields, provides for children. Root structure = level 0. Level-aware rendering: `<h2>` at root, `<h3>` nested; root has no left border, nested gets left border.
- **Metadata-on-demand resolve**: `FoormFieldDef` keeps a thin pointer to the ATScript prop; properties are resolved lazily via `resolveFieldProp()` rather than eagerly copied.
- **`allStatic` optimization**: `OoField` checks `field.allStatic` (no `foorm.fn.*` or `foorm.validate` annotations) to skip creating Vue `computed()` refs entirely for static fields.
- **`FNPool` caching**: Function strings are compiled once and cached — the same `foorm.fn.label` string across multiple fields only gets compiled once.
- **Dual-scope pattern**: `baseScope` (v, data, context) evaluates constraints (disabled/hidden) first; `fullScope` adds `entry` for display/validation functions, avoiding circular dependency.
- **Array item architecture**: Object array items render a remove button in OoArray's header; primitive items pass `onRemove` through OoIterator to the field component for inline rendering.

### Annotation Reference

Form-level: `@foorm.title`, `@foorm.submit.text`, `@foorm.fn.title`, `@foorm.fn.submit.text`, `@foorm.fn.submit.disabled`

Field-level static: `@foorm.type`, `@foorm.component`, `@foorm.autocomplete`, `@foorm.altAction`, `@foorm.value`, `@foorm.order`, `@foorm.hidden`, `@foorm.disabled`, `@foorm.readonly`, `@foorm.options` (multi), `@foorm.attr` (multi), `@foorm.validate` (multi)

Field-level computed (`@foorm.fn.*`): `label`, `description`, `hint`, `placeholder`, `disabled`, `hidden`, `readonly`, `optional`, `value`, `classes`, `styles`, `options`, `attr` (multi)

All `@foorm.fn.*` take a JS function string `(v, data, context, entry) => result`.

Standard ATScript metadata also used: `@meta.label`, `@meta.description`, `@meta.hint`, `@meta.placeholder`, `@meta.required`, `@expect.maxLength`, `@expect.min`, etc.

## Post-Implementation Workflow

After completing a feature, bug fix, or refactoring, use the available agents to verify everything works:

1. **`lint-and-test`** — Run lint, format check, TypeScript type checks (both atscript and vue), and tests. Use after any code changes.
2. **`build`** — Build all packages. Use after changes that affect exports, types, or package structure.
3. **`readme-check`** — Find discrepancies between documentation (READMEs + foorm skill) and actual code. Use after significant API changes or refactoring.

These agents run in isolation and return a concise summary. Delegate to them proactively — don't wait for the user to ask.

## Conventions

- **Commit messages**: Enforced by `scripts/verifyCommit.js` (yorkie hook). Format: `type(scope): description` (max 50 chars). Valid types: `feat`, `fix`, `docs`, `dx`, `style`, `refactor`, `perf`, `test`, `workflow`, `build`, `ci`, `chore`, `types`, `wip`, `release`.
- **Linting**: oxlint (`.oxlintrc.json`). Key rules: no default exports (`import/no-default-export`), strict equality (`eqeqeq`), consistent type imports (`typescript/consistent-type-imports`), no explicit any (warn).
- **Formatting**: oxfmt.
- **Tests**: Co-located `*.spec.ts` files using vitest (`globals: true`). Vue E2E tests use Playwright (`packages/vue/e2e/`).
- **Build-time replacements**: `__VERSION__`, `__PROJECT__`, `__DYE_*__` constants are replaced at build time via rollup/replace.
