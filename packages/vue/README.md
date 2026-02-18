# @foormjs/vue

Renderless Vue components for ATScript-defined forms. Bring your own UI components and wrap them in `OoForm` / `OoField` to get automatic validation, computed properties, and reactive form state — all driven by `.as` schema files.

## Install

```bash
pnpm add @foormjs/vue @foormjs/atscript vue @atscript/core @atscript/typescript
# or
npm install @foormjs/vue @foormjs/atscript vue @atscript/core @atscript/typescript
```

You also need the ATScript Vite plugin for `.as` file support:

```bash
pnpm add -D unplugin-atscript @vitejs/plugin-vue
```

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

### 2. Configure Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import atscript from 'unplugin-atscript/vite'

export default defineConfig({
  plugins: [atscript(), vue()],
})
```

### 3. Define a form schema

```
// src/forms/login.as
@foorm.title 'Sign In'
@foorm.submit.text 'Log In'
export interface LoginForm {
    @meta.label 'Email'
    @meta.placeholder 'you@example.com'
    @foorm.autocomplete 'email'
    @meta.required 'Email is required'
    @foorm.order 1
    email: string.email

    @meta.label 'Password'
    @meta.placeholder 'Enter password'
    @foorm.type 'password'
    @meta.required 'Password is required'
    @foorm.order 2
    password: string
}
```

### 4. Use in a Vue component

```vue
<script setup lang="ts">
import { OoForm } from '@foormjs/vue'
import { useFoorm } from '@foormjs/vue'
import { LoginForm } from './forms/login.as'

const { def, formData } = useFoorm(LoginForm)

function handleSubmit(data: typeof formData) {
  console.log('submitted', data)
}
</script>

<template>
  <OoForm :def="def" :form-data="formData" first-validation="on-blur" @submit="handleSubmit" />
</template>
```

`OoForm` renders default HTML inputs for all standard field types out of the box. For production use, you'll want to supply your own components.

## Advanced Usage

### Custom Components by Type

Map field types to your UI components:

```vue
<script setup lang="ts">
import { OoForm } from '@foormjs/vue'
import MyTextInput from './MyTextInput.vue'
import MySelect from './MySelect.vue'
import MyCheckbox from './MyCheckbox.vue'

const typeComponents = {
  text: MyTextInput,
  select: MySelect,
  checkbox: MyCheckbox,
}
</script>

<template>
  <OoForm :def="def" :form-data="formData" :types="typeComponents" @submit="onSubmit" />
</template>
```

Every field with `type: 'text'` will render `MyTextInput`, every `type: 'select'` renders `MySelect`, etc.

### Custom Components by Name

Use `@foorm.component` in your schema to assign a named component to a specific field:

```
@meta.label 'Rating'
@foorm.component 'StarRating'
@foorm.order 5
rating?: number
```

Then pass named components via the `components` prop:

```vue
<template>
  <OoForm
    :def="def"
    :form-data="formData"
    :components="{ StarRating: MyStarRating }"
    @submit="onSubmit"
  />
</template>
```

Named components take priority over type-based components.

### Building a Custom Component

Custom components receive `TFoormComponentProps` as their props:

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'

const props = defineProps<TFoormComponentProps<string, any, any>>()
const emit = defineEmits<{ (e: 'action', name: string): void }>()
</script>

<template>
  <div :class="{ disabled, error: !!error }">
    <label>{{ label }}</label>
    <input
      :value="model.value"
      @input="model.value = ($event.target as HTMLInputElement).value"
      @blur="onBlur"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
    />
    <span v-if="error" class="error">{{ error }}</span>
    <span v-else-if="hint" class="hint">{{ hint }}</span>
  </div>
</template>
```

Key props available to your component:

