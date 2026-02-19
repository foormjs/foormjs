# Core API (`@foormjs/atscript` package)

The `@foormjs/atscript` package provides the runtime form model — form definitions, validation, and metadata resolution. It has no Vue dependency and can be used in any JavaScript/TypeScript environment.

## Imports

```ts
// Runtime (main entry)
import {
  createFoormDef,
  createFormData,
  getFormValidator,
  supportsAltAction,
  resolveFieldProp,
  resolveFormProp,
  resolveOptions,
  resolveAttrs,
  getFieldMeta,
  hasComputedAnnotations,
  evalComputed,
  getByPath,
  setByPath,
  foormValidatorPlugin,
} from '@foormjs/atscript'

// Types
import type {
  FoormDef,
  FoormFieldDef,
  FoormArrayFieldDef,
  FoormGroupFieldDef,
  FoormArrayVariant,
  TFoormAltAction,
  TFoormFnScope,
  TFoormFieldEvaluated,
  TFoormEntryOptions,
  TComputed,
} from '@foormjs/atscript'

// Type guards
import { isArrayField, isGroupField } from '@foormjs/atscript'

// Build-time plugin (atscript.config.ts only — never import at runtime)
import { foormPlugin } from '@foormjs/atscript/plugin'
```

---

## Core Functions

### `createFoormDef(type)`

Converts an ATScript annotated type into a form definition with ordered fields.

```ts
import { createFoormDef } from '@foormjs/atscript'
import { MyForm } from './forms/my-form.as'

const def = createFoormDef(MyForm)
// def.type     — source annotated type
// def.fields   — FoormFieldDef[] ordered by @foorm.order
// def.flatMap  — Map<path, annotatedType> for all nested fields
```

### `createFormData(type, fields)`

Creates a plain data object with default values from the schema.

```ts
import { createFormData } from '@foormjs/atscript'

const data = createFormData(MyForm, def.fields)
// { firstName: '', email: '', country: '' }  — defaults based on types
```

### `getFormValidator(def, opts?)`

Returns a reusable validator function that combines `@foorm.validate` + `@expect.*` constraints. The validator instance is created once; per-call data/context is passed at call time.

```ts
import { getFormValidator } from '@foormjs/atscript'

const validate = getFormValidator(def)
const errors = validate({ data })
// errors: Record<string, string> — empty object = passed

// With external context (per-call)
const errors = validate({
  data,
  context: { maxAge: 120 },
})
```

The validator:

- Evaluates `@foorm.validate` custom validators
- Falls through to ATScript `@expect.*` validators
- Returns `Record<string, string>` keyed by field path (empty = passed)

### `supportsAltAction(def, action)`

Checks if any field supports a given alternate action.

```ts
if (supportsAltAction(def, 'reset-password')) {
  // At least one field has @foorm.altAction 'reset-password', '...'
}
```

### Array/Group Utilities

```ts
import {
  createItemData,
  detectVariant,
  buildVariants,
  isArrayField,
  isGroupField,
} from '@foormjs/atscript'
```

| Function                         | Description                                                |
| -------------------------------- | ---------------------------------------------------------- |
| `createItemData(variant)`        | Creates a default data value for an array item variant     |
| `detectVariant(value, variants)` | Detects which variant index matches an existing item value |
| `buildVariants(itemType)`        | Builds variant definitions for an array item type          |
| `isArrayField(field)`            | Type guard: true if `field` is `FoormArrayFieldDef`        |
| `isGroupField(field)`            | Type guard: true if `field` is `FoormGroupFieldDef`        |

---

## Resolve Utilities

These functions resolve metadata from a field's ATScript prop on demand.

### `resolveFieldProp(prop, fnKey, staticKey, scope, opts?)`

Resolves a field-level property. Checks `@foorm.fn.*` first, then falls back to static metadata.

```ts
const scope = { v: currentValue, data: formData, context, entry }

const label = resolveFieldProp<string>(field.prop, 'foorm.fn.label', 'meta.label', scope)
const disabled = resolveFieldProp<boolean>(field.prop, 'foorm.fn.disabled', 'foorm.disabled', scope)
```

