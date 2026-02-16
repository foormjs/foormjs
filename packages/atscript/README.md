# @foormjs/atscript

ATScript plugin for foormjs -- define forms declaratively with type-safe annotations.

Writing form definitions in plain TypeScript means juggling objects, validator functions, and computed property boilerplate. ATScript lets you write all of that as annotations directly on your interface fields. The result is a `.as` file that reads like a specification: labels, placeholders, validators, computed properties, and options are all visible at a glance, right next to the fields they describe.

The plugin provides primitives (`foorm.select`, `foorm.radio`, `foorm.checkbox`, `foorm.action`, `foorm.paragraph`), a full set of annotations for field metadata and computed behavior, and `createFoorm()` to convert annotated types into runtime `TFoormModel` objects.

## Install

```bash
npm install @foormjs/atscript
# or
pnpm add @foormjs/atscript
```

Peer dependency: `@atscript/typescript` (for type generation).

## Quick Start

### 1. Configure the plugin

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

### 2. Define a form

```
// login-form.as
@foorm.title 'Sign In'
@foorm.submit.text 'Log In'
export interface LoginForm {
    @meta.label 'Email'
    @meta.placeholder 'you@example.com'
    @foorm.autocomplete 'email'
    @foorm.validate '(v) => !!v || "Email is required"'
    @foorm.validate '(v) => v.includes("@") || "Invalid email"'
    email: string

    @meta.label 'Password'
    @foorm.type 'password'
    @foorm.validate '(v) => !!v || "Password is required"'
    password: string

    @meta.label 'Remember me'
    rememberMe?: foorm.checkbox
}
```

### 3. Use at runtime

```ts
import { createFoorm } from '@foormjs/atscript'
import { createFormData, getFormValidator } from 'foorm'
import { LoginForm } from './login-form.as'

const form = createFoorm(LoginForm)
const data = createFormData(form.fields)
const validator = getFormValidator(form)
```

## Practical Examples

### Static form with validation

```
@foorm.title 'Contact Us'
@foorm.submit.text 'Send Message'
export interface ContactForm {
    @meta.label 'Your Name'
    @meta.placeholder 'John Doe'
    @foorm.validate '(v) => !!v || "Name is required"'
    @foorm.order 1
    name: string

    @meta.label 'Email'
    @foorm.autocomplete 'email'
    @foorm.validate '(v) => !!v || "Email is required"'
    @foorm.validate '(v) => v.includes("@") || "Enter a valid email"'
    @foorm.order 2
    email: string

    @meta.label 'Message'
    @foorm.validate '(v) => !!v || "Message is required"'
    @foorm.validate '(v) => v.length >= 10 || "At least 10 characters"'
    @foorm.order 3
    message: string
}
```

### Reactive form with computed properties

Computed annotations (`@foorm.fn.*`) accept JavaScript function strings. Field-level functions receive `(value, data, context, entry)`, form-level functions receive `(data, context)`.

```
@foorm.fn.title '(data) => "Welcome, " + (data.firstName || "Guest")'
@foorm.submit.text 'Register'
@foorm.fn.submit.disabled '(data) => !data.firstName || !data.lastName'
export interface SignupForm {
    @meta.label 'First Name'
    @meta.placeholder 'Alice'
    @foorm.validate '(v) => !!v || "Required"'
    @foorm.order 1
    firstName: string

    @meta.label 'Last Name'
    @foorm.fn.placeholder '(v, data) => data.firstName ? "Same as " + data.firstName + "?" : "Doe"'
    @foorm.validate '(v) => !!v || "Required"'
    @foorm.order 2
    lastName: string

    @meta.label 'Full Name'
    @meta.description 'This is computed from your first and last name'
    @foorm.readonly
    @foorm.fn.value '(v, data) => (data.firstName || "") + " " + (data.lastName || "")'
    @foorm.order 3
    fullName: string

    @meta.label 'Password'
    @foorm.type 'password'
    @foorm.fn.disabled '(v, data) => !data.firstName || !data.lastName'
    @foorm.validate '(v) => !!v || "Required"'
    @foorm.validate '(v) => v.length >= 8 || "At least 8 characters"'
    @foorm.order 4
    password: string
}
```

