# Writing Form Schemas

Forms are defined as annotated interfaces in `.as` files. ATScript annotations provide all field metadata — labels, placeholders, validators, computed properties, options, and more.

## Basic Form

```
@foorm.title 'Registration'
@foorm.submit.text 'Register'
export interface RegistrationForm {
    @meta.label 'First Name'
    @meta.placeholder 'John'
    @foorm.order 1
    firstName: string

    @meta.label 'Email'
    @foorm.order 2
    email: string.email

    @meta.label 'Country'
    @foorm.options 'United States', 'us'
    @foorm.options 'Canada', 'ca'
    @foorm.order 3
    country?: foorm.select
}
```

---

## Form-Level Annotations

| Annotation                                  | Description                              |
| ------------------------------------------- | ---------------------------------------- |
| `@foorm.title 'text'`                       | Static form title                        |
| `@foorm.submit.text 'text'`                 | Submit button text (default: `'Submit'`) |
| `@foorm.submit.disabled`                    | Statically disable the submit button     |
| `@foorm.fn.title '(data) => ...'`           | Computed form title                      |
| `@foorm.fn.submit.text '(data) => ...'`     | Computed submit text                     |
| `@foorm.fn.submit.disabled '(data) => ...'` | Computed submit disabled state           |

---

## Field-Level Annotations

### Static Metadata

| Annotation                       | Description                                               |
| -------------------------------- | --------------------------------------------------------- |
| `@meta.label 'text'`             | Field label                                               |
| `@meta.description 'text'`       | Field description                                         |
| `@meta.hint 'text'`              | Hint text (shown below field)                             |
| `@meta.placeholder 'text'`       | Placeholder text                                          |
| `@meta.sensitive`                | Marks as sensitive (e.g., passwords)                      |
| `@meta.readonly`                 | Read-only field                                           |
| `@foorm.type 'text'`             | Input type (`text`, `password`, `number`, `select`, etc.) |
| `@foorm.component 'Name'`        | Specific named component to render this field             |
| `@foorm.autocomplete 'email'`    | HTML autocomplete attribute                               |
| `@foorm.order 1`                 | Rendering order (lower = first)                           |
| `@foorm.value 'default'`         | Default/static value                                      |
| `@foorm.hidden`                  | Hide the field                                            |
| `@foorm.disabled`                | Disable the field                                         |
| `@foorm.readonly`                | Read-only mode                                            |
| `@foorm.altAction 'id', 'label'` | Alternate action (id required, label optional)            |

### Computed Properties (`@foorm.fn.*`)

Any field property can be dynamic. Function strings receive `(v, data, context, entry)`:

| Annotation                                  | Returns                |
| ------------------------------------------- | ---------------------- |
| `@foorm.fn.label '(v, data) => ...'`        | `string`               |
| `@foorm.fn.description '(v, data) => ...'`  | `string`               |
| `@foorm.fn.hint '(v, data) => ...'`         | `string`               |
| `@foorm.fn.placeholder '(v, data) => ...'`  | `string`               |
| `@foorm.fn.disabled '(v, data) => ...'`     | `boolean`              |
| `@foorm.fn.hidden '(v, data) => ...'`       | `boolean`              |
| `@foorm.fn.readonly '(v, data) => ...'`     | `boolean`              |
| `@foorm.fn.value '(v, data) => ...'`        | `any`                  |
| `@foorm.fn.classes '(v, data) => ...'`      | `string \| object`     |
| `@foorm.fn.styles '(v, data) => ...'`       | `string \| object`     |
| `@foorm.fn.options '(v, data, ctx) => ...'` | `TFoormEntryOptions[]` |
| `@foorm.fn.attr 'key', '(v, data) => ...'`  | `string` (repeatable)  |

**Function arguments:**

- `v` — current field value
- `data` — full form data object
- `context` — external context passed via `formContext` prop
- `entry` — evaluated field snapshot (`TFoormFieldEvaluated`):

| Property    | Type                   | Description                                   |
| ----------- | ---------------------- | --------------------------------------------- |
| `field`     | `string \| undefined`  | Field path (e.g., `'address.city'`)           |
| `type`      | `string`               | Resolved input type (`'text'`, `'select'`...) |
| `component` | `string \| undefined`  | Named component from `@foorm.component`       |
| `name`      | `string`               | Field name (last segment of path)             |
| `disabled`  | `boolean \| undefined` | Whether the field is disabled                 |
| `optional`  | `boolean \| undefined` | Whether the field is optional                 |
| `hidden`    | `boolean \| undefined` | Whether the field is hidden                   |
| `readonly`  | `boolean \| undefined` | Whether the field is read-only                |
| `options`   | `TFoormEntryOptions[]` | Resolved options for select/radio fields      |

