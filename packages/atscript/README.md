# @foormjs/atscript

ATScript-first form model with validation. Define forms declaratively in `.as` files — fields, labels, validators, computed properties, and options — then create type-safe form definitions and validators at runtime.

## Install

```bash
pnpm add @foormjs/atscript @atscript/typescript
# or
npm install @foormjs/atscript @atscript/typescript
```

`@atscript/typescript` is a peer dependency required for type inference and validation utilities.

## Quick Start

### 1. Configure ATScript

```ts
// atscript.config.ts
import { defineConfig } from '@atscript/core'
import ts from '@atscript/typescript'
import { foormPlugin } from '@foormjs/atscript/plugin'

export default defineConfig({
  rootDir: 'src',
  plugins: [ts(), foormPlugin()],
})
```

### 2. Define a form schema

Create a `.as` file with ATScript annotations:

```
@foorm.title 'Registration'
@foorm.submit.text 'Register'
export interface RegistrationForm {
    @meta.label 'First Name'
    @meta.placeholder 'John'
    @foorm.autocomplete 'given-name'
    @meta.required 'First name is required'
    @foorm.order 1
    firstName: string

    @meta.label 'Email'
    @foorm.autocomplete 'email'
    @foorm.order 2
    email?: string.email

    @meta.label 'Country'
    @meta.placeholder 'Select a country'
    @foorm.options 'United States', 'us'
    @foorm.options 'Canada', 'ca'
    @foorm.order 3
    country?: foorm.select

    @meta.label 'I agree to terms'
    @foorm.order 4
    agreeToTerms: foorm.checkbox
}
```

### 3. Create a form definition and validate

```ts
import { createFoormDef, createFormData, getFormValidator } from '@foormjs/atscript'
import { RegistrationForm } from './registration-form.as'

// Create the form definition
const def = createFoormDef(RegistrationForm)

// Create reactive data with defaults
const data = createFormData(RegistrationForm, def.fields)

// Validate
const validate = getFormValidator(def)
const errors = validate({ data })
// errors: Record<string, string> — empty object means passed
```

## Arrays and Nested Structures

### Array Fields

Declare array fields with TypeScript array syntax. foorm automatically handles add/remove buttons, item rendering, and array-level validation:

```
@meta.label 'Tags'
@foorm.array.add.label 'Add tag'
@foorm.array.remove.label 'x'
@expect.maxLength 5, 'Maximum 5 tags'
tags: string[]

@meta.label 'Addresses'
@foorm.title 'Addresses'
@foorm.array.add.label 'Add address'
@foorm.array.remove.label 'Remove address'
addresses: {
    @meta.label 'Street'
    @meta.required 'Street is required'
    street: string

    @meta.label 'City'
    @meta.required 'City is required'
    city: string

    @meta.label 'ZIP'
    zip?: string
}[]
```

Supported item types: primitives (`string[]`, `number[]`, `boolean[]`), objects (`{ ... }[]`), and unions (`(ObjectType | string)[]`).

#### Array Annotations

| Annotation                              | Description                                        |
| --------------------------------------- | -------------------------------------------------- |
| `@foorm.array.add.label 'text'`         | Label for the add button (default: "Add item")     |
| `@foorm.array.add.component 'Name'`     | Custom add button component                        |
| `@foorm.array.remove.label 'text'`      | Label for the remove button (default: "Remove")    |
| `@foorm.array.variant.component 'Name'` | Custom variant selector component for union arrays |
| `@expect.minLength N, 'msg'`            | Minimum number of items                            |
| `@expect.maxLength N, 'msg'`            | Maximum number of items                            |

### Nested Groups

Use `@foorm.title` on an object field to render it as a titled group section:

```
@foorm.title 'Settings'
settings: {
    @meta.label 'Notify by email'
    emailNotify: foorm.checkbox

    @meta.label 'Max items per page'
    @foorm.type 'number'
    pageSize?: number
}
```

Without `@foorm.title`, nested object fields are flattened into the parent form. With `@foorm.title`, they render as a distinct visual section with a title header.

### Union Arrays

Arrays can contain multiple types. Each union member becomes a selectable variant:

```
@meta.label 'Contacts'
@foorm.array.add.label 'Add contact'
contacts: ({
    @meta.label 'Full Name'
    @meta.required 'Name is required'
    fullName: string

    @meta.label 'Email'
    email?: string.email
} | string)[]
```

The add button offers one option per variant. Items include a variant selector dropdown.

## Advanced Usage

### Computed Properties

Any field property can be made dynamic with `@foorm.fn.*` annotations. The function receives `(value, data, context, entry)`:

```
@meta.label 'Email'
@foorm.fn.label '(v, data) => data.firstName ? data.firstName + "s Email" : "Email"'
@foorm.fn.disabled '(v, data) => !data.firstName'
@foorm.fn.placeholder '(v, data) => data.firstName ? data.firstName + "@example.com" : "you@example.com"'
email?: string.email
```

Form-level computed properties receive `(data, context)`:

```
@foorm.fn.title '(data) => "Welcome, " + (data.firstName || "stranger")'
@foorm.fn.submit.disabled '(data) => !data.firstName || !data.email'
export interface MyForm {
    ...
}
```

### Validation

Use `@meta.required` to require non-blank strings (rejects empty and whitespace-only values). For booleans, it enforces `true`:

```
@meta.required 'Name is required'
name: string

// Or use the string.required primitive (implicitly adds @meta.required)
email: string.required

// For boolean fields, @meta.required means "must be true"
agreeToTerms: boolean.required
```

Use `@foorm.validate` for custom validation logic. The function returns `true` for pass or an error message string:

```
@foorm.validate '(v) => v.length >= 3 || "Must be at least 3 characters"'
firstName: string
```

Validators can also access the full form data and context:

```
@foorm.validate '(v, data) => v !== data.firstName || "Cannot match first name"'
lastName: string
```

ATScript's built-in `@expect.*` validators also work alongside foorm validators:

```
@expect.min 18, 'Must be 18 or older'
@expect.maxLength 100
age: number
```

### Form Context

Pass external data to computed functions and validators via context:

```ts
const validate = getFormValidator(def)
const errors = validate({
  data,
  context: { maxAge: 120, allowedDomains: ['example.com'] },
})
```

Context is available as the third argument in function strings:

```
@foorm.fn.options '(v, data, ctx) => ctx.cityOptions || []'
city?: foorm.select
```

### Custom Attributes

Pass arbitrary attributes to rendered components:

```
// Static attributes
@foorm.attr 'data-testid', 'username-input'
@foorm.attr 'aria-label', 'Username field'

// Computed attributes
@foorm.fn.attr 'data-valid', '(v) => v && v.length >= 3 ? "true" : "false"'
username?: string
```

### Foorm Primitives

Foorm provides special primitive types for non-data UI elements:

| Primitive         | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| `foorm.action`    | Button that triggers an alternate action (not a data field) |
| `foorm.paragraph` | Read-only text content                                      |
| `foorm.select`    | Dropdown select (string value)                              |
| `foorm.radio`     | Radio button group (string value)                           |
| `foorm.checkbox`  | Boolean checkbox toggle                                     |

```
@meta.label 'Reset Password'
@foorm.altAction 'reset-password'
resetBtn: foorm.action

@foorm.value 'Please fill out the form below.'
info: foorm.paragraph
```

### Plugin Configuration

Register extra field types and custom component names for IDE autocomplete:

```ts
foormPlugin({
  extraTypes: ['color', 'rating', 'date-range'],
  components: ['CustomStarInput', 'ColorPicker'],
})
```

### Resolving Field Properties at Runtime

Use resolve utilities to read metadata on demand from a field's ATScript prop:

```ts
import { resolveFieldProp, resolveOptions, resolveAttrs } from '@foormjs/atscript'

const scope = { v: currentValue, data: formData, context, entry }

// Resolve a single property (checks fn first, then static)
const label = resolveFieldProp<string>(field.prop, 'foorm.fn.label', 'meta.label', scope)

// Resolve select/radio options
const options = resolveOptions(field.prop, scope)

// Resolve custom attributes
const attrs = resolveAttrs(field.prop, scope)
```

## API Reference

### Core