| Prop           | Type                      | Description                                        |
| -------------- | ------------------------- | -------------------------------------------------- |
| `model`        | `{ value: V }`            | Reactive model — bind with `v-model="model.value"` |
| `onBlur`       | `(e: FocusEvent) => void` | Triggers validation on blur                        |
| `error`        | `string?`                 | Validation error message                           |
| `label`        | `string?`                 | Resolved field label                               |
| `description`  | `string?`                 | Resolved field description                         |
| `hint`         | `string?`                 | Resolved hint text                                 |
| `placeholder`  | `string?`                 | Resolved placeholder                               |
| `disabled`     | `boolean?`                | Whether the field is disabled                      |
| `hidden`       | `boolean?`                | Whether the field is hidden                        |
| `readonly`     | `boolean?`                | Whether the field is read-only                     |
| `optional`     | `boolean?`                | Whether the field is optional                      |
| `required`     | `boolean?`                | Whether the field is required                      |
| `type`         | `string`                  | The field input type                               |
| `altAction`    | `string?`                 | Alternate action name from `@foorm.altAction`      |
| `options`      | `TFoormEntryOptions[]?`   | Options for select/radio fields                    |
| `formData`     | `TFormData`               | The full reactive form data                        |
| `formContext`  | `TFormContext?`           | External context passed to the form                |
| `name`         | `string?`                 | Field name                                         |
| `maxLength`    | `number?`                 | Max length constraint                              |
| `autocomplete` | `string?`                 | HTML autocomplete value                            |
| `field`        | `FoormFieldDef?`          | Full field definition for advanced use             |
| `onRemove`     | `() => void?`             | Callback to remove this item from its parent array |
| `canRemove`    | `boolean?`                | Whether removal is allowed (respects minLength)    |
| `removeLabel`  | `string?`                 | Label for the remove button                        |

### Arrays

Array fields are handled automatically. Define them in your `.as` schema:

```
@meta.label 'Tags'
@foorm.array.add.label 'Add tag'
@foorm.array.remove.label 'x'
@expect.maxLength 5, 'Maximum 5 tags'
tags: string[]

@meta.label 'Addresses'
@foorm.title 'Addresses'
@foorm.array.add.label 'Add address'
addresses: {
    @meta.label 'Street'
    @meta.required 'Street is required'
    street: string

    @meta.label 'City'
    city: string
}[]
```

`OoForm` renders arrays with add/remove buttons, inline editing for primitives, and sub-form cards for objects. Array-level validation (`@expect.minLength`, `@expect.maxLength`) is displayed below the add button.

Union arrays (`(ObjectType | string)[]`) render a variant selector per item and offer one add button per variant.

#### Custom Add Button

Use `@foorm.array.add.component` to supply your own add-item button component via the `components` prop:

```
@foorm.array.add.component 'AddAddressBtn'
addresses: { ... }[]
```

```vue
<OoForm :def="def" :form-data="formData" :components="{ AddAddressBtn }" />
```

The remove button is not a standalone component — it is the responsibility of the group component (for object items) or the field component (for primitive items) via `onRemove`/`canRemove`/`removeLabel` props.

### Nested Groups

Use `@foorm.title` on a nested object field to render it as a titled, visually distinct section:

```
@foorm.title 'Settings'
settings: {
    @meta.label 'Notify by email'
    emailNotify: foorm.checkbox

    @meta.label 'Page size'
    @foorm.type 'number'
    pageSize?: number
}
```

Without `@foorm.title`, nested object fields flatten into the parent form. With it, they render as an indented group with a title header. Groups can be nested to any depth.

### Scoped Slots

`OoForm` provides scoped slots for full layout control:

