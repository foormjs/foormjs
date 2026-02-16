# ATScript Migration Plan for foormjs

## Overview

Migrate foormjs from programmatic, imperative form definitions (build forms in TS code, serialize functions via `@prostojs/serialize-fn`) to declarative, annotation-driven form definitions using ATScript `.as` files. Leverage ATScript's built-in serialization, validation, and metadata system. Create a custom `@foormjs/atscript` plugin to bridge foorm-specific needs.

---

## What ATScript Replaces Directly

| Current foormjs                        | ATScript Equivalent                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `TFoormEntry.label` (static)           | `@meta.label 'Label'`                                                                                    |
| `TFoormEntry.description` (static)     | `@meta.description 'Desc'`                                                                               |
| `TFoormEntry.placeholder` (static)     | `@meta.placeholder 'Placeholder'`                                                                        |
| `TFoormEntry.optional` (static)        | Native `prop?: type` optional syntax                                                                     |
| `TFoormEntry.length` (static)          | `@expect.maxLength N`                                                                                    |
| Manual min/max/pattern validators      | `@expect.minLength`, `@expect.maxLength`, `@expect.min`, `@expect.max`, `@expect.pattern`, `@expect.int` |
| String + email validation              | `string.email` semantic primitive                                                                        |
| `serializeForm()`                      | `serializeAnnotatedType()` from `@atscript/typescript`                                                   |
| `deserializeForm()`                    | `deserializeAnnotatedType()` from `@atscript/typescript`                                                 |
| `Foorm` class + `TFoormEntry[]`        | `.as` file with annotated `export interface`                                                             |
| `evalParameter()` for static values    | `prop.metadata.get('annotation.name')`                                                                   |
| Type system (`TFoormSerialized`, etc.) | `TAtscriptAnnotatedType` + runtime type structure                                                        |

## What Needs a Custom Plugin

1. **Computed properties** (label, disabled, hidden, hint, etc. as JS functions)
2. **Custom JS function validators** (beyond `@expect.*`)
3. **Form-level UI metadata** (title, submit text/disabled)
4. **Field rendering metadata** (field type, component name, autocomplete, classes, styles, attrs, options)
5. **Default values** per field
6. **Non-data field types** (action buttons, paragraphs)

---

## Dependency Changes

| Remove                   | Keep                                                        | Add                                            |
| ------------------------ | ----------------------------------------------------------- | ---------------------------------------------- |
| `@prostojs/serialize-fn` | `@prostojs/deserialize-fn` (FNPool for safe fn compilation) | `@atscript/core` (dev)                         |
|                          |                                                             | `@atscript/typescript` (runtime)               |
|                          |                                                             | `unplugin-atscript` (dev, bundler integration) |
|                          |                                                             | `@foormjs/atscript` (new package)              |

### Why keep `@prostojs/deserialize-fn`

`FNPool` provides cached, pooled compilation of function strings. When `@foorm.fn.*` annotation strings arrive on the client (after `deserializeAnnotatedType()`), we need to compile them into callable JS functions. `FNPool` handles this safely and efficiently. We no longer need `serialize-fn` because functions are authored as strings directly in `.as` files (no `isCleanFn` filtering or reverse-engineering of closures needed).

Alternative: reimplement a minimal fn pool within foormjs if we want to drop the dependency entirely.

---

## Custom Annotations: `@foormjs/atscript` Plugin

### Form-Level Annotations (`nodeType: ['interface']`)

| Annotation                  | Arg Type | Description                                        |
| --------------------------- | -------- | -------------------------------------------------- |
| `@foorm.title`              | `string` | Static form title                                  |
| `@foorm.submit.text`        | `string` | Static submit button text                          |
| `@foorm.fn.title`           | `string` | Computed title: `(data, ctx) => string`            |
| `@foorm.fn.submit.text`     | `string` | Computed submit text: `(data, ctx) => string`      |
| `@foorm.fn.submit.disabled` | `string` | Computed submit disabled: `(data, ctx) => boolean` |

### Field-Level Static Annotations (`nodeType: ['prop']`)

| Annotation            | Arg Type   | Description                                                                                         |
| --------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `@foorm.type`         | `string`   | Field type: `'text'`, `'password'`, `'number'`, `'select'`, `'textarea'`, `'paragraph'`, `'action'` |
| `@foorm.component`    | `string`   | Named component override                                                                            |
| `@foorm.autocomplete` | `string`   | HTML autocomplete attribute                                                                         |
| `@foorm.altAction`    | `string`   | Alternate submit action name                                                                        |
| `@foorm.value`        | `string`   | Default value (as string, parsed by type at runtime)                                                |
| `@foorm.order`        | `number`   | Explicit rendering order                                                                            |
| `@foorm.hidden`       | _(no arg)_ | Statically hidden field                                                                             |
| `@foorm.disabled`     | _(no arg)_ | Statically disabled field                                                                           |