| Export                           | Description                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `createFoormDef(type)`           | Converts an ATScript annotated type into a `FoormDef` with ordered fields     |
| `createFormData(type, fields)`   | Creates a data object with defaults from the schema                           |
| `createItemData(variant)`        | Creates a default data value for an array item variant                        |
| `detectVariant(value, variants)` | Detects which variant an existing array item value matches                    |
| `buildVariants(itemType)`        | Builds variant definitions for an array item type                             |
| `getFormValidator(def, opts?)`   | Returns a reusable `({ data, context? }) => Record<string, string>` validator |
| `supportsAltAction(def, action)` | Checks if any field supports a given alternate action                         |
| `isArrayField(field)`            | Type guard: returns true if the field is an array field                       |
| `isGroupField(field)`            | Type guard: returns true if the field is a group field                        |

### Resolve Utilities

| Export                                                   | Description                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| `resolveFieldProp(prop, fnKey, staticKey, scope, opts?)` | Resolves a field-level metadata value (fn or static)        |
| `resolveFormProp(type, fnKey, staticKey, scope, opts?)`  | Resolves a form-level metadata value (fn or static)         |
| `resolveOptions(prop, scope)`                            | Resolves `@foorm.options` / `@foorm.fn.options`             |
| `resolveAttrs(prop, scope)`                              | Resolves `@foorm.attr` / `@foorm.fn.attr`                   |
| `getFieldMeta(prop, key)`                                | Reads a static metadata value from a field prop             |
| `hasComputedAnnotations(prop)`                           | Returns true if the field has any `@foorm.fn.*` annotations |
| `parseStaticOptions(raw)`                                | Normalizes raw options metadata into `TFoormEntryOptions[]` |

### General Utilities

| Export                        | Description                                          |
| ----------------------------- | ---------------------------------------------------- |
| `evalComputed(value, scope)`  | Resolves a `TComputed<T>` value (static or function) |
| `getByPath(obj, path)`        | Gets a nested value by dot-separated path            |
| `setByPath(obj, path, value)` | Sets a nested value by dot-separated path            |

### Function Compilers

| Export                      | Description                                            |
| --------------------------- | ------------------------------------------------------ |
| `compileFieldFn(fnStr)`     | Compiles a `@foorm.fn.*` function string (field-level) |
| `compileTopFn(fnStr)`       | Compiles a `@foorm.fn.*` function string (form-level)  |
| `compileValidatorFn(fnStr)` | Compiles a `@foorm.validate` function string           |

### Validator Plugin

| Export                   | Description                                                            |
| ------------------------ | ---------------------------------------------------------------------- |
| `foormValidatorPlugin()` | Creates an ATScript validator plugin for `@foorm.validate` annotations |

### Types

| Export                      | Description                                                                  |
| --------------------------- | ---------------------------------------------------------------------------- |
| `FoormDef`                  | Complete form definition (type, fields, flatMap)                             |
| `FoormFieldDef`             | Single field definition (path?, prop, type, phantom, name, allStatic)        |
| `FoormArrayFieldDef`        | Array field definition (extends FoormFieldDef with itemType, variants)       |
| `FoormGroupFieldDef`        | Group field definition (extends FoormFieldDef with groupDef)                 |
| `FoormArrayVariant`         | Variant definition for array items (label, type, def, itemField, designType) |
| `TFoormFnScope`             | Scope object passed to computed functions (`v`, `data`, `context`, `entry`)  |
| `TFoormFieldEvaluated`      | Evaluated field snapshot passed as `entry` in scope                          |
| `TFoormEntryOptions`        | Option for select/radio fields (`string` or `{ key, label }`)                |
| `TComputed<T>`              | A value that is either static or a function of scope                         |
| `TResolveOptions<T>`        | Options for resolve utilities (staticAsBoolean, transform)                   |
| `TFormValidatorCallOptions` | Per-call options for `getFormValidator` return fn (data, context?)           |
| `TFoormValidatorContext`    | Per-call validator context (data, context)                                   |

### Build-time Plugin

| Export                | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `foormPlugin(opts?)`  | ATScript plugin for `@foorm.*` annotations and primitives |
| `TFoormPluginOptions` | Plugin options (`{ extraTypes?, components? }`)           |
| `annotations`         | Raw annotation definitions tree                           |
| `primitives`          | Raw primitive definitions                                 |

For ATScript documentation, see [atscript.moost.org](https://atscript.moost.org).

## License

MIT
