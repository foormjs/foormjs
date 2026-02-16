# foorm

Core form model for building validatable, reactive forms in any JavaScript environment.

Forms are more than just inputs on a screen. They have conditional logic, validation rules that depend on other fields, labels that change based on context, and fields that appear or disappear based on user input. `foorm` captures all of this in a single, portable model where every property can be either a static value or a computed function. The same model works on the server for validation and on the client for rendering, with zero framework dependencies.

## Install

```bash
npm install foorm
# or
pnpm add foorm
```

## Quick Start

Define a form model and validate it:

```ts
import { createFormData, getFormValidator } from 'foorm'
import type { TFoormModel } from 'foorm'

const form: TFoormModel = {
  title: 'Registration',
  submit: { text: 'Create Account' },
  fields: [
    {
      field: 'email',
      type: 'text',
      label: 'Email',
      optional: false,
      disabled: false,
      hidden: false,
      validators: [
        s => !!s.v || 'Email is required',
        s => String(s.v).includes('@') || 'Must be a valid email',
      ],
    },
    {
      field: 'age',
      type: 'number',
      label: 'Age',
      optional: false,
      disabled: false,
      hidden: false,
      validators: [
        s => !!s.v || 'Age is required',
        s => Number(s.v) >= 18 || 'Must be 18 or older',
      ],
    },
  ],
}

// Create initial data from field defaults
const data = createFormData(form.fields)
// => { email: undefined, age: undefined }

// Validate the entire form
const validator = getFormValidator(form)
const result = validator({ email: 'alice@example.com', age: 25 })
// => { passed: true, errors: {} }
```

## Computed Properties

The core idea behind foorm is `TComputed<T>` -- any field property can be either a static value or a function that reacts to form state:

```ts
import type { TFoormField } from 'foorm'

const passwordField: TFoormField = {
  field: 'password',
  type: 'password',
  label: 'Password',
  optional: false,
  hidden: false,

  // Static placeholder
  placeholder: 'Enter a strong password',

  // Computed: disabled until name is filled
  disabled: scope => !scope.data.name,

  // Computed: hint changes based on value
  hint: scope =>
    scope.v ? `${8 - String(scope.v).length} more characters needed` : 'At least 8 characters',

  validators: [
    s => !!s.v || 'Password is required',
    s => String(s.v).length >= 8 || 'At least 8 characters',
  ],
}
```

Every computed function receives a `TFoormFnScope` object:

```ts
interface TFoormFnScope {
  v?: unknown // Current field value
  data: Record<string, unknown> // All form data
  context: Record<string, unknown> // External context (user info, locale, etc.)
  entry?: TFoormFieldEvaluated // Evaluated field metadata
}
```

The `context` object is your escape hatch for passing in external data -- user roles, locale strings, API-fetched options -- anything the form needs but doesn't own.

## Using with ATScript

While you can build `TFoormModel` objects by hand, the recommended approach is to use `@foormjs/atscript` to define forms declaratively in `.as` files:

```
@foorm.fn.title '(data) => "Hello, " + (data.name || "stranger")'
@foorm.submit.text 'Register'
export interface RegistrationForm {
    @meta.label 'Name'
    @foorm.validate '(v) => !!v || "Name is required"'
    name: string

    @meta.label 'Country'
    @foorm.options 'United States', 'us'
    @foorm.options 'Canada', 'ca'
    country?: foorm.select
}
```

Then convert it to a runtime model:

```ts
import { createFoorm } from '@foormjs/atscript'
import { RegistrationForm } from './registration.as'

const form = createFoorm(RegistrationForm)
```

See [`@foormjs/atscript`](../atscript) for the full annotation reference.

## API Reference

### `createFormData(fields)`

Creates an initial data object from field definitions. Each field's `value` property becomes the default. Non-data fields (`action`, `paragraph`) are excluded.

```ts
const data = createFormData(form.fields)
// => { email: undefined, name: 'Default Name', ... }
```

