# Writing Form Schemas — @foormjs/atscript

> How to write `.as` files that define forms: annotations, field types, validation, options, arrays, unions, nested groups, and computed properties.

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

## Form-Level Annotations

| Annotation                                  | Description                              |
| ------------------------------------------- | ---------------------------------------- |
| `@foorm.title 'text'`                       | Static form title                        |
| `@foorm.submit.text 'text'`                 | Submit button text (default: `'Submit'`) |
| `@foorm.submit.disabled`                    | Statically disable the submit button     |
| `@foorm.fn.title '(data) => ...'`           | Computed form title                      |
| `@foorm.fn.submit.text '(data) => ...'`     | Computed submit text                     |
| `@foorm.fn.submit.disabled '(data) => ...'` | Computed submit disabled state           |

## Field-Level Annotations

### Static metadata

| Annotation                       | Description                                               |
| -------------------------------- | --------------------------------------------------------- |
| `@meta.label 'text'`             | Field label                                               |
| `@meta.description 'text'`       | Field description                                         |
| `@meta.hint 'text'`              | Hint text (shown below field)                             |
| `@meta.placeholder 'text'`       | Placeholder text                                          |
| `@foorm.type 'text'`             | Input type (see Type Inference below)                     |
| `@foorm.component 'Name'`        | Named component override (resolved via `components` prop) |
| `@foorm.autocomplete 'email'`    | HTML autocomplete attribute                               |
| `@foorm.order 1`                 | Rendering order (lower = first)                           |
| `@foorm.value 'default'`         | Default/static value                                      |
| `@foorm.hidden`                  | Hide the field                                            |
| `@foorm.disabled`                | Disable the field                                         |
| `@foorm.readonly`                | Read-only mode                                            |
| `@foorm.altAction 'id', 'label'` | Alternate action button (id required, label optional)     |

### Computed properties (`@foorm.fn.*`)

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
- `context` — external context passed via `formContext` prop on OoForm
- `entry` — evaluated field snapshot (`TFoormFieldEvaluated`): `{ field, type, component, name, disabled, optional, hidden, readonly, options }`

**Important:** Functions are strings compiled at runtime with `new Function()`. No imports, no closures — only pure expressions.

## Validation

```
// Required non-blank string (rejects '' and whitespace-only)
@meta.required
name: string

// Required non-blank with custom error message
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

`@meta.required` validates that a string is non-blank (not empty, not whitespace-only). Default error: `"Must not be empty"`. For booleans, it enforces `true` (useful for "agree to terms").

Multiple `@foorm.validate` annotations stack — all must pass. They run alongside `@expect.*` and `@meta.required` validators.

## Options (select/radio)

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

## Custom Attributes

```
// Static attributes
@foorm.attr 'data-testid', 'email-field'
@foorm.attr 'aria-label', 'Email address'

// Computed attributes
@foorm.fn.attr 'data-valid', '(v) => v ? "true" : "false"'
```

## Foorm Primitives

| Primitive         | Underlying Type | Description                      |
| ----------------- | --------------- | -------------------------------- |
| `foorm.select`    | `string`        | Dropdown select field            |
| `foorm.radio`     | `string`        | Radio button group               |
| `foorm.checkbox`  | `boolean`       | Boolean checkbox toggle          |
| `foorm.action`    | phantom         | Action button (not a data field) |
| `foorm.paragraph` | phantom         | Read-only text content           |

**Phantom types** (`foorm.action`, `foorm.paragraph`) are excluded from TypeScript data types, form data, validation, and serialization.

```
// Action button
@foorm.altAction 'reset-password', 'Reset Password'
resetBtn: foorm.action

// Informational text
@foorm.value 'Please fill out all required fields.'
info: foorm.paragraph
```

## Arrays

### Primitive arrays

```
@meta.label 'Tags'
@foorm.array.add.label 'Add tag'
@foorm.array.remove.label 'x'
@expect.maxLength 5, 'Maximum 5 tags'
tags: string[]
```

### Object arrays — inline

```
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

### Object arrays — separate type (recommended)

Define the item type separately with its own annotations. Type-level annotations (`@meta.label`, `@foorm.title`, `@foorm.component`) flow to each array item automatically:

```
// The prop label 'Addresses' is for the array field itself
// The type label 'Address' becomes each item's title
@meta.label 'Addresses'
@foorm.array.add.label 'Add address'
@foorm.array.remove.label 'Remove address'
addresses: Address[]

// ── Defined separately ──
@meta.label 'Address'
@foorm.title 'Address'
interface Address {
    @meta.label 'Street'
    @meta.required 'Street is required'
    street: string

    @meta.label 'City'
    @meta.required 'City is required'
    city: string

    @meta.label 'ZIP'
    zip?: string
}
```

**Dual label pattern:** The prop's `@meta.label 'Addresses'` is the array section label. The type's `@meta.label 'Address'` becomes each item's title (rendered as "Address #1", "Address #2" via `formatIndexedLabel`). This is the idiomatic way to label array items.

Type-level `@foorm.title` and `@foorm.component` also flow to items — if the type has `@foorm.component 'CustomInput'`, every array item renders with that component.

### Union arrays

Arrays with multiple types — each union member becomes a selectable variant. `@meta.label` on each type becomes the variant name shown in the add button dropdown and variant picker:

