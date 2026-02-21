# Types Reference — @foormjs/atscript

> Complete type definitions for form definitions, field types, scope types, union variants, and type guards.

## Core Types

### FoormDef

Complete form definition produced by `createFoormDef()`.

```ts
interface FoormDef {
  type: TAtscriptAnnotatedType // Source annotated type
  rootField: FoormFieldDef // Root field (type='object' for interfaces, leaf type otherwise)
  fields: FoormFieldDef[] // Ordered fields (by @foorm.order)
  flatMap: Map<string, TAtscriptAnnotatedType> // All nested fields by dot path
}
```

### FoormFieldDef

Single form field — a thin pointer to an ATScript prop.

```ts
interface FoormFieldDef {
  path: string // Dot-separated path (e.g., 'address.street'). '' = root
  prop: TAtscriptAnnotatedType // ATScript prop with metadata
  type: string // Resolved input type ('text', 'select', 'object', 'array', 'union', 'tuple', etc.)
  phantom: boolean // True for foorm.action, foorm.paragraph
  name: string // Last segment of path
  allStatic: boolean // True if no foorm.fn.* or foorm.validate annotations (perf flag)
}
```

### FoormArrayFieldDef

Array field with item type information.

```ts
interface FoormArrayFieldDef extends FoormFieldDef {
  itemType: TAtscriptAnnotatedType // ATScript type of array items (from TAtscriptTypeArray.of)
  itemField: FoormFieldDef // Pre-built template field def for items (path='')
}
```

### FoormObjectFieldDef

Object field with nested form definition.

```ts
interface FoormObjectFieldDef extends FoormFieldDef {
  objectDef: FoormDef // Pre-built FoormDef for the nested object's fields
}
```

### FoormUnionFieldDef

Union field with available variants.

```ts
interface FoormUnionFieldDef extends FoormFieldDef {
  unionVariants: FoormUnionVariant[] // Available union branches
}
```

### FoormTupleFieldDef

Tuple field with positional field definitions.

```ts
interface FoormTupleFieldDef extends FoormFieldDef {
  itemFields: FoormFieldDef[] // Pre-built field defs, one per tuple position
}
```

### FoormUnionVariant

A single union branch.

```ts
interface FoormUnionVariant {
  label: string // Display label (from @meta.label or auto-generated, e.g. "1. String")
  type: TAtscriptAnnotatedType // The annotated type for this variant
  def?: FoormDef // Pre-built FoormDef for object variants (undefined for primitives)
  itemField?: FoormFieldDef // Pre-built field def for primitive variants (undefined for objects)
  designType?: string // Design type for primitive variants ('string', 'number', 'boolean')
}
```

## Scope & Evaluation Types

### TFoormFnScope

Scope passed to computed `@foorm.fn.*` functions.

```ts
interface TFoormFnScope<V = unknown, D = Record<string, unknown>, C = Record<string, unknown>> {
  v?: V // Current field value
  data: D // Full form data
  context: C // External context
  entry?: TFoormFieldEvaluated // Evaluated field snapshot (only in full scope)
  action?: string // Current action (if any)
}
```

### TFoormFieldEvaluated

Evaluated snapshot of a field's current state — the `entry` in `TFoormFnScope`.

```ts
interface TFoormFieldEvaluated {
  field: string // Field path (e.g., 'address.city'). '' for root
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

An option entry for select/radio fields.

```ts
type TFoormEntryOptions = { key: string; label: string } | string
```

### TComputed

A value that may be static or a function of scope.

```ts
type TComputed<T> = T | ((scope: TFoormFnScope) => T)
```

### TFoormAltAction

Alternate action metadata from `@foorm.altAction`.

```ts
interface TFoormAltAction {
  id: string // Action identifier
  label: string // Display label
}
```

## Resolve/Build Types

### TResolveOptions

Options for `resolveFieldProp`/`resolveFormProp`.

```ts
interface TResolveOptions<T> {
  staticAsBoolean?: boolean // Treat metadata presence as true (for flag annotations)
  transform?: (v: T) => T // Transform function applied to result
}
```

### TBuildFieldEntryOpts

Options for `buildFieldEntry` — pre-resolved values that skip metadata resolution.

```ts
interface TBuildFieldEntryOpts {
  type?: string // Pre-resolved field type
  component?: string // Pre-resolved component name
  disabled?: boolean // Pre-resolved disabled state
  hidden?: boolean // Pre-resolved hidden state
  readonly?: boolean // Pre-resolved readonly state
}
```

## Validation Types

### TFormValidatorCallOptions

Per-call options for the form validator function.

```ts
interface TFormValidatorCallOptions {
  data: Record<string, unknown>
  context?: Record<string, unknown>
}
```

### TFieldValidatorOptions

Options for `createFieldValidator`.

```ts
interface TFieldValidatorOptions {
  rootOnly?: boolean // Only report errors at the root path
}
```

### TFoormValidatorContext

Context passed to the validator plugin (via ATScript's external context mechanism).

```ts
interface TFoormValidatorContext {
  data: Record<string, unknown>
  context: Record<string, unknown>
}
```

## Type Guards

```ts
import { isArrayField, isObjectField, isUnionField, isTupleField } from '@foormjs/atscript'

isArrayField(field) // field is FoormArrayFieldDef
isObjectField(field) // field is FoormObjectFieldDef
isUnionField(field) // field is FoormUnionFieldDef
isTupleField(field) // field is FoormTupleFieldDef
```

Use type guards before accessing extended properties like `objectDef`, `unionVariants`, `itemFields`, `itemType`.

## Plugin Types

### TFoormPluginOptions

Options for `foormPlugin()` (build-time only).

```ts
interface TFoormPluginOptions {
  extraTypes?: string[] // Additional field types for @foorm.type autocomplete
  components?: string[] // Custom component names for @foorm.component autocomplete
}
```