### `getFormValidator(model, context?)`

Returns a reusable validator function for the entire form. The validator evaluates computed constraints per field, skips disabled/hidden fields, enforces required checks, then runs custom validators.

```ts
const validate = getFormValidator(form, { locale: 'en' })

const result = validate(formData)
// => { passed: false, errors: { email: 'Email is required' } }
```

Validation order per field:

1. Skip if field type is `action` or `paragraph`
2. Evaluate `disabled`, `optional`, `hidden` (may be computed)
3. Skip if disabled or hidden
4. If not optional and value is falsy, return `"Required"` error
5. Run custom validators in order, stop on first failure

### `validate(validators, scope)`

Validates a single field by running its validators in sequence. Returns on first failure.

```ts
import { validate } from 'foorm'

const result = validate(field.validators, { v: 'test', data, context: {} })
if (!result.passed) {
  console.log(result.error) // "Too short"
}
```

### `evalComputed(value, scope)`

Resolves a `TComputed<T>` value. If it's a function, calls it with the scope. Otherwise returns the static value.

```ts
import { evalComputed } from 'foorm'

evalComputed('Hello', scope) // => 'Hello'
evalComputed(s => `Hi ${s.data.name}`, scope) // => 'Hi Alice'
```

### `supportsAltAction(model, actionName)`

Checks if any field in the model declares the given alternate action name.

```ts
if (supportsAltAction(form, 'save-draft')) {
  // Show "Save Draft" button
}
```

## Types

### `TFoormModel`

The complete form model:

```ts
interface TFoormModel {
  title?: TComputed<string>
  submit: TFoormSubmit
  fields: TFoormField[]
}
```

### `TFoormField`

A single field definition. All description and constraint properties support `TComputed<T>`:

| Property       | Type                                           | Description                                                       |
| -------------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| `field`        | `string`                                       | Field identifier (required)                                       |
| `type`         | `string`                                       | Input type: text, password, number, select, radio, checkbox, etc. |
| `label`        | `TComputed<string>`                            | Field label                                                       |
| `description`  | `TComputed<string>`                            | Descriptive text below the label                                  |
| `hint`         | `TComputed<string>`                            | Hint text (shown when no error)                                   |
| `placeholder`  | `TComputed<string>`                            | Input placeholder                                                 |
| `optional`     | `TComputed<boolean>`                           | Whether the field is optional                                     |
| `disabled`     | `TComputed<boolean>`                           | Whether the field is disabled                                     |
| `hidden`       | `TComputed<boolean>`                           | Whether the field is hidden                                       |
| `classes`      | `TComputed<string \| Record<string, boolean>>` | CSS classes                                                       |
| `styles`       | `TComputed<string \| Record<string, string>>`  | Inline styles                                                     |
| `options`      | `TComputed<TFoormEntryOptions[]>`              | Options for select/radio fields                                   |
| `validators`   | `Array<(scope) => boolean \| string>`          | Validation functions                                              |
| `component`    | `string`                                       | Named component override                                          |
| `autocomplete` | `string`                                       | HTML autocomplete attribute                                       |
| `altAction`    | `string`                                       | Alternate submit action name                                      |
| `order`        | `number`                                       | Rendering order                                                   |
| `value`        | `unknown`                                      | Default value                                                     |
| `maxLength`    | `number`                                       | HTML maxlength constraint                                         |
| `minLength`    | `number`                                       | HTML minlength constraint                                         |
| `min`          | `number`                                       | HTML min constraint                                               |
| `max`          | `number`                                       | HTML max constraint                                               |

### `TFoormEntryOptions`

Options for select and radio fields. Can be a simple string (used as both key and display label) or an object:

```ts
type TFoormEntryOptions = string | { key: string; label: string }
```

### `TComputed<T>`

The union type that powers reactive properties:

```ts
type TComputed<T> = T | ((scope: TFoormFnScope) => T)
```

## License

MIT