```vue
<template>
  <OoForm :def="def" :form-data="formData" @submit="onSubmit">
    <!-- Override rendering for a specific field type -->
    <template #field:text="field">
      <MyTextInput v-bind="field" v-model="field.model.value" />
    </template>

    <!-- Form header (rendered before fields) -->
    <template #form.header="{ title }">
      <h1>{{ title }}</h1>
    </template>

    <!-- Content before/after fields -->
    <template #form.before>
      <p>All fields are required unless marked optional.</p>
    </template>

    <template #form.after="{ disabled }">
      <p v-if="disabled">Please fill out all required fields.</p>
    </template>

    <!-- Custom submit button -->
    <template #form.submit="{ text, disabled }">
      <button type="submit" :disabled="disabled" class="my-btn">{{ text }}</button>
    </template>

    <!-- Footer (rendered after submit) -->
    <template #form.footer>
      <p>By submitting, you agree to our terms.</p>
    </template>
  </OoForm>
</template>
```

### Form Context

Pass runtime data (user session, feature flags, dynamic options) to computed functions and validators:

```vue
<script setup lang="ts">
const formContext = {
  cityOptions: [
    { key: 'nyc', label: 'New York' },
    { key: 'la', label: 'Los Angeles' },
  ],
  user: { role: 'admin' },
}
</script>

<template>
  <OoForm :def="def" :form-data="formData" :form-context="formContext" @submit="onSubmit" />
</template>
```

Context is accessible in ATScript function strings as the third argument:

```
@foorm.fn.options '(v, data, ctx) => ctx.cityOptions || []'
city?: foorm.select
```

### Server-side Errors

Pass server-side validation errors directly to fields:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const serverErrors = ref<Record<string, string>>({})

async function handleSubmit(data: any) {
  const result = await api.submit(data)
  if (result.errors) {
    serverErrors.value = result.errors // e.g. { email: 'Already taken' }
  }
}
</script>

<template>
  <OoForm :def="def" :form-data="formData" :errors="serverErrors" @submit="handleSubmit" />
</template>
```

### Actions

Define alternate submit actions using the `foorm.action` primitive:

```
@meta.label 'Reset Password'
@foorm.altAction 'reset-password'
resetBtn: foorm.action
```

Handle the action event:

```vue
<template>
  <OoForm :def="def" :form-data="formData" @submit="onSubmit" @action="onAction" />
</template>

