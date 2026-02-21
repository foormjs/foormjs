# OoForm Setup & API — @foormjs/vue

> OoForm props, events, slots, `types` vs `components` props, `useFoorm`, `createDefaultTypes`, and validation timing.

## Concepts

OoForm is the root component. It provides context to all descendant fields via provide/inject and renders `<OoField :field="def.rootField" />`. You must supply two things:

1. **`def`** — a `FoormDef` from `useFoorm()` or `createFoormDef()`
2. **`types`** — a map of field type strings to Vue components

OoForm renders a `<form>` element. On submit, it validates all fields and emits either `submit` (success) or `error` (validation failures).

## `types` vs `components` — Two Ways to Provide Custom Components

Every field has a **type** (always defined — either from `@foorm.type`, or auto-inferred from the schema: `string` → `'text'`, `number` → `'number'`, `boolean` → `'checkbox'`, etc.). The `types` prop maps these type strings to Vue components.

When multiple fields share the same data type but need different UI representations, use `@foorm.component 'Name'` to override the type-based mapping for specific fields. The `components` prop maps these names to Vue components. Named components take priority over type-based resolution.

```
Resolution order:  @foorm.component → components[name] → types[field.type]
```

### `types` prop (required) — Type Components

Maps field type strings to Vue components. The built-in type keys (`text`, `password`, `number`) correspond to HTML `<input type="...">` values, but type keys are not limited to valid HTML input types — you can use any string that makes sense for your use case (e.g., `textarea`, `date`, `rating`, `color`). As long as the key is defined in the `types` map and referenced via `@foorm.type` in the schema, it will resolve to the mapped component.

Must include all base types:

```ts
import type { TFoormTypeComponents } from '@foormjs/vue'

const types: TFoormTypeComponents = {
  text: MyInput, // string fields (default), @foorm.type 'text'
  password: MyInput, // @foorm.type 'password'
  number: MyInput, // number fields, @foorm.type 'number'
  select: MySelect, // foorm.select primitive
  radio: MyRadio, // foorm.radio primitive
  checkbox: MyCheckbox, // boolean / foorm.checkbox
  paragraph: MyParagraph, // foorm.paragraph phantom
  action: MyAction, // foorm.action phantom
  object: MyObject, // nested objects / @foorm.title groups
  array: MyArray, // type[] arrays
  union: MyUnion, // union types (A | B)
  tuple: MyTuple, // tuple types [A, B]
  // Custom type keys — any string works:
  textarea: MyTextarea, // @foorm.type 'textarea'
  date: MyDatePicker, // @foorm.type 'date'
  rating: MyRating, // @foorm.type 'rating'
}
```

Use `createDefaultTypes()` for a pre-filled map, then override entries:

```ts
import { createDefaultTypes } from '@foormjs/vue'

const types = { ...createDefaultTypes(), text: MyInput, select: MySelect }
```

### `components` prop (optional) — Named Components

Maps `@foorm.component` names to Vue components. Per-field override.

```
// schema.as
@foorm.component 'StarRating'
rating?: number
```

```vue
<OoForm :types="types" :components="{ StarRating: MyStarRating }" ... />
```

The field still has a type (`'number'`), but `@foorm.component 'StarRating'` overrides it — OoField renders `MyStarRating` instead of `types['number']`.

### IDE autocomplete for custom types and components

When using the ATScript VSCode extension, pass your custom type keys and component names to `foormPlugin()` in `atscript.config.ts` to get autocomplete and validation for `@foorm.type` and `@foorm.component` annotations:

```ts
// atscript.config.ts
import { foormPlugin } from '@foormjs/atscript/plugin'

export default defineConfig({
  plugins: [
    ts(),
    foormPlugin({
      extraTypes: ['textarea', 'date', 'rating'], // extends @foorm.type suggest list
      components: ['StarRating', 'ColorPicker'], // extends @foorm.component suggest list
    }),
  ],
})
```

Without this, `@foorm.type` only suggests built-in values and `@foorm.component` accepts any string without validation.

## Installation & Setup

```bash
pnpm add @foormjs/vue @foormjs/atscript @atscript/core @atscript/typescript
pnpm add -D unplugin-atscript @vitejs/plugin-vue
```

```ts
// vite.config.ts — atscript() MUST come before vue()
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import atscript from 'unplugin-atscript/vite'

export default defineConfig({ plugins: [atscript(), vue()] })
```

## `useFoorm(type): { def, formData }`

Creates a form definition and reactive form data from an ATScript type.

```ts
import { useFoorm } from '@foormjs/vue'
import { MyForm } from './forms/my-form.as'

const { def, formData } = useFoorm(MyForm)
```

- `def` — `FoormDef` with root field, ordered fields, flat map
- `formData` — Vue `reactive()` object with default values from schema (wrapped in `{ value: ... }`)

## OoForm Props

