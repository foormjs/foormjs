# Core API (`@foormjs/atscript` package)

The `@foormjs/atscript` package provides the runtime form model — form definitions, validation, and metadata resolution. It has no Vue dependency and can be used in any JavaScript/TypeScript environment.

## Imports

```ts
// Runtime (main entry)
import {
  createFoormDef,
  createFormData,
  createDefaultValue,
  createItemData,
  createFieldValidator,
  getFormValidator,
  supportsAltAction,
  resolveFieldProp,
  resolveFormProp,
  resolveOptions,
  resolveAttrs,
  getFieldMeta,
  buildFieldEntry,
  optKey,
  optLabel,
  getByPath,
  setByPath,
  detectUnionVariant,
  foormValidatorPlugin,
} from '@foormjs/atscript'

// Types
import type {
  FoormDef,
  FoormFieldDef,
  FoormArrayFieldDef,
  FoormObjectFieldDef,
  FoormUnionFieldDef,
  FoormTupleFieldDef,
  FoormUnionVariant,
  TFoormAltAction,
  TFoormFnScope,
  TFoormFieldEvaluated,
  TFoormEntryOptions,
  TComputed,
  TFormValidatorCallOptions,
  TFieldValidatorOptions,
  TResolveOptions,
  TBuildFieldEntryOpts,
  TFoormValidatorContext,
} from '@foormjs/atscript'

// Type guards
import { isArrayField, isObjectField, isUnionField, isTupleField } from '@foormjs/atscript'

// Build-time plugin (atscript.config.ts only — never import at runtime)
import { foormPlugin } from '@foormjs/atscript/plugin'
```

---

## Core Functions

### `createFoormDef(type)`

Converts an ATScript annotated type into a form definition. Produces a `rootField` representing the entire form as a single field, plus ordered fields and a flat map.

```ts
import { createFoormDef } from '@foormjs/atscript'
import { MyForm } from './forms/my-form.as'

const def = createFoormDef(MyForm)
// def.type      — source annotated type
// def.rootField — FoormObjectFieldDef (type='object') for interface types,
//                 or a leaf FoormFieldDef for primitive/array types
// def.fields    — FoormFieldDef[] ordered by @foorm.order
// def.flatMap   — Map<path, annotatedType> for all nested fields
```

### `createFormData(type, fields, opts?)`

Creates a `{ value: T }` data container with default values from the schema. The domain data is at `.value`. `OoForm` and `useFoorm` handle this wrapping automatically.

```ts
import { createFormData } from '@foormjs/atscript'

const formData = createFormData(MyForm, def.fields)
// { value: { firstName: '', email: '', country: '' } }
// Domain data is at formData.value — OoForm handles this wrapping automatically

// Skip optional fields (leave them undefined)
const sparse = createFormData(MyForm, def.fields, { skipOptional: true })
```

### `getFormValidator(def, opts?)`

Returns a reusable validator function that combines `@foorm.validate` + `@expect.*` constraints. The validator instance is created once; per-call data/context is passed at call time.

```ts
import { getFormValidator } from '@foormjs/atscript'

const validate = getFormValidator(def)
const errors = validate({ data: formData.value })
// errors: Record<string, string> — empty object = passed

// With external context (per-call)
const errors = validate({
  data: formData.value,
  context: { maxAge: 120 },
})
```

The validator:

- Evaluates `@foorm.validate` custom validators
- Falls through to ATScript `@expect.*` validators
- Returns `Record<string, string>` keyed by field path (empty = passed)

### `createFieldValidator(prop, opts?)`

Creates a cached validator function for a single ATScript prop. The `Validator` instance is created lazily on first call and reused on subsequent calls.

```ts
import { createFieldValidator } from '@foormjs/atscript'

const validate = createFieldValidator(field.prop)
const result = validate(value, { data: formData, context })
// result: true (valid) or string (first error message)

// rootOnly mode — only report errors at the root path
const validate = createFieldValidator(field.prop, { rootOnly: true })
```

### `supportsAltAction(def, action)`

Checks if any field supports a given alternate action.