Note: `@foorm.length` is NOT needed — use `@expect.maxLength` instead. The Vue layer reads `prop.metadata.get('expect.maxLength')` for the HTML `maxlength` attribute.

### Field-Level Computed Annotations (`nodeType: ['prop']`)

These hold JS function strings evaluated at runtime with `(value, data, context, entry)` arguments. Compiled via `FNPool` from `@prostojs/deserialize-fn`.

| Annotation              | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `@foorm.fn.label`       | Computed label: `(v, data, ctx, entry) => string`           |
| `@foorm.fn.description` | Computed description                                        |
| `@foorm.fn.hint`        | Computed hint                                               |
| `@foorm.fn.placeholder` | Computed placeholder                                        |
| `@foorm.fn.disabled`    | Computed disabled state: `(v, data, ctx, entry) => boolean` |
| `@foorm.fn.hidden`      | Computed hidden state                                       |
| `@foorm.fn.optional`    | Computed optional state                                     |
| `@foorm.fn.classes`     | Computed CSS classes                                        |
| `@foorm.fn.styles`      | Computed inline styles                                      |
| `@foorm.fn.options`     | Computed select/radio options                               |

### Validation Annotation (`nodeType: ['prop']`, `multiple: true`, `mergeStrategy: 'append'`)

| Annotation        | Description                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `@foorm.validate` | JS validator function as string: `(v, data, ctx) => boolean \| string`. Repeatable. Returns `true` for pass, string for error message. |

### Plugin `validate` Hook for `@foorm.fn.*` and `@foorm.validate`

The ATScript plugin's `validate` hook on each `@foorm.fn.*` and `@foorm.validate` annotation will:

1. Read the annotation string value
2. Attempt `new Function(fnStr)` to check it compiles
3. Return a diagnostic error if it fails (syntax error surfaces in IDE via VSCode extension)

This doesn't provide type checking inside the function string, but catches syntax errors at author time — good DX.

---

## Custom Primitives

| Primitive         | Base Type | Description                                                             |
| ----------------- | --------- | ----------------------------------------------------------------------- |
| `foorm.action`    | `string`  | Form action button (not a data field, excluded from `createFormData()`) |
| `foorm.paragraph` | `string`  | Read-only paragraph text (not an input)                                 |

Usage in `.as` files:

```atscript
export interface MyForm {
    @meta.label 'Terms and conditions apply...'
    terms: foorm.paragraph

    @meta.label 'Save as Draft'
    @foorm.altAction 'draft'
    saveDraft: foorm.action
}
```

---

## Before/After Example

### Current (TypeScript, imperative)

```ts
const form = new Foorm()
form.setTitle('Registration')
form.setSubmit({ text: 'Register', disabled: data => !data.firstName })

form.addEntry({
  field: 'firstName',
  label: 'First Name',
  type: 'text',
  validators: [v => v.length >= 2 || 'Too short'],
})

form.addEntry({
  field: 'email',
  label: (v, data, ctx) => (ctx.locale === 'en' ? 'Email' : 'Correo'),
  type: 'text',
  disabled: (v, data) => !data.firstName,
  validators: [v => v.includes('@') || 'Invalid email'],
})

const serialized = serializeForm(form) // @prostojs/serialize-fn
const restored = deserializeForm(serialized) // @prostojs/deserialize-fn
```

### Proposed (ATScript, declarative)

```atscript
@foorm.title 'Registration'
@foorm.submit.text 'Register'
@foorm.fn.submit.disabled '(data) => !data.firstName'
export interface RegistrationForm {
    @meta.label 'First Name'
    @foorm.type 'text'
    @expect.minLength 2
    firstName: string

    @foorm.fn.label '(v, data, ctx) => ctx.locale === "en" ? "Email" : "Correo"'
    @foorm.type 'text'
    @foorm.fn.disabled '(v, data) => !data.firstName'
    @foorm.validate '(v) => v.includes("@") || "Invalid email"'
    email: string.email
}
```

```ts
import { RegistrationForm } from './registration.as'
import { serializeAnnotatedType, deserializeAnnotatedType } from '@atscript/typescript/utils'

// Server: serialize and send
const serialized = serializeAnnotatedType(RegistrationForm)
res.json(serialized)

// Client: receive and deserialize
const type = deserializeAnnotatedType(await res.json())
// type.metadata, type.type.props, type.validator() all work
```

Key improvements:

- `@expect.minLength 2` replaces manual `(v) => v.length >= 2 || 'Too short'`
- `string.email` provides built-in email format validation
- Static `@meta.label` is separate from computed `@foorm.fn.label`
- No dual calling convention (`__deserialized` flag) — functions are always string-authored
- ATScript serialization handles wire transport natively

---

## Runtime Architecture

### Function Compilation Flow