<script setup lang="ts">
function onAction(name: string, data: any) {
  if (name === 'reset-password') {
    // handle reset password
  }
}
</script>
```

## API Reference

### `useFoorm(type)`

Creates a reactive form definition and data object from an ATScript annotated type.

```ts
const { def, formData } = useFoorm(MyFormType)
```

- **`def`** — `FoormDef` with ordered fields, the source type, and a flatMap
- **`formData`** — Vue `reactive()` object with default values from the schema

### `OoForm`

Renderless form wrapper component.

**Props:**

| Prop              | Type                                                                     | Required | Description                                             |
| ----------------- | ------------------------------------------------------------------------ | -------- | ------------------------------------------------------- |
| `def`             | `FoormDef`                                                               | Yes      | Form definition from `useFoorm()` or `createFoormDef()` |
| `formData`        | `object`                                                                 | No       | Reactive form data (created internally if omitted)      |
| `formContext`     | `object`                                                                 | No       | External context for computed functions and validators  |
| `firstValidation` | `'on-change' \| 'touched-on-blur' \| 'on-blur' \| 'on-submit' \| 'none'` | No       | When to trigger first validation                        |
| `components`      | `Record<string, Component>`                                              | No       | Named components (matched by `@foorm.component`)        |
| `types`           | `Record<string, Component>`                                              | No       | Type-based components (matched by field type)           |
| `groupComponent`  | `Component`                                                              | No       | Custom wrapper component for all groups and array items |
| `errors`          | `Record<string, string>`                                                 | No       | External error messages (e.g. server-side)              |

**Events:**

| Event                | Payload                               | Description                                                     |
| -------------------- | ------------------------------------- | --------------------------------------------------------------- |
| `submit`             | `formData`                            | Emitted on valid form submission                                |
| `error`              | `{ path: string; message: string }[]` | Emitted when validation fails on submit                         |
| `action`             | `name, formData`                      | Emitted when an action button is clicked (supported alt action) |
| `unsupported-action` | `name, formData`                      | Emitted for unrecognized action names                           |

**Slots:**

| Slot           | Scope                                                            | Description                                  |
| -------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| `field:{type}` | Field bindings                                                   | Override rendering for a specific field type |
| `form.header`  | `{ clearErrors, reset, setErrors, formContext, disabled }`       | Before fields                                |
| `form.before`  | `{ clearErrors, reset, setErrors }`                              | After header, before fields                  |
| `form.after`   | `{ clearErrors, reset, setErrors, disabled, formContext }`       | After fields, before submit                  |
| `form.submit`  | `{ text, disabled, clearErrors, reset, setErrors, formContext }` | Submit button                                |
| `form.footer`  | `{ disabled, clearErrors, reset, setErrors, formContext }`       | After submit                                 |

### `OoGroup`

Recursive field renderer. Used internally by `OoForm` to iterate fields, render nested groups, and delegate to `OoArray` for array fields. Can also be used standalone for custom layouts.

**Props:**

| Prop             | Type                        | Description                                                    |
| ---------------- | --------------------------- | -------------------------------------------------------------- |
| `def`            | `FoormDef?`                 | Field definitions to iterate                                   |
| `field`          | `FoormFieldDef?`            | Source field (for title/component/validation). Absent at root  |
| `pathPrefix`     | `string?`                   | Explicit path prefix from OoArray (per-item index)             |
| `components`     | `Record<string, Component>` | Named components map                                           |
| `types`          | `Record<string, Component>` | Type-to-component map                                          |
| `groupComponent` | `Component?`                | Custom wrapper component for groups and array items            |
| `errors`         | `Record<string, string>?`   | External error overrides (path to message)                     |
| `disabled`       | `boolean?`                  | Whether this group is disabled                                 |
| `hidden`         | `boolean?`                  | Whether this group is hidden                                   |
| `onRemove`       | `() => void?`               | Callback to remove this item from its parent array             |
| `canRemove`      | `boolean?`                  | Whether removal is allowed (respects minLength)                |
| `removeLabel`    | `string?`                   | Label for the remove button (from `@foorm.array.remove.label`) |

### `OoArray`

Array field renderer. Handles add/remove buttons, variant selection for unions, and delegates item rendering to `OoGroup` for both objects and primitives.

**Props:**

| Prop             | Type                        | Description                                 |
| ---------------- | --------------------------- | ------------------------------------------- |
| `field`          | `FoormArrayFieldDef`        | Array field definition (required)           |
| `components`     | `Record<string, Component>` | Named components map                        |
| `types`          | `Record<string, Component>` | Type-to-component map                       |
| `groupComponent` | `Component?`                | Custom wrapper component for array items    |
| `errors`         | `Record<string, string>?`   | External error overrides                    |
| `error`          | `string?`                   | Array-level validation error (from OoGroup) |
| `disabled`       | `boolean?`                  | Whether the array is disabled               |

### `OoField`

Renderless field wrapper (used internally by `OoForm`, can also be used standalone).

**Props:**

| Prop          | Type            | Description                                                    |
| ------------- | --------------- | -------------------------------------------------------------- |
| `field`       | `FoormFieldDef` | Field definition from `def.fields`                             |
| `error`       | `string?`       | External error message                                         |
| `onRemove`    | `() => void?`   | Callback to remove this item from its parent array             |
| `canRemove`   | `boolean?`      | Whether removal is allowed (respects minLength)                |
| `removeLabel` | `string?`       | Label for the remove button (from `@foorm.array.remove.label`) |

**Default Slot Bindings:** All `TFoormComponentProps` fields plus `classes`, `styles`, `value` (phantom), `vName`, `attrs`.

### `TFoormComponentProps`

TypeScript interface for custom field components. See the "Building a Custom Component" section above.

For ATScript documentation, see [atscript.moost.org](https://atscript.moost.org).

## License

MIT