```
@meta.label 'Contacts'
@foorm.array.add.label 'Add contact'
contacts: (Address | Contact | MyString)[]

@meta.label 'Address'
interface Address {
    @foorm.hidden
    type: 'address'
    street: string
    city: string
}

@meta.label 'Contact'
interface Contact {
    @foorm.hidden
    type: 'phone'
    email: string
    phone: string
}

// @meta.label on a type alias names the variant
@meta.label 'Just text'
type MyString = string
```

The add button shows one option per variant (labeled "Address", "Contact", "Just text"). Items include a variant picker so users can switch types. Without `@meta.label`, variants are auto-labeled with an index ("1. object", "2. string").

### Array annotations

| Annotation                         | Description                                     |
| ---------------------------------- | ----------------------------------------------- |
| `@foorm.array.add.label 'text'`    | Label for the add button (default: "Add item")  |
| `@foorm.array.remove.label 'text'` | Label for the remove button (default: "Remove") |
| `@foorm.array.sortable`            | Marks the array as sortable (drag-and-drop)     |
| `@expect.minLength N, 'msg'`       | Minimum items (validated on submit)             |
| `@expect.maxLength N, 'msg'`       | Maximum items (add button disabled at max)      |

## Type-Level vs Prop-Level Annotations

Annotations can be placed on both **types** (interfaces, type aliases) and **props** (fields). Understanding where each goes is key for arrays and reusable types:

| Annotation on...                     | Effect                                                       |
| ------------------------------------ | ------------------------------------------------------------ |
| **Prop** `@meta.label 'Addresses'`   | Labels the field/array section itself                        |
| **Type** `@meta.label 'Address'`     | Labels each array item; names union variants                 |
| **Prop** `@foorm.title 'Addresses'`  | Title for the array section header                           |
| **Type** `@foorm.title 'Address'`    | Title for each item (rendered as "Address #1", etc.)         |
| **Type** `@foorm.component 'Custom'` | Every instance of this type renders with the named component |

When a type is used as an array element (`addresses: Address[]`), all type-level annotations propagate to each item. This is the primary way to control per-item rendering without repeating annotations.

## Nested Groups (`@foorm.title`)

Use `@foorm.title` on a nested object to render it as a visually distinct group:

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

**Without `@foorm.title`**: children flatten into the parent field list with dot paths (e.g., `settings.emailNotify`).

**With `@foorm.title`**: the object becomes a grouped section with a title header and indented container.

### Deep nesting

Groups nest to any depth. Mix titled and untitled objects:

```
@foorm.title 'Company Profile'
export interface CompanyForm {
    @meta.label 'Company Name'
    companyName: string

    // Titled group — renders as "Headquarters" section
    @foorm.title 'Headquarters'
    address: {
        @meta.label 'Street'
        street: string

        @meta.label 'City'
        city: string

        // No @foorm.title — country fields flatten into the address group
        country: {
            @meta.label 'Country Name'
            name: string

            @meta.label 'Country Code'
            code: string
        }
    }

    // No @foorm.title — contact fields flatten into the form root
    contact: {
        @meta.label 'Contact Email'
        email?: string.email

        @meta.label 'Contact Phone'
        phone?: string
    }
}
```

In this example:

- `address.country.name` renders inside the "Headquarters" group (because `address` has a title but `country` doesn't — it flattens into its parent)
- `contact.email` renders at the form root level (because `contact` has no title — it flattens)

`@foorm.title` works at three levels:

- **Interface-level**: form title, rendered as `<h2>`
- **Field-level on objects**: group title, rendered as `<h3>`
- **Field-level on arrays**: array section title, rendered as `<h3>`

## Optional vs Required

```
// Required — validator checks for non-empty value
email: string.email

// Required non-blank — rejects '' and whitespace-only
name: string.required

// Required with custom error
@meta.required 'First name is required'
firstName: string

// Boolean that must be true (e.g. "agree to terms")
agreeToTerms: boolean.required

// Optional — validator skips if empty
nickname?: string
```

The `?:` syntax makes a field optional. Non-optional fields produce a `'Required'` error when empty.

For strings, `'Required'` only checks for `undefined`/`null` — empty strings pass. Use `string.required` or `@meta.required` to reject blank strings.

## Type Inference

ATScript auto-infers the field type for rendering:

| Schema Type       | Resolved `@foorm.type` |
| ----------------- | ---------------------- |
| `string`          | `'text'`               |
| `number`          | `'number'`             |
| `boolean`         | `'checkbox'`           |
| `foorm.select`    | `'select'`             |
| `foorm.radio`     | `'radio'`              |
| `foorm.checkbox`  | `'checkbox'`           |
| `foorm.action`    | `'action'`             |
| `foorm.paragraph` | `'paragraph'`          |

Override with `@foorm.type 'password'`, `@foorm.type 'textarea'`, `@foorm.type 'date'`, etc. Custom type keys work as long as the runtime `types` map has a matching entry.

## Importing Between Schemas

```
// src/forms/address.as
@meta.label 'Address'
@foorm.title 'Address'
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

    // Single nested object — renders as titled group
    @foorm.title 'Home Address'
    address: Address

    // Array — each item gets Address's @meta.label and @foorm.title
    @meta.label 'Other Addresses'
    @foorm.array.add.label 'Add address'
    otherAddresses: Address[]
}
```

Type-level annotations on `Address` (`@meta.label`, `@foorm.title`) flow to every place it's used. The prop can override with its own annotations (e.g., `@foorm.title 'Home Address'` overrides the type's `@foorm.title 'Address'` for the single field).

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
