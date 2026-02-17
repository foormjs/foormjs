# Vue Components

foormjs provides renderless Vue components that resolve all form metadata and pass it to your UI components.

## useFoorm Composable

```ts
import { useFoorm } from '@foormjs/vue'
import { MyForm } from './forms/my-form.as'

const { def, formData } = useFoorm(MyForm)
```

- **`def`** — `FoormDef` with ordered fields, the source type, and a flatMap
- **`formData`** — Vue `reactive()` object with default values from the schema

---

## OoForm

Renderless form wrapper. Iterates fields, resolves metadata, renders components.

```vue
<OoForm
  :def="def"
  :form-data="formData"
  :form-context="context"
  :types="typeComponents"
  :components="namedComponents"
  :errors="serverErrors"
  first-validation="on-blur"
  @submit="onSubmit"
  @action="onAction"
/>
```

### Props

| Prop              | Type                                      | Required | Default | Description                                             |
| ----------------- | ----------------------------------------- | -------- | ------- | ------------------------------------------------------- |
| `def`             | `FoormDef`                                | Yes      | —       | Form definition from `useFoorm()`                       |
| `formData`        | `object`                                  | No       | `{}`    | Reactive form data                                      |
| `formContext`     | `object`                                  | No       | —       | External context for computed fns and validators        |
| `firstValidation` | `'on-blur' \| 'on-change' \| 'on-submit'` | No       | —       | When to trigger first validation                        |
| `types`           | `Record<string, Component>`               | No       | —       | Components mapped by field type                         |
| `components`      | `Record<string, Component>`               | No       | —       | Components mapped by `@foorm.component` name            |
| `errors`          | `Record<string, string>`                  | No       | —       | External errors (e.g., server-side) keyed by field path |

### Events

| Event                | Payload          | Description                                         |
| -------------------- | ---------------- | --------------------------------------------------- |
| `submit`             | `formData`       | Valid form submission                               |
| `action`             | `name, formData` | Action button clicked (matching `@foorm.altAction`) |
| `unsupported-action` | `name, formData` | Action button clicked but no field supports it      |

### Component Resolution Order

For each field, `OoForm` resolves the component in this order:

1. **`@foorm.component`** — named component from the `components` prop
2. **`types` prop** — component matched by field type
3. **Built-in defaults** — basic HTML inputs for `text`, `password`, `number`, `select`, `radio`, `checkbox`, `paragraph`, `action`

### Slots

```vue
<OoForm :def="def" :form-data="formData" @submit="onSubmit">
  <!-- Override rendering for a field type -->
  <template #field:text="field">
    <MyTextInput v-bind="field" v-model="field.model.value" />
  </template>

  <!-- Form structure slots -->
  <template #form.header="{ title, disabled }">
    <h1>{{ title }}</h1>
  </template>

  <template #form.before="{ clearErrors, reset }">
    <p>All fields required unless marked optional.</p>
  </template>

  <template #form.after="{ disabled, formContext }">
    <p v-if="disabled">Please complete all fields.</p>
  </template>

  <template #form.submit="{ text, disabled, clearErrors, reset }">
    <button type="submit" :disabled="disabled">{{ text }}</button>
  </template>

  <template #form.footer="{ clearErrors, reset, formContext }">
    <p>Terms apply.</p>
  </template>
</OoForm>
```

| Slot           | Scope                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `field:{type}` | All `TFoormComponentProps` + `classes`, `styles`, `value`, `vName`, `attrs`, `onBlur`, `model` |
| `form.header`  | `{ title, clearErrors, reset, formContext, disabled }`                                         |
| `form.before`  | `{ clearErrors, reset }`                                                                       |
| `form.after`   | `{ clearErrors, reset, disabled, formContext }`                                                |
| `form.submit`  | `{ text, disabled, clearErrors, reset, formContext }`                                          |
| `form.footer`  | `{ disabled, clearErrors, reset, formContext }`                                                |

---

## Custom Field Components

### The TFoormComponentProps Interface

Every custom component receives these props from `OoField`:

```ts
import type { TFoormComponentProps } from '@foormjs/vue'

const props = defineProps<TFoormComponentProps<string, any, any>>()
```