```ts
if (supportsAltAction(def, 'reset-password')) {
  // At least one field has @foorm.altAction 'reset-password', '...'
}
```

### Array/Union Utilities

```ts
import {
  createItemData,
  createDefaultValue,
  detectUnionVariant,
  isArrayField,
  isObjectField,
  isUnionField,
  isTupleField,
} from '@foormjs/atscript'
```

| Function                              | Description                                                    |
| ------------------------------------- | -------------------------------------------------------------- |
| `createItemData(variant)`             | Creates a default data value for a union variant               |
| `createDefaultValue(type)`            | Returns a default value for any annotated type kind            |
| `detectUnionVariant(value, variants)` | Detects which variant index matches an existing item value     |
| `isArrayField(field)`                 | Type guard: true if `field` is `FoormArrayFieldDef`            |
| `isObjectField(field)`                | Type guard: true if `field` is `FoormObjectFieldDef`           |
| `isUnionField(field)`                 | Type guard: true if `field` is `FoormUnionFieldDef`            |
| `isTupleField(field)`                 | Type guard: true if `field` is `FoormTupleFieldDef`            |

---

## Resolve Utilities

These functions resolve metadata from a field's ATScript prop on demand.

### `resolveFieldProp(prop, fnKey, staticKey, scope, opts?)`

Resolves a field-level property. Checks `@foorm.fn.*` first, then falls back to static metadata. `staticKey` can be `undefined` to skip the static fallback.

```ts
const scope = { v: currentValue, data: formData, context, entry }

const label = resolveFieldProp<string>(field.prop, 'foorm.fn.label', 'meta.label', scope)
const disabled = resolveFieldProp<boolean>(field.prop, 'foorm.fn.disabled', 'foorm.disabled', scope)
```

### `resolveFormProp(type, fnKey, staticKey, scope, opts?)`

Same pattern but for form-level metadata. Uses `compileTopFn` (scope has `data` and `context`, no `v` or `entry`).

```ts
const title = resolveFormProp<string>(def.type, 'foorm.fn.title', 'foorm.title', scope)
```

### `resolveOptions(prop, scope)`

Resolves `@foorm.options` (static) or `@foorm.fn.options` (computed).

```ts
const options = resolveOptions(field.prop, scope)
// TFoormEntryOptions[] — each is string or { key, label }
```

### `resolveAttrs(prop, scope)`

Resolves `@foorm.attr` and `@foorm.fn.attr` into an attributes object.

```ts
const attrs = resolveAttrs(field.prop, scope)
// { 'data-testid': 'email-field', 'aria-label': 'Email' }
```

### `getFieldMeta(prop, key)`

Reads a static metadata value directly from a field prop.

```ts
const type = getFieldMeta<string>(field.prop, 'foorm.type') // 'text'
const autocomplete = getFieldMeta<string>(field.prop, 'foorm.autocomplete')
```

### `buildFieldEntry(prop, baseScope, path, opts?)`

Builds a `TFoormFieldEvaluated` entry and returns a full scope containing it. Implements the dual-scope pattern: resolve constraints from `baseScope`, assemble entry, build full scope with entry, then resolve options using the full scope.

```ts
const baseScope = { v: value, data: formData, context }
const fullScope = buildFieldEntry(field.prop, baseScope, 'address.city', {
  type: field.type,
  component: 'my-input',
  disabled: false, // pre-resolved override — skip metadata resolution
})
// fullScope.entry contains the assembled TFoormFieldEvaluated
```

### `optKey(opt)` / `optLabel(opt)`

Extract the key or display label from a `TFoormEntryOptions` entry.

```ts
const key = optKey(opt)     // string value or opt.key
const label = optLabel(opt) // string value or opt.label
```

---

## Types

### FoormDef

```ts
interface FoormDef {
  type: TAtscriptAnnotatedType       // Source annotated type
  rootField: FoormFieldDef           // Root field (type='object' for interfaces, leaf type otherwise)
  fields: FoormFieldDef[]            // Ordered fields
  flatMap: Map<string, TAtscriptAnnotatedType> // All nested fields by path
}
```

### FoormFieldDef

