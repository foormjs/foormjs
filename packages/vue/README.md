# @foormjs/vue

Vue 3 components for rendering foorm models with built-in validation.

Most form libraries force you into their component system. `@foormjs/vue` works the other way: it gives you a form component with sensible defaults for every field type, but lets you replace any part of the rendering with your own components. Use the built-in inputs to get started, then gradually swap in your design system components -- per field, per type, or via scoped slots.

Forms are defined in ATScript `.as` files (via `@foormjs/atscript`), converted to a model at runtime, and rendered by `OoForm`. Validation, computed properties, and reactive state are handled automatically.

## Install

```bash
npm install @foormjs/vue
# or
pnpm add @foormjs/vue
```

You'll also need the ATScript tooling in your dev dependencies:

```bash
pnpm add -D @foormjs/atscript @atscript/core @atscript/typescript unplugin-atscript
```

## Quick Start

### 1. Define a form in ATScript

```
// src/forms/login.as
@foorm.title 'Sign In'
@foorm.submit.text 'Log In'
export interface LoginForm {
    @meta.label 'Email'
    @meta.placeholder 'you@example.com'
    @foorm.autocomplete 'email'
    @foorm.validate '(v) => !!v || "Email is required"'
    email: string

    @meta.label 'Password'
    @foorm.type 'password'
    @foorm.validate '(v) => !!v || "Password is required"'
    password: string

    @meta.label 'Remember me'
    rememberMe?: foorm.checkbox
}
```

### 2. Render it

```vue
<script setup lang="ts">
import { OoForm, useFoorm } from '@foormjs/vue'
import { LoginForm } from './forms/login.as'

const { form, formData } = useFoorm(LoginForm)

function handleSubmit(data: typeof formData) {
  console.log('Submitted:', data)
}
</script>

<template>
  <OoForm :form="form" :form-data="formData" first-validation="on-blur" @submit="handleSubmit" />
</template>
```

That's it. The form renders with labels, placeholders, validation, and a submit button -- all derived from the `.as` file annotations.

## Practical Examples

### Passing context for dynamic options

Backend-provided data (option lists, user info, locale) goes through the `formContext` prop and becomes available to `@foorm.fn.*` annotations:

```
// preferences.as
export interface PreferencesForm {
    @meta.label 'City'
    @meta.placeholder 'Select a city'
    @foorm.fn.options '(v, data, context) => context.cityOptions || []'
    city?: foorm.select
}
```

```vue
<script setup lang="ts">
import { OoForm, useFoorm } from '@foormjs/vue'
import { PreferencesForm } from './forms/preferences.as'

const { form, formData } = useFoorm(PreferencesForm)

const formContext = {
  cityOptions: [
    { key: 'nyc', label: 'New York' },
    { key: 'la', label: 'Los Angeles' },
    { key: 'chi', label: 'Chicago' },
  ],
}
</script>

<template>
  <OoForm :form="form" :form-data="formData" :form-context="formContext" @submit="handleSubmit" />
</template>
```

### Custom components by name

Use `@foorm.component` in your `.as` file and pass the component map:

```
// profile.as
export interface ProfileForm {
    @meta.label 'Birthday'
    @foorm.component 'DatePicker'
    birthday?: string
}
```

```vue
<template>
  <OoForm
    :form="form"
    :form-data="formData"
    :components="{ DatePicker: MyDatePicker }"
    @submit="handleSubmit"
  />
</template>
```

### Custom components by type

Replace the default renderer for all fields of a given type:

```vue
<template>
  <OoForm
    :form="form"
    :form-data="formData"
    :types="{ text: MyTextInput, select: MySelect }"
    @submit="handleSubmit"
  />
</template>
```

### Scoped slots

Override rendering for specific field types or form sections:

```vue
<template>
  <OoForm :form="form" :form-data="formData" @submit="handleSubmit">
    <!-- Custom header -->
    <template #form.header="{ title }">
      <h1 class="my-title">{{ title }}</h1>
    </template>

    <!-- Custom text field renderer -->
    <template #field:text="field">
      <div class="my-field">
        <label>{{ field.label }}</label>
        <input
          v-model="field.model.value"
          @blur="field.onBlur"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
        />
        <span v-if="field.error" class="error">{{ field.error }}</span>
      </div>
    </template>

    <!-- Custom submit button -->
    <template #form.submit="{ disabled, text }">
      <button class="my-button" :disabled="disabled">{{ text }}</button>
    </template>
  </OoForm>
</template>
```

### Handling actions

Action fields emit events instead of submitting the form:

```
// wizard.as
export interface WizardStep {
    @meta.label 'Name'
    name: string

    @meta.label 'Reset Form'
    @foorm.altAction 'reset'
    resetBtn: foorm.action
}
```

```vue
<template>
  <OoForm :form="form" :form-data="formData" @submit="handleSubmit" @action="handleAction" />
</template>

<script setup lang="ts">
function handleAction(name: string, data: unknown) {
  if (name === 'reset') {
    // Reset the form
  }
}
</script>
```

### Server-side validation errors

Pass external errors (e.g., from an API response) via the `errors` prop:

```vue
<template>
  <OoForm :form="form" :form-data="formData" :errors="serverErrors" @submit="handleSubmit" />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const serverErrors = ref<Record<string, string>>({})

async function handleSubmit(data: unknown) {
  const response = await api.submit(data)
  if (response.errors) {
    serverErrors.value = response.errors
    // e.g. { email: 'Email already exists' }
  }
}
</script>
```

## API

### `useFoorm(Type)`

Composable that creates a form model and reactive data from an ATScript type.