1. **Author time**: Write function as string in `.as` annotation
2. **Build time**: ATScript plugin `validate` hook checks it compiles (`new Function`)
3. **Serialize time**: `serializeAnnotatedType()` preserves annotation strings as-is
4. **Wire transport**: JSON with string annotation values
5. **Deserialize time**: `deserializeAnnotatedType()` restores annotations
6. **Runtime**: Foorm reads `prop.metadata.get('foorm.fn.disabled')`, compiles via `FNPool`, wraps in Vue `computed()` for reactivity

### Validation Flow

Two layers work together:

1. **ATScript built-in**: Handles `@expect.*` constraints + semantic primitive validation (`string.email`, `number.int.positive`, etc.)
2. **Foorm validator plugin**: Reads `@foorm.validate` annotations, compiles function strings via `FNPool`, executes with `(value, data, context)` scope

```ts
import { foormValidatorPlugin } from '@foormjs/atscript'

const validator = RegistrationForm.validator({
  plugins: [foormValidatorPlugin],
})

// Runs both @expect.* and @foorm.validate validators
if (validator.validate(formData, true)) {
  // TypeScript type guard: formData is RegistrationForm
}
```

### Vue Component Flow

`OoForm` accepts `TAtscriptAnnotatedType` instead of `Foorm`:

1. Reads interface-level annotations for title/submit
2. Iterates `type.props` for field entries
3. For each prop: reads `@meta.*` for static values, `@foorm.fn.*` for computed
4. Compiles `@foorm.fn.*` strings via `FNPool`, wraps in `computed()` for reactivity
5. Reads `@foorm.type`, `@foorm.component` for rendering decisions
6. Reads `@expect.maxLength` for HTML `maxlength`
7. Runs validation via ATScript validator + foorm plugin

---

## Migration Phases

### Phase 1: Create `@foormjs/atscript` Plugin Package

New package: `packages/atscript/`

**Deliverables:**

- `src/plugin.ts` — `TAtscriptPlugin` factory function with all custom annotations and primitives
- `src/annotations.ts` — `TAnnotationsTree` with all `@foorm.*` annotation specs
- `src/primitives.ts` — `foorm.action`, `foorm.paragraph` primitives
- `src/validator-plugin.ts` — `TValidatorPlugin` that processes `@foorm.validate` annotations
- `src/fn-compiler.ts` — Wrapper around `FNPool` for compiling `@foorm.fn.*` strings
- `src/index.ts` — Re-exports

The plugin's `validate` hook on `@foorm.fn.*` and `@foorm.validate` annotations attempts `new Function()` compilation to surface syntax errors in the IDE.

### Phase 2: Rewrite `packages/foorm` Core

- Replace `Foorm` class with a new API that wraps `TAtscriptAnnotatedType`
- New helper: `createFoormFromType(type)` — reads annotations, builds runtime form model
- New helper: `evalAnnotation(prop, annotationName, scope)` — resolves static or `@foorm.fn.*` computed
- Replace `serializeForm`/`deserializeForm` with ATScript's serialize/deserialize
- Replace `evalParameter()` with annotation-aware resolver
- Integrate ATScript validator + foorm validator plugin for `getFormValidator()`
- Remove `@prostojs/serialize-fn` dependency
- Keep `@prostojs/deserialize-fn` for `FNPool` (or reimplement minimal version)

### Phase 3: Rewrite `packages/vue` Components

- `OoForm` accepts `TAtscriptAnnotatedType` (or deserialized equivalent) instead of `Foorm`
- Iterates `type.props` entries instead of `entries[]` array
- `OoField` reads annotations via `metadata.get()` instead of prop-based computed
- Reactive computed wrapping for `@foorm.fn.*` via `FNPool`
- Leverage ATScript validator for field validation
- Derive HTML `maxlength` from `@expect.maxLength`

### Phase 4: Example Forms as `.as` Files

- Add `atscript.config.js` at project root
- Convert `App.vue` demo to use `.as` form definitions
- Create example `.as` files showing the full annotation range
- Add `unplugin-atscript` to Vite config for Vue dev server

### Phase 5: Cleanup & Testing

- Remove old `serialize.ts`, `deserialize.ts` from foorm core
- Remove `@prostojs/serialize-fn` dependency
- Update `foorm.spec.ts` tests for new API
- Update build configs (rollup for atscript package, vite for vue package)
- Regenerate type declarations with `npx asc -f dts`

---

## Risk Assessment

| Risk                                                  | Severity | Mitigation                                                                              |
| ----------------------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| Fn strings lack TypeScript type checking              | Medium   | Plugin `validate` hook checks compilation; most fields use static `@meta.*` annotations |
| Breaking change for existing users                    | High     | Major version bump; migration guide; consider backward-compat adapter                   |
| `new Function()` and CSP                              | Low      | Same as current `@prostojs/deserialize-fn` behavior; document CSP requirements          |
| Deep annotation nesting (`@foorm.fn.submit.disabled`) | Low      | ATScript supports arbitrary nesting via `TAnnotationsTree`                              |
| ATScript is relatively new                            | Medium   | Same author ecosystem; strong alignment with project goals                              |
