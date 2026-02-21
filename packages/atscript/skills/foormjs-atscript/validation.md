# Validation — @foormjs/atscript

> Form and field validation using ATScript validators, custom `@foorm.validate` functions, and the validator plugin.

## Concepts

Validation in foormjs combines two layers:

1. **ATScript built-in constraints** — `@expect.*` annotations (min, max, pattern, etc.) and `@meta.required`
2. **Foorm custom validators** — `@foorm.validate` function strings that return `true` or an error message

The `foormValidatorPlugin()` bridges these layers — it processes `@foorm.validate` annotations within ATScript's validator infrastructure.

**Validation flow:**

1. `foormValidatorPlugin` processes `@foorm.validate` custom validators first
2. If custom validators pass, ATScript's built-in `@expect.*` validators run
3. Disabled/hidden fields are automatically skipped (resolved from `@foorm.fn.disabled`/`@foorm.fn.hidden`)

## API Reference

### `getFormValidator(def, opts?): (callOpts) => Record<string, string>`

Returns a reusable validator function for an entire form. The `Validator` instance is created once; per-call data/context is passed at call time.

```ts
import { getFormValidator } from '@foormjs/atscript'

const validate = getFormValidator(def)
const errors = validate({ data: formData.value })
// errors: Record<string, string> — empty object = all passed

// With external context
const errors = validate({
  data: formData.value,
  context: { maxAge: 120 },
})
```

**Parameters:**

- `def: FoormDef` — form definition from `createFoormDef()`
- `opts?: Partial<TValidatorOptions>` — ATScript validator options (rarely needed)

**Return function signature:**

- `(callOpts: TFormValidatorCallOptions) => Record<string, string>`
- `TFormValidatorCallOptions`: `{ data: Record<string, unknown>; context?: Record<string, unknown> }`

**Internal behavior:**

- Creates `Validator` with `plugins: [foormValidatorPlugin()]` and `unknownProps: 'ignore'`
- Passes `{ data, context }` as external context to the validator plugin

### `createFieldValidator(prop, opts?): (value, externalCtx?) => true | string`

Creates a cached validator for a single field's ATScript prop. The `Validator` instance is created lazily on first call and reused.

```ts
import { createFieldValidator } from '@foormjs/atscript'

const validate = createFieldValidator(field.prop)
const result = validate(value, { data: formData, context })
// result: true (valid) or string (first error message)

// rootOnly mode — only report errors at the root path
const validate = createFieldValidator(field.prop, { rootOnly: true })
```

**Parameters:**

- `prop: TAtscriptAnnotatedType` — field's annotated type
- `opts?.rootOnly: boolean` — only report root-level errors (ignores nested field errors)

**Return function:**

- `(value: unknown, externalCtx?: { data: unknown; context: unknown }) => true | string`

### `supportsAltAction(def, altAction): boolean`

Checks if any field in the form supports a given alternate action.

```ts
import { supportsAltAction } from '@foormjs/atscript'

if (supportsAltAction(def, 'reset-password')) {
  // At least one field has @foorm.altAction 'reset-password'
}
```

### `foormValidatorPlugin(): TValidatorPlugin`

Creates an ATScript validator plugin for `@foorm.validate` annotations. Used internally by `getFormValidator()` and `createFieldValidator()`, also available for custom validator setups.

```ts
import { foormValidatorPlugin } from '@foormjs/atscript'
import { Validator } from '@atscript/typescript/utils'

// Custom validator setup
const plugin = foormValidatorPlugin()
const validator = new Validator(field.prop, { plugins: [plugin] })
validator.validate(value, true, { data: formData, context })
```

**Plugin behavior:**

1. Checks for `@foorm.validate` metadata on the field
2. Extracts `TFoormValidatorContext` (`{ data, context }`) from the validator's external context
3. Builds entry + full scope via `buildFieldEntry` (dual-scope pattern)
4. Compiles and runs each `@foorm.validate` function string with the full scope
5. Returns the first error message, or `undefined` to fall through to `@expect.*` validators

## Common Patterns

### Pattern: Standalone form validation (API routes, server-side)

```ts
import { createFoormDef, getFormValidator } from '@foormjs/atscript'
import { MyForm } from './forms/my-form.as'

const def = createFoormDef(MyForm)
const validate = getFormValidator(def)

// In route handler
const errors = validate({ data: req.body })
if (Object.keys(errors).length === 0) {
  // Valid
} else {
  res.status(400).json({ errors })
}
```

### Pattern: Per-field validation in custom components

```ts
import { createFieldValidator } from '@foormjs/atscript'

// Create once, reuse
const validate = createFieldValidator(field.prop)

// Call on each change
function onInput(newValue: string) {
  const result = validate(newValue, { data: formData.value, context })
  if (result !== true) {
    showError(result) // result is the error message string
  }
}
```

### Pattern: Action support detection

```ts
import { supportsAltAction } from '@foormjs/atscript'

// Show/hide action buttons based on form schema
const showResetPassword = supportsAltAction(def, 'reset-password')
const showSaveDraft = supportsAltAction(def, 'save-draft')
```

## Integration with ATScript Validators

The foorm validator plugin sits alongside ATScript's built-in validators:

| Source   | Annotation                     | Behavior                                                     |
| -------- | ------------------------------ | ------------------------------------------------------------ |
| ATScript | `@meta.required`               | Non-empty check (non-blank for strings, `true` for booleans) |
| ATScript | `@expect.min N`                | Minimum value                                                |
| ATScript | `@expect.max N`                | Maximum value                                                |
| ATScript | `@expect.minLength N`          | Minimum length/count                                         |
| ATScript | `@expect.maxLength N`          | Maximum length/count                                         |
| ATScript | `@expect.pattern 'regex'`      | Pattern match                                                |
| Foorm    | `@foorm.validate '(v) => ...'` | Custom function returning `true` or error string             |

Multiple `@foorm.validate` annotations stack — all must pass. They run before ATScript's `@expect.*` validators.

## Gotchas

- `getFormValidator` returns `Record<string, string>` (not an array) — keys are dot-separated field paths
- `createFieldValidator` returns `true | string` (not `boolean | string`) — check `result !== true`
- The validator caches per-variant validators in a `WeakMap` — no manual cache management needed
- Disabled and hidden fields are automatically skipped during validation (plugin resolves constraint state)
- `@foorm.validate` functions receive the full scope including `entry` — they can check `entry.disabled`, `entry.options`, etc.
- Validator functions are strings compiled with `new Function()` — same restrictions as `@foorm.fn.*`
