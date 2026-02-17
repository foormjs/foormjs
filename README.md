# foormjs

ATScript-first validatable forms for Vue. Define your form — fields, labels, validators, computed properties — in a declarative `.as` schema, then render it with your own UI components.

## Why foormjs?

- **Declarative** — Forms are defined in `.as` files with ATScript annotations, not scattered across component code
- **Validation built-in** — Custom validators, ATScript `@expect.*` constraints, and foorm-style required checks all work together
- **Computed everything** — Labels, placeholders, disabled state, options, styles — any property can be static or a function of form data and context
- **BYOUI** — Bring your own UI components. `OoForm` is renderless — you control the look and feel
- **Backend-controlled** — Form definitions and validators can be serialized and sent from the server

## Quick Example

Define a form in ATScript:

```
// src/forms/registration.as
@foorm.title 'Registration'
@foorm.submit.text 'Register'
@foorm.fn.submit.disabled '(data) => !data.firstName || !data.email'
export interface RegistrationForm {
    @meta.label 'First Name'
    @meta.placeholder 'John'
    @foorm.validate '(v) => !!v || "Required"'
    @foorm.order 1
    firstName: string

    @meta.label 'Email'
    @foorm.fn.label '(v, data) => data.firstName ? data.firstName + "s Email" : "Email"'
    @foorm.autocomplete 'email'
    @foorm.order 2
    email: string.email

    @meta.label 'Country'
    @foorm.options 'United States', 'us'
    @foorm.options 'Canada', 'ca'
    @foorm.order 3
    country?: foorm.select

    @meta.label 'I agree to terms'
    @foorm.order 4
    agreeToTerms: foorm.checkbox
}
```

Render in Vue:

```vue
<script setup lang="ts">
import { OoForm, useFoorm } from '@foormjs/vue'
import { RegistrationForm } from './forms/registration.as'

const { def, formData } = useFoorm(RegistrationForm)
</script>

<template>
  <OoForm :def="def" :form-data="formData" @submit="console.log($event)" />
</template>
```

## Packages

| Package | Description | Docs |
|---|---|---|
| [`foorm`](packages/foorm) | Core form model — definitions, validation, metadata resolution | [README](packages/foorm/README.md) |
| [`@foormjs/vue`](packages/vue) | Renderless Vue components — `OoForm`, `OoField`, `useFoorm` | [README](packages/vue/README.md) |

## ATScript

foormjs uses [ATScript](https://atscript.moost.org) — a schema language with annotations, type inference, and validation. ATScript powers the `.as` files that define forms, and provides IDE support (autocomplete, diagnostics) for all `@foorm.*` and `@expect.*` annotations.

See the [ATScript documentation](https://atscript.moost.org) for the full language reference.

## License

MIT
