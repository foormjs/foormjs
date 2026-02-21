# Core Concepts & Form Definitions — @foormjs/atscript

> Creating form definitions from ATScript annotated types, form data initialization, and utility functions.

## Concepts

The `@foormjs/atscript` package converts ATScript annotated types (compiled from `.as` files) into form definitions (`FoormDef`). A `FoormDef` contains a `rootField` representing the entire form, an ordered list of fields, and a flat map for path-based lookups.

**Key abstractions:**

- **FoormDef** — Complete form definition with root field, ordered fields, and flat map
- **FoormFieldDef** — Thin pointer to an ATScript prop (not a copy); properties resolved lazily on demand
- **rootField** — The entire form as a single field (type `'object'` for interfaces, leaf type for primitives)
- **Wrapper pattern** — Form data wrapped in `{ value: ... }` so `getByPath`/`setByPath` always dereference `.value`

## API Reference

### `createFoormDef(type: TAtscriptAnnotatedType): FoormDef`

Converts an ATScript annotated type into a form definition. This is the primary entry point.

```ts
import { createFoormDef } from '@foormjs/atscript'
import { MyForm } from './forms/my-form.as'

const def = createFoormDef(MyForm)
// def.type      — source annotated type
// def.rootField — FoormObjectFieldDef (type='object') for interfaces
// def.fields    — FoormFieldDef[] ordered by @foorm.order
// def.flatMap   — Map<path, TAtscriptAnnotatedType>
```

**Behavior:**

- Object types: flattens props into ordered field list, creates `FoormObjectFieldDef` root
- Non-object types (string, number, array): creates single leaf root field with `path=''`
- Fields sorted by `@foorm.order` (Schwartzian transform for O(N log N) perf)
- Objects with `@foorm.title` or `@foorm.component` become structured fields (not flattened)
- Objects without `@foorm.title` flatten their children into the parent field list
- Nested arrays-of-arrays without `@foorm.component` are skipped (unsupported)
- Single-variant unions are unwrapped to their inner type

### `createFormData<T>(type, fields, opts?): { value: T }`

Creates a data container with default values from the schema.

```ts
import { createFormData } from '@foormjs/atscript'

const formData = createFormData(MyForm, def.fields)
// { value: { firstName: '', email: '', country: '' } }

// Skip optional fields (leave them undefined)
const sparse = createFormData(MyForm, def.fields, { skipOptional: true })
```

**Options:**

- `skipOptional?: boolean` — leave optional fields as `undefined` instead of creating defaults

**Default values by type:**

- `string` → `''`
- `number` → `0`
- `boolean` → `false`
- `array` → `[]`
- `object` → nested object with defaults
- `tuple` → array of defaults per position
- Other → `undefined`

Static defaults from `@foorm.value` or `@foorm.fn.value` are resolved during creation.

### `createDefaultValue(type: TAtscriptAnnotatedType): unknown`

Returns the default value for any annotated type kind. Used internally by `createFormData` and available for custom initialization.

```ts
import { createDefaultValue } from '@foormjs/atscript'

createDefaultValue(stringType) // ''
createDefaultValue(numberType) // 0
createDefaultValue(boolType) // false
createDefaultValue(arrayType) // []
```

### `createItemData(variant: FoormUnionVariant): unknown`

Creates default data for a union variant. Object variants produce nested objects; primitives produce their default.

```ts
import { createItemData } from '@foormjs/atscript'

createItemData(objectVariant) // { name: '', age: 0 }
createItemData(stringVariant) // ''
```

### `detectUnionVariant(value: unknown, variants: FoormUnionVariant[]): number`

Detects which variant index matches an existing value. Uses ATScript validators internally (cached in a WeakMap).

```ts
import { detectUnionVariant } from '@foormjs/atscript'

const index = detectUnionVariant('hello', variants) // 0 (string variant)
const index = detectUnionVariant({ name: 'x' }, variants) // 1 (object variant)
```

### `buildUnionVariants(typeDef: TAtscriptAnnotatedType): FoormUnionVariant[]`

Builds union variant definitions from a union annotated type. Auto-prefixes labels with index for multi-variant unions (e.g., "1. String").

```ts
import { buildUnionVariants } from '@foormjs/atscript'

const variants = buildUnionVariants(unionType)
// [{ label: '1. String', type, itemField, designType: 'string' },
//  { label: '2. Address', type, def, ... }]
```

## Path Utilities

### `getByPath(obj, path): unknown`

Gets a nested value by dot path. Always dereferences `obj.value` first (wrapper pattern).