### `resolveFormProp(type, fnKey, staticKey, scope, opts?)`

Same pattern but for form-level metadata.

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

### `hasComputedAnnotations(prop)`

Returns `true` if the field has any `@foorm.fn.*` or `@foorm.validate` annotations.

```ts
if (hasComputedAnnotations(field.prop)) {
  // This field needs Vue computed refs
}
```

---

## Types

### FoormDef

```ts
interface FoormDef {
  type: TAtscriptAnnotatedType<TAtscriptTypeObject> // Source type
  fields: FoormFieldDef[] // Ordered fields
  flatMap: Map<string, TAtscriptAnnotatedType> // All nested fields by path
}
```

### FoormFieldDef

```ts
interface FoormFieldDef {
  path?: string // Dot-separated path (e.g., 'address.street'). undefined = root (primitive array items)
  prop: TAtscriptAnnotatedType // ATScript prop with metadata
  type: string // Resolved input type ('text', 'select', etc.)
  phantom: boolean // True for foorm.action, foorm.paragraph
  name: string // Last segment of path
  allStatic: boolean // True if no foorm.fn.* annotations (perf flag)
}
```

### TFoormFnScope

```ts
interface TFoormFnScope<V = unknown, D = Record<string, unknown>, C = Record<string, unknown>> {
  v?: V // Current field value
  data: D // Full form data
  context: C // External context
  entry?: TFoormFieldEvaluated // Evaluated field snapshot
  action?: string // Current action (if any)
}
```

### FoormArrayFieldDef

```ts
interface FoormArrayFieldDef extends FoormFieldDef {
  itemType: TAtscriptAnnotatedType // ATScript type of array items
  variants: FoormArrayVariant[] // Variant definitions (one per union branch, or single)
}
```

### FoormGroupFieldDef

```ts
interface FoormGroupFieldDef extends FoormFieldDef {
  groupDef: FoormDef // Pre-built FoormDef for the nested object's fields
}
```

### FoormArrayVariant

```ts
interface FoormArrayVariant {
  label: string // Display label (from @meta.label or auto-generated)
  type: TAtscriptAnnotatedType // The annotated type for this variant
  def?: FoormDef // Pre-built FoormDef for object variants (undefined for primitives)
  itemField?: FoormFieldDef // Pre-built field def for primitive variants (undefined for objects)
  designType?: string // Design type for primitives ('string', 'number', 'boolean')
}
```

### TFoormFieldEvaluated

Evaluated snapshot of a field's current state — passed as `entry` in `TFoormFnScope` to `@foorm.fn.*` and `@foorm.validate` functions.

```ts
interface TFoormFieldEvaluated {
  field?: string // Field path (e.g., 'address.city')
  type: string // Resolved input type ('text', 'select', etc.)
  component?: string // Named component from @foorm.component
  name: string // Field name (last segment of path)
  disabled?: boolean // Whether the field is disabled
  optional?: boolean // Whether the field is optional
  hidden?: boolean // Whether the field is hidden
  readonly?: boolean // Whether the field is read-only
  options?: TFoormEntryOptions[] // Resolved options for select/radio fields
}
```

### TFoormEntryOptions

```ts
type TFoormEntryOptions = { key: string; label: string } | string
```

---

## Validator Plugin

The `foormValidatorPlugin()` creates an ATScript validator plugin. Used internally by `getFormValidator()`, but also available for custom validator setups:

```ts
import { foormValidatorPlugin } from '@foormjs/atscript'
import { Validator } from '@atscript/typescript/utils'

// Per-field validation
const plugin = foormValidatorPlugin()
const validator = new Validator(field.prop, { plugins: [plugin] })
validator.validate(value, true, { data: formData, context })

// Whole-form validation (what getFormValidator does internally)
const plugin = foormValidatorPlugin()
const validator = new Validator(def.type, { plugins: [plugin], unknwonProps: 'ignore' })
validator.validate(formData, true, { data: formData, context })
```

The plugin processes `@foorm.validate` custom validators and evaluates disabled/hidden/optional constraints from `@foorm.fn.*` annotations.