### Custom attributes example

Pass custom attributes to your components for testing, accessibility, or framework-specific props:

```
export interface AdvancedForm {
    @meta.label 'Email'
    @foorm.attr 'data-testid', 'email-input'
    @foorm.attr 'autocorrect', 'off'
    @foorm.fn.attr 'aria-label', '(v, data) => "Email for " + (data.name || "user")'
    email: string
}
```

### Select, radio, and checkbox fields

Use `foorm.select`, `foorm.radio`, and `foorm.checkbox` primitives with `@foorm.options` for static choices or `@foorm.fn.options` for dynamic choices from context:

```
export interface PreferencesForm {
    // Static options
    @meta.label 'Country'
    @meta.placeholder 'Select a country'
    @foorm.options 'United States', 'us'
    @foorm.options 'Canada', 'ca'
    @foorm.options 'United Kingdom', 'uk'
    country?: foorm.select

    // Options from context (backend-provided)
    @meta.label 'City'
    @meta.placeholder 'Select a city'
    @foorm.fn.options '(v, data, context) => context.cityOptions || []'
    city?: foorm.select

    // Radio group
    @meta.label 'Theme'
    @foorm.options 'Light', 'light'
    @foorm.options 'Dark', 'dark'
    @foorm.options 'System', 'system'
    theme?: foorm.radio

    // Boolean checkbox
    @meta.label 'I agree to the terms and conditions'
    @foorm.validate '(v) => v === true || "You must agree"'
    agreeToTerms: foorm.checkbox
}
```

When using `@foorm.fn.options`, the backend passes option lists through the context object:

```ts
const context = {
  cityOptions: [
    { key: 'nyc', label: 'New York' },
    { key: 'la', label: 'Los Angeles' },
  ],
}
```

### Non-data fields: paragraphs and actions

```
export interface WizardStep {
    @meta.label 'Please review your information before submitting.'
    info: foorm.paragraph

    @meta.label 'First Name'
    firstName: string

    @meta.label 'Reset Form'
    @foorm.altAction 'reset'
    resetBtn: foorm.action
}
```

Paragraphs render as static text. Actions render as buttons that emit events instead of submitting the form.

## Annotations Reference

### Form-Level Annotations

| Annotation                                       | Description                                     |
| ------------------------------------------------ | ----------------------------------------------- |
| `@foorm.title 'text'`                            | Static form title                               |
| `@foorm.submit.text 'text'`                      | Static submit button text (default: `"Submit"`) |
| `@foorm.fn.title '(data, ctx) => ...'`           | Computed form title                             |
| `@foorm.fn.submit.text '(data, ctx) => ...'`     | Computed submit button text                     |
| `@foorm.fn.submit.disabled '(data, ctx) => ...'` | Computed submit disabled state                  |

### Field-Level Static Annotations

| Annotation                    | Description                                           |
| ----------------------------- | ----------------------------------------------------- |
| `@foorm.type 'text'`          | Field input type (text, password, number, date, etc.) |
| `@foorm.component 'name'`     | Named component override for rendering                |
| `@foorm.autocomplete 'value'` | HTML autocomplete attribute                           |
| `@foorm.altAction 'name'`     | Alternate action name (for action fields)             |
| `@foorm.value 'default'`      | Default field value                                   |
| `@foorm.order N`              | Rendering order (lower = earlier)                     |
| `@foorm.hidden`               | Mark field as statically hidden                       |
| `@foorm.disabled`             | Mark field as statically disabled                     |
| `@foorm.readonly`             | Mark field as read-only (visible but not editable)    |

### Custom Attributes

Pass custom HTML attributes or Vue props to field components:

| Annotation                           | Description                                 |
| ------------------------------------ | ------------------------------------------- |
| `@foorm.attr 'name', 'value'`        | Static custom attribute (repeat for each)   |
| `@foorm.fn.attr 'name', '(v, ...) => ...'` | Computed custom attribute (repeat for each) |