**Caveat:** Functions are strings compiled at runtime with `new Function()`. No imports, no closures — only pure expressions.

### Validation

```
// Required non-blank string (rejects '' and whitespace-only)
@meta.required
name: string

// Required non-blank string with custom error message
@meta.required 'First name is required'
firstName: string

// Or use the string.required primitive (implicitly adds @meta.required)
email: string.required

// Custom validators (return true or error string)
@foorm.validate '(v) => v.length >= 3 || "Too short"'
@foorm.validate '(v, data) => v !== data.firstName || "Cannot match first name"'

// ATScript built-in constraints (also enforced)
@expect.min 18, 'Must be 18 or older'
@expect.maxLength 100
@expect.pattern '^[a-z]+$', '', 'Only lowercase letters'
```

`@meta.required` validates that a string contains at least one non-whitespace character, or that a boolean is `true`. Default error: `"Must not be empty"`. Pass a custom message as argument: `@meta.required 'Name is required'`. The `@meta.required` annotation is assignable to boolean props.

Multiple `@foorm.validate` annotations stack — all must pass. They run alongside ATScript's `@expect.*` and `@meta.required` validators.

### Options (select/radio)

```
// Static options — label, value pairs
@foorm.options 'United States', 'us'
@foorm.options 'Canada', 'ca'
@foorm.options 'Mexico', 'mx'
country?: foorm.select

// Computed options from context
@foorm.fn.options '(v, data, ctx) => ctx.cityOptions || []'
city?: foorm.select
```

Options can be `string` (used as both key and label) or `{ key, label }` objects.

### Custom Attributes

```
// Static attributes
@foorm.attr 'data-testid', 'email-field'
@foorm.attr 'aria-label', 'Email address'

// Computed attributes
@foorm.fn.attr 'data-valid', '(v) => v ? "true" : "false"'
```

Attributes are passed as `v-bind="attrs"` to your custom components.

---

## Foorm Primitives

Special types that control rendering behavior:

| Primitive         | Underlying Type | Description                      |
| ----------------- | --------------- | -------------------------------- |
| `foorm.select`    | `string`        | Dropdown select field            |
| `foorm.radio`     | `string`        | Radio button group               |
| `foorm.checkbox`  | `boolean`       | Boolean checkbox toggle          |
| `foorm.action`    | `phantom`       | Action button (not a data field) |
| `foorm.paragraph` | `phantom`       | Read-only text content           |

**Phantom types** (`foorm.action`, `foorm.paragraph`) are excluded from:

- Generated TypeScript data type
- Form data object
- Validation
- JSON Schema / serialization

They only appear in the rendered field list for UI purposes.

```
// Action button
@foorm.altAction 'reset-password', 'Reset Password'
resetBtn: foorm.action

// Informational text
@foorm.value 'Please fill out all required fields.'
info: foorm.paragraph
```

---

## Arrays

Declare array fields with TypeScript array syntax. foorm handles add/remove UI, item rendering, and array-level validation automatically.

### Primitive Arrays

```
@meta.label 'Tags'
@foorm.array.add.label 'Add tag'
@foorm.array.remove.label 'x'
@expect.maxLength 5, 'Maximum 5 tags'
tags: string[]

@meta.label 'Scores'
@foorm.array.add.label 'Add score'
@expect.minLength 1, 'At least one score required'
scores: number[]
```

Primitive array items render as inline inputs with a remove button.

### Object Arrays

```
@meta.label 'Addresses'
@foorm.title 'Addresses'
@foorm.array.add.label 'Add address'
@foorm.array.remove.label 'Remove address'
addresses: {
    @meta.label 'Street'
    @foorm.type 'text'
    @meta.required 'Street is required'
    street: string

    @meta.label 'City'
    @foorm.type 'text'
    @meta.required 'City is required'
    city: string

    @meta.label 'ZIP'
    @foorm.type 'text'
    zip?: string
}[]
```

Object array items render as cards with sub-fields. Use `@foorm.title` to give the array section a title header.

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

