# Field Metadata Resolution — @foormjs/atscript

> Resolving field properties (labels, disabled state, options, attributes) on demand using the dual-scope pattern.

## Concepts

Field properties in foormjs are **resolved lazily** — not eagerly copied from metadata. Each `FoormFieldDef` keeps a thin pointer to the ATScript prop, and properties are resolved via `resolveFieldProp()` when needed.

**Resolution priority:** `@foorm.fn.*` (compiled function) > static metadata > `undefined`

**The dual-scope pattern:**

1. Build `baseScope` with `{ v, data, context }` — resolve constraints (disabled, hidden, readonly)
2. Assemble `entry` object with resolved constraints
3. Build `fullScope` with `{ ...baseScope, entry }` — resolve display props and validators
4. This avoids circular dependency: options can depend on constraint state

**Function compilation:** Function strings from `@foorm.fn.*` are compiled via `FNPool` from `@prostojs/deserialize-fn`. The pool caches compiled functions — the same fn string across multiple fields only compiles once.

## API Reference

### `resolveFieldProp<T>(prop, fnKey, staticKey, scope, opts?): T | undefined`

Resolves a field-level property. Checks `@foorm.fn.*` first, then static metadata.

```ts
import { resolveFieldProp } from '@foormjs/atscript'

const scope = { v: currentValue, data: formData, context, entry }

const label = resolveFieldProp<string>(field.prop, 'foorm.fn.label', 'meta.label', scope)
const disabled = resolveFieldProp<boolean>(field.prop, 'foorm.fn.disabled', 'foorm.disabled', scope)
const hidden = resolveFieldProp<boolean>(field.prop, 'foorm.fn.hidden', 'foorm.hidden', scope)
```

**Parameters:**