| Prop              | Type                                                                     | Required | Default       | Description                                       |
| ----------------- | ------------------------------------------------------------------------ | -------- | ------------- | ------------------------------------------------- |
| `def`             | `FoormDef`                                                               | Yes      | —             | Form definition from `useFoorm()`                 |
| `formData`        | `object`                                                                 | No       | `{}`          | Reactive form data                                |
| `formContext`     | `object`                                                                 | No       | —             | External context for `@foorm.fn.*` and validators |
| `firstValidation` | `'on-change' \| 'touched-on-blur' \| 'on-blur' \| 'on-submit' \| 'none'` | No       | `'on-change'` | When to show errors first                         |
| `types`           | `TFoormTypeComponents`                                                   | Yes      | —             | Type-to-component map (see above)                 |
| `components`      | `Record<string, Component>`                                              | No       | —             | Named components for `@foorm.component`           |
| `errors`          | `Record<string, string>`                                                 | No       | —             | External errors keyed by field path               |

## OoForm Events

| Event                | Payload                                                          | Description                                           |
| -------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| `submit`             | `formData`                                                       | All fields passed validation                          |
| `error`              | `{ path: string; message: string }[]`                            | Validation failed on submit                           |
| `action`             | `name: string, formData`                                         | `@foorm.altAction` button clicked (field supports it) |
| `unsupported-action` | `name: string, formData`                                         | Action button clicked but no field has that action    |
| `change`             | `type: TFoormChangeType, path: string, value: unknown, formData` | Field/array/union changed                             |

**Change types:** `'update'` (field blur with changed value), `'array-add'`, `'array-remove'`, `'union-switch'`

## OoForm Slots

All slots receive `clearErrors()`, `reset()`, `setErrors()` for programmatic control.

```vue
<OoForm :def="def" :form-data="formData" :types="types" @submit="onSubmit">
  <template #form.header="{ clearErrors, reset, setErrors, formContext, disabled }">
    <!-- Before the form title -->
  </template>
  <template #form.before="{ clearErrors, reset, setErrors }">
    <!-- After title, before fields -->
  </template>
  <template #form.after="{ disabled, formContext, clearErrors, reset, setErrors }">
    <!-- After fields, before submit -->
  </template>
  <template #form.submit="{ text, disabled, clearErrors, reset, setErrors, formContext }">
    <button type="submit" :disabled="disabled">{{ text }}</button>
  </template>
  <template #form.footer="{ disabled, clearErrors, reset, setErrors, formContext }">
    <!-- After submit button -->
  </template>
</OoForm>
```

## Validation Timing (`firstValidation`)

Controls when errors first appear:

| Value               | Behavior                                        |
| ------------------- | ----------------------------------------------- |
| `'on-change'`       | Show errors immediately as user types (default) |
| `'touched-on-blur'` | Show after field blurred AND modified           |
| `'on-blur'`         | Show when field loses focus                     |
| `'on-submit'`       | No errors until form submit                     |
| `'none'`            | Never auto-validate                             |

After first submit, all fields show errors on change regardless of this setting.

## Common Patterns

### Basic form

```vue
<script setup lang="ts">
import { OoForm, createDefaultTypes, useFoorm } from '@foormjs/vue'
import { MyForm } from './forms/my-form.as'

const { def, formData } = useFoorm(MyForm)
const types = createDefaultTypes()
</script>

<template>
  <OoForm :def="def" :form-data="formData" :types="types" @submit="handleSubmit" />
</template>
```

### With context, server errors, and custom components

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { OoForm, createDefaultTypes, useFoorm } from '@foormjs/vue'
import { MyForm } from './forms/my-form.as'
import StarRating from './components/StarRating.vue'

const { def, formData } = useFoorm(MyForm)
const types = { ...createDefaultTypes(), textarea: MyTextarea }
const serverErrors = ref<Record<string, string>>({})
const context = reactive({ cityOptions: [] })
</script>

<template>
  <OoForm
    :def="def"
    :form-data="formData"
    :form-context="context"
    :types="types"
    :components="{ StarRating }"
    :errors="serverErrors"
    first-validation="on-blur"
    @submit="handleSubmit"
    @change="handleChange"
  />
</template>
```

### Backend-driven form (deserialized)

ATScript annotated types can be serialized to JSON on the backend and deserialized on the frontend — the form is fully backend-controlled without shipping `.as` files to the client. Use `createFoormDef` + `createFormData` directly (not `useFoorm`) since the type arrives asynchronously. See the `@foormjs/atscript` skill for serialization API details (`serializeAnnotatedType`, `fromJsonSchema`, `defineAnnotatedType`).

```vue
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { deserializeAnnotatedType } from '@atscript/typescript/utils'
import { createFoormDef, createFormData } from '@foormjs/atscript'
import { OoForm, createDefaultTypes } from '@foormjs/vue'
import type { FoormDef } from '@foormjs/atscript'

const def = ref<FoormDef>()
const formData = ref<{ value: Record<string, unknown> }>()
const types = createDefaultTypes()

onMounted(async () => {
  const res = await fetch('/api/form')
  const type = deserializeAnnotatedType(await res.json())
  def.value = createFoormDef(type)
  formData.value = reactive(createFormData(type, def.value.fields))
})
</script>

<template>
  <OoForm
    v-if="def && formData"
    :def="def"
    :form-data="formData"
    :types="types"
    @submit="onSubmit"
  />
</template>
```

## Gotchas

- `types` prop is required — every field type your form uses must have a matching component entry
- `atscript()` must come before `vue()` in Vite plugins
- `formData` is wrapped in `{ value: ... }` — `useFoorm` handles this, manual setup must account for it
- `change` event fires on blur for `'update'` type, not on every keystroke
- `@foormjs/vue/styles` provides default component styles — import if using defaults