The add button shows one option per variant. Items include a variant selector dropdown so users can switch types.

### Array Annotations

| Annotation                              | Description                                             |
| --------------------------------------- | ------------------------------------------------------- |
| `@foorm.array.add.label 'text'`         | Label for the add-item button (default: "Add item")     |
| `@foorm.array.add.component 'Name'`     | Named component for a custom add button                 |
| `@foorm.array.remove.label 'text'`      | Label for the remove-item button (default: "Remove")    |
| `@foorm.array.variant.component 'Name'` | Named component for the union variant selector per item |
| `@expect.minLength N, 'msg'`            | Minimum number of items (validated on submit)           |
| `@expect.maxLength N, 'msg'`            | Maximum number of items (add button disabled at max)    |

---

## Nested Groups (`@foorm.title` on objects)

Use `@foorm.title` on a nested object field to render it as a titled, visually distinct group section:

```
@foorm.title 'Settings'
@foorm.order 5
settings: {
    @meta.label 'Notify by email'
    @foorm.order 1
    emailNotify: foorm.checkbox

    @meta.label 'Max items per page'
    @foorm.type 'number'
    @foorm.order 2
    pageSize?: number
}
```

**Without `@foorm.title`**, nested object fields are flattened — their children render as top-level fields with dot-separated paths (e.g., `address.street`).

**With `@foorm.title`**, the object becomes a visually grouped section with a title header and an indented, bordered container.

Groups can nest to any depth:

```
@foorm.title 'Address'
address: {
    street: string
    city: string

    @foorm.title 'Country'
    country: {
        name: string
        code: string
    }
}
```

`@foorm.title` works at three levels:

- **Interface-level** (`@foorm.title 'Registration'`): form title, rendered as `<h2>`
- **Field-level on objects** (`@foorm.title 'Settings'`): group title, rendered as `<h3>`
- **Field-level on arrays** (`@foorm.title 'Addresses'`): array section title, rendered as `<h3>`

---

## Optional vs Required

```
// Required — validator checks for non-empty value
email: string.email

// Required non-blank string — rejects '' and whitespace-only
name: string.required

// Required with custom error message
@meta.required 'First name is required'
firstName: string

// Boolean that must be true (e.g. "agree to terms")
agreeToTerms: boolean.required

// Optional — validator skips if empty
nickname?: string
```

The `?:` syntax in ATScript makes a field optional. Non-optional fields produce a `'Required'` error when empty.

For strings, `'Required'` only checks for `undefined`/`null` — empty strings `''` and whitespace-only strings pass. Use `string.required` or `@meta.required` to reject blank strings. This is the recommended approach for form fields where "required" means "non-blank".

For booleans, `@meta.required` (or `boolean.required`) enforces `true` — useful for "agree to terms" checkboxes.

---

## Type Inference

ATScript infers the field type for rendering:

| Schema Type        | Resolved `@foorm.type` |
| ------------------ | ---------------------- |
| `string`           | `'text'`               |
| `string.required`  | `'text'`               |
| `number`           | `'number'`             |
| `boolean`          | `'checkbox'`           |
| `boolean.required` | `'checkbox'`           |
| `foorm.select`     | `'select'`             |
| `foorm.radio`      | `'radio'`              |
| `foorm.checkbox`   | `'checkbox'`           |
| `foorm.action`     | `'action'`             |
| `foorm.paragraph`  | `'paragraph'`          |

Override with `@foorm.type 'password'` or `@foorm.type 'textarea'` etc.

---

## Importing Between Schemas

```
// src/forms/address.as
export interface Address {
    @meta.label 'Street'
    street: string

    @meta.label 'City'
    city: string
}

// src/forms/user.as
import { Address } from './address'

export interface UserForm {
    @meta.label 'Name'
    name: string

    address: Address
}
```

Nested objects produce nested form fields with dot-separated paths (e.g., `address.street`).

---

## Ad-hoc Annotations (reuse + customize)

Reuse a type with different labels/metadata without modifying the original:

```
import { User } from './user'

// Creates a standalone UserForm with custom labels
export annotate User as UserForm {
    @meta.label 'Full Name'
    @foorm.order 1
    name

    @meta.label 'Email Address'
    @foorm.order 2
    email
}
```

The original `User` type is unchanged. `UserForm` gets its own class and metadata.