```ts
import { useFoorm } from '@foormjs/vue'
import { MyForm } from './my-form.as'

const { form, formData } = useFoorm(MyForm)
```

Returns:

- `form` -- `TFoormModel` object with fields, title, and submit config
- `formData` -- Vue `reactive()` object initialized from field defaults

### `OoForm` Props

| Prop              | Type                        | Description                                  |
| ----------------- | --------------------------- | -------------------------------------------- |
| `form`            | `TFoormModel`               | Form model (required)                        |
| `formData`        | `object`                    | Reactive form data (auto-created if omitted) |
| `formContext`     | `object`                    | External context for computed functions      |
| `firstValidation` | `'on-blur' \| 'on-submit'`  | When to trigger first validation             |
| `components`      | `Record<string, Component>` | Named component map for `@foorm.component`   |
| `types`           | `Record<string, Component>` | Type-based component map                     |
| `errors`          | `Record<string, string>`    | External validation errors                   |

### `OoForm` Events

| Event                | Payload          | Description                                                    |
| -------------------- | ---------------- | -------------------------------------------------------------- |
| `submit`             | `formData`       | Emitted when the form passes validation and is submitted       |
| `action`             | `name, formData` | Emitted when an action button is clicked                       |
| `unsupported-action` | `name, formData` | Emitted when an action is clicked but not defined in the model |

### `OoForm` Slots

| Slot           | Props                                              | Description                                    |
| -------------- | -------------------------------------------------- | ---------------------------------------------- |
| `form.header`  | `title, clearErrors, reset, formContext, disabled` | Before all fields (default: `<h2>` with title) |
| `form.before`  | `clearErrors, reset`                               | After header, before fields                    |
| `field:{type}` | All field props (see below)                        | Override renderer for a field type             |
| `form.after`   | `clearErrors, reset, disabled, formContext`        | After fields, before submit                    |
| `form.submit`  | `disabled, text, clearErrors, reset, formContext`  | Submit button                                  |
| `form.footer`  | `disabled, clearErrors, reset, formContext`        | After submit button                            |

### Field Slot Props

Every field slot (`#field:text`, `#field:select`, etc.) receives:

| Prop           | Type                      | Description                                                 |
| -------------- | ------------------------- | ----------------------------------------------------------- |
| `model`        | `{ value: V }`            | Two-way binding (use `v-model="field.model.value"`)         |
| `onBlur`       | `Function`                | Call on blur to trigger validation                          |
| `error`        | `string \| undefined`     | Current validation error                                    |
| `label`        | `string`                  | Evaluated label                                             |
| `description`  | `string`                  | Evaluated description                                       |
| `hint`         | `string`                  | Evaluated hint                                              |
| `placeholder`  | `string`                  | Evaluated placeholder                                       |
| `options`      | `TFoormEntryOptions[]`    | Options for select/radio                                    |
| `classes`      | `Record<string, boolean>` | CSS class object (includes `error`, `disabled`, `required`) |
| `styles`       | `string \| Record`        | Inline styles                                               |
| `disabled`     | `boolean`                 | Evaluated disabled state                                    |
| `hidden`       | `boolean`                 | Evaluated hidden state                                      |
| `optional`     | `boolean`                 | Evaluated optional state                                    |
| `required`     | `boolean`                 | Inverse of optional                                         |
| `type`         | `string`                  | Field type                                                  |
| `vName`        | `string`                  | HTML `name` attribute                                       |
| `field`        | `string`                  | Field identifier                                            |
| `altAction`    | `string`                  | Action name (for action fields)                             |
| `autocomplete` | `string`                  | HTML autocomplete value                                     |
| `maxLength`    | `number`                  | Max length constraint                                       |
| `formData`     | `object`                  | Full form data                                              |
| `formContext`  | `object`                  | Form context                                                |
| `attrs`        | `Record`                  | Additional evaluated attributes                             |

### `OoField`

Renderless field wrapper (used internally by `OoForm`, but available for advanced usage). Wraps `VuilessField` from `vuiless-forms`, evaluating all computed properties and exposing resolved values through its default slot.

### `TFoormComponentProps`

TypeScript interface for custom field components. Implement this when building reusable field components:

```ts
import type { TFoormComponentProps } from '@foormjs/vue'

// Your component receives these props:
defineProps<TFoormComponentProps<string, MyFormData, MyContext>>()
```

## Built-in Field Renderers

`OoForm` includes default renderers for all standard field types:

| Type                         | Renders as                | Notes                                     |
| ---------------------------- | ------------------------- | ----------------------------------------- |
| `text`, `password`, `number` | `<input>`                 | With label, description, error/hint       |
| `select`                     | `<select>`                | With placeholder as disabled first option |
| `radio`                      | Radio group               | Vertical layout with labels               |
| `checkbox`                   | `<input type="checkbox">` | Label beside the checkbox                 |
| `paragraph`                  | `<p>`                     | Description text, no input                |
| `action`                     | `<button>`                | Emits action event on click               |

Includes minimal CSS that you can override or replace entirely.

## Rendering Priority

For each field, `OoForm` tries renderers in this order:

1. **Named component** -- `@foorm.component` + `components` prop
2. **Type component** -- field type + `types` prop
3. **Scoped slot** -- `#field:{type}` slot
4. **Built-in default** -- standard HTML renderer
5. **Error message** -- "Not supported field type" fallback

## Vite Configuration

Add ATScript support to your Vite config:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import atscript from 'unplugin-atscript'

export default defineConfig({
  plugins: [atscript.vite(), vue()],
})
```

And configure ATScript:

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

## License

MIT