```ts
interface FoormFieldDef {
  path: string             // Dot-separated path (e.g., 'address.street'). '' = root
  prop: TAtscriptAnnotatedType // ATScript prop with metadata
  type: string             // Resolved input type ('text', 'select', 'object', 'array', 'union', 'tuple', etc.)
  phantom: boolean         // True for foorm.action, foorm.paragraph
  name: string             // Last segment of path
  allStatic: boolean       // True if no foorm.fn.* annotations (perf flag)
}
```

### FoormArrayFieldDef

```ts
interface FoormArrayFieldDef extends FoormFieldDef {
  itemType: TAtscriptAnnotatedType // ATScript type of array items (from TAtscriptTypeArray.of)
  itemField: FoormFieldDef         // Pre-built template field def for items (path='')
}
```

### FoormObjectFieldDef

```ts
interface FoormObjectFieldDef extends FoormFieldDef {
  objectDef: FoormDef // Pre-built FoormDef for the nested object's fields
}
```

### FoormUnionFieldDef

```ts
interface FoormUnionFieldDef extends FoormFieldDef {
  unionVariants: FoormUnionVariant[] // Available union branches
}
```

### FoormTupleFieldDef

```ts
interface FoormTupleFieldDef extends FoormFieldDef {
  itemFields: FoormFieldDef[] // Pre-built field defs, one per tuple position
}
```

### FoormUnionVariant

```ts
interface FoormUnionVariant {
  label: string                    // Display label (from @meta.label or auto-generated, e.g. "1. String")
  type: TAtscriptAnnotatedType     // The annotated type for this variant
  def?: FoormDef                   // Pre-built FoormDef for object variants (undefined for primitives)
  itemField?: FoormFieldDef        // Pre-built field def for primitive variants (undefined for objects)
  designType?: string              // Design type for primitive variants ('string', 'number', 'boolean')
}
```

### TFoormFnScope

```ts
interface TFoormFnScope<V = unknown, D = Record<string, unknown>, C = Record<string, unknown>> {
  v?: V                          // Current field value
  data: D                        // Full form data
  context: C                     // External context
  entry?: TFoormFieldEvaluated   // Evaluated field snapshot
  action?: string                // Current action (if any)
}
```

### TFoormFieldEvaluated

Evaluated snapshot of a field's current state — passed as `entry` in `TFoormFnScope` to `@foorm.fn.*` and `@foorm.validate` functions.

```ts
interface TFoormFieldEvaluated {
  field: string                    // Field path (e.g., 'address.city') — '' for root
  type: string                     // Resolved input type ('text', 'select', etc.)
  component?: string               // Named component from @foorm.component
  name: string                     // Field name (last segment of path)
  disabled?: boolean               // Whether the field is disabled
  optional?: boolean               // Whether the field is optional
  hidden?: boolean                 // Whether the field is hidden
  readonly?: boolean               // Whether the field is read-only
  options?: TFoormEntryOptions[]   // Resolved options for select/radio fields
}
```

### TFoormEntryOptions

```ts
type TFoormEntryOptions = { key: string; label: string } | string
```

### TFoormAltAction

```ts
interface TFoormAltAction {
  id: string     // Action identifier from @foorm.altAction 'id', 'label'
  label: string  // Display label for the action button
}
```

---

## Validator Plugin

The `foormValidatorPlugin()` creates an ATScript validator plugin. Used internally by `getFormValidator()` and `createFieldValidator()`, but also available for custom validator setups:

```ts
import { foormValidatorPlugin } from '@foormjs/atscript'
import { Validator } from '@atscript/typescript/utils'

// Per-field validation
const plugin = foormValidatorPlugin()
const validator = new Validator(field.prop, { plugins: [plugin] })
validator.validate(value, true, { data: formData, context })

// Whole-form validation (what getFormValidator does internally)
const plugin = foormValidatorPlugin()
const validator = new Validator(def.type, { plugins: [plugin], unknownProps: 'ignore' })
validator.validate(formData, true, { data: formData, context })
```

The plugin processes `@foorm.validate` custom validators and evaluates disabled/hidden/optional constraints from `@foorm.fn.*` annotations.
