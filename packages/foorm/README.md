# foorm

ATScript-first form model with validation. Define forms declaratively in `.as` files — fields, labels, validators, computed properties, and options — then create type-safe form definitions and validators at runtime.

## Install

```bash
pnpm add foorm @atscript/typescript
# or
npm install foorm @atscript/typescript
```

`@atscript/typescript` is a peer dependency required for type inference and validation utilities.

## Quick Start

### 1. Configure ATScript

```ts
// atscript.config.ts
import { defineConfig } from '@atscript/core'
import ts from '@atscript/typescript'
import { foormPlugin } from 'foorm/plugin'

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
    @foorm.validate '(v) => !!v || "First name is required"'
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
import { createFoormDef, createFormData, getFormValidator } from 'foorm'
import { RegistrationForm } from './registration-form.as'

// Create the form definition
const def = createFoormDef(RegistrationForm)

// Create reactive data with defaults
const data = createFormData(RegistrationForm, def.fields)

// Validate
const validate = getFormValidator(def)
const { passed, errors } = validate(data)
```

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

### Custom Validators

Use `@foorm.validate` for custom validation logic. The function returns `true` for pass or an error message string:

```
@foorm.validate '(v) => !!v || "This field is required"'
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
const validate = getFormValidator(def, {
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

| Primitive | Description |
|---|---|
| `foorm.action` | Button that triggers an alternate action (not a data field) |
| `foorm.paragraph` | Read-only text content |
| `foorm.select` | Dropdown select (string value) |
| `foorm.radio` | Radio button group (string value) |
| `foorm.checkbox` | Boolean checkbox toggle |

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
import { resolveFieldProp, resolveOptions, resolveAttrs } from 'foorm'

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

| Export | Description |
|---|---|
| `createFoormDef(type)` | Converts an ATScript annotated type into a `FoormDef` with ordered fields |
| `createFormData(type, fields)` | Creates a data object with defaults from the schema |
| `getFormValidator(def, opts?)` | Returns a reusable `(data) => { passed, errors }` validator function |
| `supportsAltAction(def, action)` | Checks if any field supports a given alternate action |

### Resolve Utilities

| Export | Description |
|---|---|
| `resolveFieldProp(prop, fnKey, staticKey, scope, opts?)` | Resolves a field-level metadata value (fn or static) |
| `resolveFormProp(type, fnKey, staticKey, scope, opts?)` | Resolves a form-level metadata value (fn or static) |
| `resolveOptions(prop, scope)` | Resolves `@foorm.options` / `@foorm.fn.options` |
| `resolveAttrs(prop, scope)` | Resolves `@foorm.attr` / `@foorm.fn.attr` |
| `getFieldMeta(prop, key)` | Reads a static metadata value from a field prop |
| `hasComputedAnnotations(prop)` | Returns true if the field has any `@foorm.fn.*` annotations |
| `parseStaticOptions(raw)` | Normalizes raw options metadata into `TFoormEntryOptions[]` |

### General Utilities

| Export | Description |
|---|---|
| `evalComputed(value, scope)` | Resolves a `TComputed<T>` value (static or function) |
| `getByPath(obj, path)` | Gets a nested value by dot-separated path |
| `setByPath(obj, path, value)` | Sets a nested value by dot-separated path |

### Function Compilers

| Export | Description |
|---|---|
| `compileFieldFn(fnStr)` | Compiles a `@foorm.fn.*` function string (field-level) |
| `compileTopFn(fnStr)` | Compiles a `@foorm.fn.*` function string (form-level) |
| `compileValidatorFn(fnStr)` | Compiles a `@foorm.validate` function string |

### Validator Plugin

| Export | Description |
|---|---|
| `foormValidatorPlugin(opts?)` | Creates an ATScript validator plugin for foorm annotations |

### Types

| Export | Description |
|---|---|
| `FoormDef` | Complete form definition (type, fields, flatMap) |
| `FoormFieldDef` | Single field definition (path, prop, type, phantom, name, allStatic) |
| `TFoormFnScope` | Scope object passed to computed functions (`v`, `data`, `context`, `entry`) |
| `TFoormFieldEvaluated` | Evaluated field snapshot passed as `entry` in scope |
| `TFoormEntryOptions` | Option for select/radio fields (`string` or `{ key, label }`) |
| `TComputed<T>` | A value that is either static or a function of scope |
| `TResolveOptions<T>` | Options for resolve utilities (staticAsBoolean, transform) |
| `TFoormPluginOptions` | Validator plugin options (skipDisabledHidden, checkRequired) |
| `TFoormValidatorContext` | Per-call validator context (data, context) |

### Build-time Plugin

| Export | Description |
|---|---|
| `foormPlugin(opts?)` | ATScript plugin for `@foorm.*` annotations and primitives |
| `TFoormPluginOptions` | Plugin options (extraTypes, components) |
| `annotations` | Raw annotation definitions tree |
| `primitives` | Raw primitive definitions |

For ATScript documentation, see [atscript.moost.org](https://atscript.moost.org).

## License

MIT