| Prop           | Type                      | Description                                        |
| -------------- | ------------------------- | -------------------------------------------------- |
| `model`        | `{ value: V }`            | Reactive model — bind with `v-model="model.value"` |
| `onBlur`       | `(e: FocusEvent) => void` | Triggers validation on blur                        |
| `error`        | `string?`                 | Validation error message                           |
| `label`        | `string?`                 | Resolved label                                     |
| `description`  | `string?`                 | Resolved description                               |
| `hint`         | `string?`                 | Hint text                                          |
| `placeholder`  | `string?`                 | Placeholder                                        |
| `disabled`     | `boolean?`                | Disabled state                                     |
| `hidden`       | `boolean?`                | Hidden state                                       |
| `readonly`     | `boolean?`                | Read-only state                                    |
| `optional`     | `boolean?`                | Whether optional                                   |
| `required`     | `boolean?`                | Whether required                                   |
| `type`         | `string`                  | Field input type                                   |
| `options`      | `TFoormEntryOptions[]?`   | Select/radio options                               |
| `maxLength`    | `number?`                 | Max length constraint                              |
| `autocomplete` | `string?`                 | HTML autocomplete value                            |
| `altAction`    | `string?`                 | Alternate action name                              |
| `name`         | `string?`                 | Field name                                         |
| `field`        | `FoormFieldDef?`          | Full field definition                              |
| `formData`     | `TFormData`               | Full form data                                     |
| `formContext`  | `TFormContext?`           | External context                                   |

### Example: Text Input Component

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'

const props = defineProps<TFoormComponentProps<string, any, any>>()
</script>

<template>
  <div class="field" :class="{ error: !!error, disabled }">
    <label v-if="label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <p v-if="description" class="description">{{ description }}</p>
    <input
      :value="model.value"
      @input="model.value = ($event.target as HTMLInputElement).value"
      @blur="onBlur"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxLength"
      :autocomplete="autocomplete"
    />
    <span v-if="error" class="error-msg">{{ error }}</span>
    <span v-else-if="hint" class="hint">{{ hint }}</span>
  </div>
</template>
```

### Example: Select Component

```vue
<script setup lang="ts">
import type { TFoormComponentProps, TFoormEntryOptions } from '@foormjs/vue'

const props = defineProps<TFoormComponentProps<string, any, any>>()

function optKey(opt: TFoormEntryOptions) {
  return typeof opt === 'string' ? opt : opt.key
}
function optLabel(opt: TFoormEntryOptions) {
  return typeof opt === 'string' ? opt : opt.label
}
</script>

<template>
  <div class="field" :class="{ error: !!error }">
    <label v-if="label">{{ label }}</label>
    <select v-model="model.value" @blur="onBlur" :disabled="disabled">
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in options" :key="optKey(opt)" :value="optKey(opt)">
        {{ optLabel(opt) }}
      </option>
    </select>
    <span v-if="error" class="error-msg">{{ error }}</span>
  </div>
</template>
```

### Example: Action Button Component

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'

const props = defineProps<TFoormComponentProps<never, any, any>>()
const emit = defineEmits<{ (e: 'action', name: string): void }>()
</script>

<template>
  <button type="button" @click="emit('action', altAction!)">
    {{ label }}
  </button>
</template>
```

### Registering Components

```vue
<script setup lang="ts">
import { OoForm, useFoorm } from '@foormjs/vue'
import { MyForm } from './forms/my-form.as'
import MyTextInput from './components/MyTextInput.vue'
import MySelect from './components/MySelect.vue'
import StarRating from './components/StarRating.vue'

const { def, formData } = useFoorm(MyForm)

// By field type
const typeComponents = {
  text: MyTextInput,
  password: MyTextInput,
  select: MySelect,
}

// By @foorm.component name
const namedComponents = {
  StarRating,
}
</script>

<template>
  <OoForm
    :def="def"
    :form-data="formData"
    :types="typeComponents"
    :components="namedComponents"
    @submit="handleSubmit"
  />
</template>
```

---

## Form Context

Pass runtime data to computed functions and validators:

```vue
<script setup>
const ctx = reactive({
  cityOptions: [
    { key: 'nyc', label: 'New York' },
    { key: 'la', label: 'Los Angeles' },
  ],
  user: { role: 'admin' },
})
</script>

<template>
  <OoForm :def="def" :form-data="formData" :form-context="ctx" @submit="onSubmit" />
</template>
```

Access in `.as` function strings as the third argument:

```
@foorm.fn.options '(v, data, ctx) => ctx.cityOptions || []'
city?: foorm.select

@foorm.fn.hidden '(v, data, ctx) => ctx.user.role !== "admin"'
adminField: string
```

---

## Server-Side Errors

```vue
<script setup>
const serverErrors = ref<Record<string, string>>({})

async function handleSubmit(data: any) {
  const result = await api.submit(data)
  if (result.errors) {
    serverErrors.value = result.errors // { email: 'Already taken', ... }
  }
}
</script>

<template>
  <OoForm :def="def" :form-data="formData" :errors="serverErrors" @submit="handleSubmit" />
</template>
```

Errors are keyed by field path (e.g., `email`, `address.street`).

---

## Arrays and Nested Groups

`OoForm` handles array and nested group fields automatically. The component tree is:

```
OoForm (VuilessForm wrapper + form chrome)
  └── OoGroup (recursive field renderer)
        ├── OoField (leaf field)
        ├── OoGroup (nested object with @foorm.title → group section)
        │     └── OoField ...
        └── OoGroup (array field → delegates to OoArray)
              └── OoArray
                    └── OoGroup (per object item → sub-fields)
                          └── OoField ...
```

### OoGroup

Recursive field renderer. Detects field type and either:
- **Iterates fields** (top-level or group) — renders `OoField` per leaf, nested `OoGroup` for sub-groups/arrays
- **Delegates to OoArray** for array-typed fields
- **Resolves `@foorm.component`** for custom group/array components

For nested groups, `OoGroup` provides a derived vuiless context that overrides `formData` while inheriting `register`/`unregister` from the root `VuilessForm`. This means all fields — including deeply nested ones — register with the root form for submit-time validation.

### OoArray

Array field renderer. Handles:
- **Add/remove buttons** — labels from `@foorm.array.add.label` / `@foorm.array.remove.label`, or custom components from `@foorm.array.add.component` / `@foorm.array.remove.component`
- **Primitive items** (`string[]`, `number[]`) — inline input + remove button
- **Object items** (`{ ... }[]`) — card with sub-fields rendered by `OoGroup`
- **Union arrays** (`(A | B)[]`) — variant selector per item, one add button per variant
- **Array-level validation** — `@expect.minLength` / `@expect.maxLength` errors displayed below the add button
- **Min/max enforcement** — add button disabled at maxLength, remove button disabled at minLength

### Custom Group/Array Components

Use `@foorm.component` on an object or array field to delegate rendering to a custom component:

```
@foorm.title 'Addresses'
@foorm.component 'AddressList'
addresses: { ... }[]
```

Custom group/array components receive `TFoormGroupComponentProps`:

```ts
import type { TFoormGroupComponentProps } from '@foormjs/vue'

const props = defineProps<TFoormGroupComponentProps>()
```

| Prop          | Type                      | Description                               |
| ------------- | ------------------------- | ----------------------------------------- |
| `field`       | `FoormFieldDef`           | The field definition (array or group)     |
| `model`       | `{ value: unknown }`      | Reactive model for the group/array value  |
| `formData`    | `TFormData`               | Full reactive form data                   |
| `formContext`  | `TFormContext?`           | External context                          |
| `disabled`    | `boolean?`                | Disabled state                            |
| `hidden`      | `boolean?`                | Hidden state                              |
| `label`       | `string?`                 | Resolved title/label                      |
| `errors`      | `Record<string, string>?` | External error overrides                  |

---

## OoField (standalone usage)

`OoField` can be used independently for custom layouts:

```vue
<script setup>
import { OoField } from '@foormjs/vue'
import { useFoorm } from '@foormjs/vue'
import { MyForm } from './forms/my-form.as'

const { def, formData } = useFoorm(MyForm)
</script>

<template>
  <form @submit.prevent>
    <OoField v-for="field in def.fields" :key="field.path" :field="field" v-slot="props">
      <MyCustomField v-bind="props" />
    </OoField>
  </form>
</template>
```