```ts
import { getByPath } from '@foormjs/atscript'

getByPath(formData, '') // formData.value (root domain data)
getByPath(formData, 'email') // formData.value.email
getByPath(formData, 'address.city') // formData.value.address.city
```

### `setByPath(obj, path, value): void`

Sets a nested value by dot path. Creates intermediate objects as needed.

```ts
import { setByPath } from '@foormjs/atscript'

setByPath(formData, 'email', 'a@b.com')
setByPath(formData, 'address.city', 'NYC') // creates address if missing
setByPath(formData, '', { name: 'x' }) // replaces root
```

## Option Helpers

### `optKey(opt: TFoormEntryOptions): string`

Extracts the key from an option entry — plain string or `opt.key`.

### `optLabel(opt: TFoormEntryOptions): string`

Extracts the display label from an option entry — plain string or `opt.label`.

```ts
import { optKey, optLabel } from '@foormjs/atscript'

optKey('us') // 'us'
optKey({ key: 'us', label: 'USA' }) // 'us'
optLabel({ key: 'us', label: 'USA' }) // 'USA'
```

## Backend-Driven Forms (Serialization)

ATScript annotated types can be serialized to JSON on the backend and deserialized on the frontend — enabling fully backend-controlled forms without shipping `.as` files to the client. All metadata, validators (`@expect.*`, `@foorm.validate`), and computed function strings (`@foorm.fn.*`) survive the round-trip.

### Serialize (backend)

```ts
import { serializeAnnotatedType } from '@atscript/typescript/utils'
import { RegistrationForm } from './forms/registration.as'

const serialized = serializeAnnotatedType(RegistrationForm)
// → JSON-safe object, send as API response

// Optionally strip sensitive annotations
serializeAnnotatedType(RegistrationForm, {
  ignoreAnnotations: ['db.collection', 'internal.notes'],
})
```

### Deserialize (frontend)

```ts
import { deserializeAnnotatedType } from '@atscript/typescript/utils'
import { createFoormDef, createFormData } from '@foormjs/atscript'

const res = await fetch('/api/form/registration')
const type = deserializeAnnotatedType(await res.json())

// From here, same API as with .as imports
const def = createFoormDef(type)
const formData = createFormData(type, def.fields)
```

Use `createFoormDef` + `createFormData` directly (not `useFoorm`) since the type isn't available at component setup time.

### Alternative: JSON Schema

For non-ATScript backends, `fromJsonSchema()` converts a JSON Schema to an annotated type:

```ts
import { fromJsonSchema } from '@atscript/typescript/utils'

const type = fromJsonSchema(jsonSchema)
const def = createFoormDef(type)
```

**Limitation:** JSON Schema preserves type structure and `@expect.*` constraints but loses foorm-specific annotations (`@foorm.fn.*`, `@meta.label`, etc.). Use ATScript serialization for full fidelity.

### Manual type building (no .as files)

```ts
import { defineAnnotatedType } from '@atscript/typescript/utils'

const formType = defineAnnotatedType('object')
  .annotate('foorm.title', 'Dynamic Form')
  .annotate('foorm.submit.text', 'Send')
  .prop(
    'name',
    defineAnnotatedType()
      .designType('string')
      .annotate('meta.label', 'Full Name')
      .annotate('foorm.validate', '(v) => !!v || "Required"').$type
  )
  .prop(
    'email',
    defineAnnotatedType().designType('string').tag('email').annotate('meta.label', 'Email').$type,
    { optional: true }
  ).$type

const def = createFoormDef(formType)
```

## Best Practices

- Always use `createFoormDef` before accessing fields — don't manually iterate ATScript types
- Form data is wrapped in `{ value: ... }` — access domain data at `formData.value`
- Use `getByPath`/`setByPath` for path-based access; they handle the wrapper automatically
- `FoormFieldDef` is a thin pointer, not a copy — do not mutate it
- The `allStatic` flag on fields enables performance optimizations downstream (no Vue computeds needed)

## Gotchas

- `createFormData` wraps data in `{ value: T }` — OoForm handles this automatically, but standalone usage must account for it
- Objects without `@foorm.title` or `@foorm.component` are flattened — their children appear as top-level fields with dot paths
- Single-variant unions are unwrapped to their inner type (no `FoormUnionFieldDef`)
- `@foorm.order` defaults to `Infinity` — unordered fields appear after ordered ones, in declaration order
- Phantom fields (`foorm.action`, `foorm.paragraph`) are excluded from form data and validation