- `prop` — ATScript annotated type (field's type reference)
- `fnKey` — metadata key for computed function (e.g., `'foorm.fn.label'`)
- `staticKey` — metadata key for static value (e.g., `'meta.label'`), or `undefined` to skip static fallback
- `scope` — `TFoormFnScope` with `{ v, data, context, entry?, action? }`
- `opts?.staticAsBoolean` — treat static metadata presence as `true` (for flag annotations like `@foorm.disabled`)
- `opts?.transform` — transform function applied to result

### `resolveFormProp<T>(type, fnKey, staticKey, scope, opts?): T | undefined`

Same pattern for form-level metadata. Uses `compileTopFn` (scope has `data` and `context`, no `v` or `entry`).

```ts
import { resolveFormProp } from '@foormjs/atscript'

const scope = { data: formData, context }
const title = resolveFormProp<string>(def.type, 'foorm.fn.title', 'foorm.title', scope)
const submitText = resolveFormProp<string>(
  def.type,
  'foorm.fn.submit.text',
  'foorm.submit.text',
  scope
)
```

### `resolveOptions(prop, scope): TFoormEntryOptions[] | undefined`

Resolves `@foorm.fn.options` (computed) or `@foorm.options` (static) into a normalized array.

```ts
import { resolveOptions } from '@foormjs/atscript'

const options = resolveOptions(field.prop, scope)
// TFoormEntryOptions[] — each is string or { key, label }
```

Static options from `@foorm.options 'label', 'value'` are parsed into `{ key, label }` pairs. If only one argument is given, it's used as both key and label.

### `resolveAttrs(prop, scope): Record<string, unknown> | undefined`

Resolves `@foorm.attr` (static) and `@foorm.fn.attr` (computed) into a merged attributes object.

```ts
import { resolveAttrs } from '@foormjs/atscript'

const attrs = resolveAttrs(field.prop, scope)
// { 'data-testid': 'email-field', 'aria-label': 'Email' }
```

### `getFieldMeta<K>(prop, key): AtscriptMetadata[K] | undefined`

Reads a static metadata value directly from a field prop. No function compilation.

```ts
import { getFieldMeta } from '@foormjs/atscript'

const type = getFieldMeta<string>(field.prop, 'foorm.type')
const autocomplete = getFieldMeta<string>(field.prop, 'foorm.autocomplete')
const order = getFieldMeta<number>(field.prop, 'foorm.order')
```

### `buildFieldEntry(prop, baseScope, path, opts?): TFoormFnScope`

Builds a `TFoormFieldEvaluated` entry and returns the full scope containing it. Implements the complete dual-scope pattern.

```ts
import { buildFieldEntry } from '@foormjs/atscript'

const baseScope = { v: value, data: formData, context }
const fullScope = buildFieldEntry(field.prop, baseScope, 'address.city', {
  type: field.type,
  component: 'my-input',
  disabled: false, // pre-resolved — skips metadata resolution
})
// fullScope.entry = { field: 'address.city', type, name: 'city', disabled, hidden, ... }
```

**`TBuildFieldEntryOpts`:**

- `type?: string` — pre-resolved field type (skips metadata lookup)
- `component?: string` — pre-resolved component name
- `disabled?: boolean` — pre-resolved disabled state
- `hidden?: boolean` — pre-resolved hidden state
- `readonly?: boolean` — pre-resolved readonly state

When an option is provided, the corresponding metadata resolution is skipped — useful when the caller already computed a constraint.

### `hasComputedAnnotations(prop): boolean`

Returns `true` if the prop has any `foorm.fn.*` or `foorm.validate` metadata. Used to compute the `allStatic` flag.

## Function Compilation (Internal)

Three compiler functions (not publicly exported, but understanding them helps):

| Function                    | Scope       | Signature                                        |
| --------------------------- | ----------- | ------------------------------------------------ |
| `compileFieldFn(fnStr)`     | Field-level | `(v, data, context, entry) => result`            |
| `compileTopFn(fnStr)`       | Form-level  | `(data, context) => result`                      |
| `compileValidatorFn(fnStr)` | Validator   | `(v, data, context, entry) => boolean \| string` |

All use a global `FNPool` singleton for caching. The pool uses `new Function()` internally.

## Common Patterns

### Pattern: Resolve all display props for a field

```ts
const baseScope = { v, data: formData, context }
const fullScope = buildFieldEntry(field.prop, baseScope, field.path, { type: field.type })

const label = resolveFieldProp<string>(field.prop, 'foorm.fn.label', 'meta.label', fullScope)
const placeholder = resolveFieldProp<string>(
  field.prop,
  'foorm.fn.placeholder',
  'meta.placeholder',
  fullScope
)
const description = resolveFieldProp<string>(
  field.prop,
  'foorm.fn.description',
  'meta.description',
  fullScope
)
const hint = resolveFieldProp<string>(field.prop, 'foorm.fn.hint', 'meta.hint', fullScope)
const options = resolveOptions(field.prop, fullScope)
const attrs = resolveAttrs(field.prop, fullScope)
```

### Pattern: Check if a field is dynamically hidden/disabled

```ts
const scope = { v: currentValue, data: formData, context }
const disabled = resolveFieldProp<boolean>(
  field.prop,
  'foorm.fn.disabled',
  'foorm.disabled',
  scope,
  { staticAsBoolean: true }
)
const hidden = resolveFieldProp<boolean>(field.prop, 'foorm.fn.hidden', 'foorm.hidden', scope, {
  staticAsBoolean: true,
})
```

Use `staticAsBoolean: true` for flag annotations where the mere presence means `true`.

## Gotchas

- `@foorm.fn.*` functions are strings compiled with `new Function()` — no imports, no closures, only pure expressions using `v`, `data`, `context`, `entry`
- The `entry` parameter is only available in the full scope (after `buildFieldEntry`) — constraint functions (`disabled`, `hidden`, `readonly`) receive the base scope without `entry`
- `resolveFieldProp` returns `undefined` when neither fn nor static key exists — callers must handle the absence
- Options resolution happens in the full scope (after entry is built) because options can depend on constraint values
- Static `@foorm.options` values are normalized: `'label', 'value'` becomes `{ key: 'value', label: 'label' }`; `'label'` alone becomes the plain string