### Options Annotation

| Annotation                        | Description                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `@foorm.options 'Label', 'value'` | Add a static option. Repeat for each choice. Value defaults to label if omitted. |

### Validation Annotation

| Annotation                                | Description                                                                                   |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| `@foorm.validate '(v, data, ctx) => ...'` | Custom validator. Returns `true` to pass, or an error string. Repeat for multiple validators. |

Validators run in declaration order and stop on first failure.

### Computed (fn) Annotations

All field-level computed functions receive `(value, data, context, entry)`:

| Annotation              | Return type            | Description                     |
| ----------------------- | ---------------------- | ------------------------------- |
| `@foorm.fn.label`       | `string`               | Computed label                  |
| `@foorm.fn.description` | `string`               | Computed description            |
| `@foorm.fn.hint`        | `string`               | Computed hint text              |
| `@foorm.fn.placeholder` | `string`               | Computed placeholder            |
| `@foorm.fn.disabled`    | `boolean`              | Computed disabled state         |
| `@foorm.fn.hidden`      | `boolean`              | Computed hidden state           |
| `@foorm.fn.readonly`    | `boolean`              | Computed readonly state         |
| `@foorm.fn.optional`    | `boolean`              | Computed optional state         |
| `@foorm.fn.value`       | `unknown`              | Computed field value            |
| `@foorm.fn.classes`     | `string \| Record`     | Computed CSS classes            |
| `@foorm.fn.styles`      | `string \| Record`     | Computed inline styles          |
| `@foorm.fn.options`     | `TFoormEntryOptions[]` | Computed options (select/radio) |

### Metadata Annotations (from ATScript core)

| Annotation                 | Description       |
| -------------------------- | ----------------- |
| `@meta.label 'text'`       | Field label       |
| `@meta.description 'text'` | Field description |
| `@meta.hint 'text'`        | Hint text         |
| `@meta.placeholder 'text'` | Input placeholder |

### Constraint Annotations (from ATScript core)

| Annotation            | Description           |
| --------------------- | --------------------- |
| `@expect.maxLength N` | Maximum string length |
| `@expect.minLength N` | Minimum string length |
| `@expect.min N`       | Minimum numeric value |
| `@expect.max N`       | Maximum numeric value |

## Primitives

| Primitive         | Underlying type | Description                       |
| ----------------- | --------------- | --------------------------------- |
| `foorm.select`    | `string`        | Dropdown select field             |
| `foorm.radio`     | `string`        | Radio button group                |
| `foorm.checkbox`  | `boolean`       | Single checkbox toggle            |
| `foorm.action`    | phantom         | Button that emits an action event |
| `foorm.paragraph` | phantom         | Static read-only text             |

Phantom primitives are excluded from form data -- they exist only for UI rendering.

## Plugin Options

```ts
foormPlugin({
  // Extend allowed values for @foorm.type
  extraTypes: ['tel', 'url', 'color'],

  // Enable autocomplete for @foorm.component
  components: ['CustomInput', 'DatePicker', 'RichTextEditor'],
})
```

When `components` is provided, `@foorm.component` gets IDE autocomplete suggestions and compile-time validation against the list. When omitted, any string is accepted.

When `extraTypes` is provided, the additional values are added to the built-in `@foorm.type` values (text, password, number, select, textarea, checkbox, radio, date, paragraph, action).

## Field Type Resolution

`createFoorm()` determines each field's type in this order:

1. `@foorm.type` annotation (explicit override)
2. Foorm primitive tag (`foorm.select`, `foorm.radio`, `foorm.checkbox`, `foorm.action`, `foorm.paragraph`)
3. Default: `'text'`

## Options Resolution

For select and radio fields, options are resolved in this order:

1. `@foorm.fn.options` (computed) -- if present, compiled as a function
2. `@foorm.options` (static) -- parsed from annotation values
3. `undefined` -- no options

The computed path takes precedence, so you can define static fallbacks that are overridden when a `fn.options` annotation exists.

## License

MIT
