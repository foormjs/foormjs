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

| Prop              | Type                                                                     | Required | Default | Description                                                    |
| ----------------- | ------------------------------------------------------------------------ | -------- | ------- | -------------------------------------------------------------- |
| `def`             | `FoormDef`                                                               | Yes      | —       | Form definition from `useFoorm()`                              |
| `formData`        | `object`                                                                 | No       | `{}`    | Reactive form data                                             |
| `formContext`     | `object`                                                                 | No       | —       | External context for computed fns and validators               |
| `firstValidation` | `'on-change' \| 'touched-on-blur' \| 'on-blur' \| 'on-submit' \| 'none'` | No       | —       | When to trigger first validation                               |
| `types`           | `Record<string, Component>`                                              | No       | —       | Components mapped by field type                                |
| `components`      | `Record<string, Component>`                                              | No       | —       | Components mapped by `@foorm.component` name and array widgets |
| `groupComponent`  | `Component`                                                              | No       | —       | Custom wrapper component for all groups and array items        |
| `errors`          | `Record<string, string>`                                                 | No       | —       | External errors (e.g., server-side) keyed by field path        |

### Events

| Event                | Payload                               | Description                                         |
| -------------------- | ------------------------------------- | --------------------------------------------------- |
| `submit`             | `formData`                            | Valid form submission                               |
| `error`              | `{ path: string; message: string }[]` | Validation failed on submit                         |
| `action`             | `name, formData`                      | Action button clicked (matching `@foorm.altAction`) |
| `unsupported-action` | `name, formData`                      | Action button clicked but no field supports it      |

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
  <template #form.header="{ clearErrors, reset, setErrors, disabled }">
    <h1>Form Header</h1>
  </template>

  <template #form.before="{ clearErrors, reset, setErrors }">
    <p>All fields required unless marked optional.</p>
  </template>

  <template #form.after="{ disabled, formContext, setErrors }">
    <p v-if="disabled">Please complete all fields.</p>
  </template>

  <template #form.submit="{ text, disabled, clearErrors, reset, setErrors }">
    <button type="submit" :disabled="disabled">{{ text }}</button>
  </template>

  <template #form.footer="{ clearErrors, reset, setErrors, formContext }">
    <p>Terms apply.</p>
  </template>
</OoForm>
```

| Slot           | Scope                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| `field:{type}` | All `TFoormComponentProps` + `classes`, `styles`, `value`, `vName`, `attrs` |
| `form.header`  | `{ clearErrors, reset, setErrors, formContext, disabled }`                  |
| `form.before`  | `{ clearErrors, reset, setErrors }`                                         |
| `form.after`   | `{ clearErrors, reset, setErrors, disabled, formContext }`                  |
| `form.submit`  | `{ text, disabled, clearErrors, reset, setErrors, formContext }`            |
| `form.footer`  | `{ disabled, clearErrors, reset, setErrors, formContext }`                  |

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
| `onRemove`     | `() => void?`             | Callback to remove this item from its parent array |
| `canRemove`    | `boolean?`                | Whether removal is allowed (respects minLength)    |
| `removeLabel`  | `string?`                 | Label for the remove button                        |

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
OoForm (useFoormForm composable + form chrome)
  └─ provides '__foorm_form', '__foorm_root_data', '__foorm_path_prefix' (''), '__foorm_action_handler'
  └── OoGroup (recursive field renderer)
        ├── OoField (leaf field → useFoormField)
        ├── OoGroup (nested object with @foorm.title → group section)
        │     └── OoField ...
        └── OoGroup (array field → self-registers for array validation, delegates to OoArray)
              └── OoArray
                    └── OoGroup (per item → provides path prefix e.g. 'addresses.0')
                          └── OoField ...
```

### OoGroup

Recursive field renderer. Provides path prefix (`__foorm_path_prefix`) for absolute path resolution. Detects field type and either:

- **Iterates fields** (top-level or group) — renders `OoField` per leaf, nested `OoGroup` for sub-groups/arrays
- **Delegates to OoArray** for array-typed fields
- **Self-registers** via `useFoormField` for array/group-level validation (e.g., `@expect.minLength` on arrays)
- **Resolves `@foorm.component`** — fields with custom components fall through to `OoField` for terminal delegation

All fields register with the single root foorm context (provided by `OoForm`). `OoGroup` only provides path prefix context — it never overrides the foorm form state.

### OoArray

Array field renderer. Handles:

- **Add button** — label from `@foorm.array.add.label`, or a custom component via `@foorm.array.add.component`
- **Remove button** — label from `@foorm.array.remove.label`; rendered by the group wrapper (default or custom) for object items, or passed as `onRemove` prop to field components for primitive items
- **Variant selector** — for union arrays, a per-item selector to switch types; customizable via `@foorm.array.variant.component`
- **Primitive items** (`string[]`, `number[]`) — rendered via `OoGroup` with `itemField` (compact inline input + remove button)
- **Object items** (`{ ... }[]`) — rendered via `OoGroup` with sub-fields in a card
- **Union arrays** (`(A | B)[]`) — variant selector per item, one add button per variant
- **Array-level validation** — `@expect.minLength` / `@expect.maxLength` errors displayed below the add button
- **Min/max enforcement** — add button disabled at maxLength, remove button disabled at minLength

---

## Custom Components

foormjs supports five types of custom components. Each has a dedicated props interface exported from `@foormjs/vue`:

| Component Type  | Props Interface               | How to Pass                    | Purpose                              |
| --------------- | ----------------------------- | ------------------------------ | ------------------------------------ |
| Field component | `TFoormComponentProps`        | `types` or `components` prop   | Renders a single field (input, etc.) |
| Group component | `TFoormGroupComponentProps`   | `groupComponent` prop          | Wraps groups and array items         |
| Add button      | `TFoormAddComponentProps`     | `components` prop + annotation | Custom add-item button for arrays    |
| Variant picker  | `TFoormVariantComponentProps` | `components` prop + annotation | Custom variant selector for unions   |

### Custom Field Components

Field components render individual form fields. They receive all resolved metadata via `TFoormComponentProps`.

**Important for arrays:** When a field is rendered inside an array, `onRemove`, `canRemove`, and `removeLabel` props are provided. Custom field components **must handle the remove button** for primitive array items (like `string[]`, `number[]`), because there is no group wrapper around them.

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'

defineProps<TFoormComponentProps<string, any, any>>()
</script>

<template>
  <div class="field" v-show="!hidden">
    <div class="header">
      <label v-if="label">{{ label }}</label>
      <!-- Remove button for array items — IMPORTANT to implement -->
      <button v-if="onRemove" type="button" :disabled="!canRemove" @click="onRemove">
        {{ removeLabel || '×' }}
      </button>
    </div>
    <input
      :value="model.value"
      @input="model.value = ($event.target as HTMLInputElement).value"
      @blur="onBlur"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
    />
    <span v-if="error" class="error">{{ error }}</span>
    <span v-else-if="hint" class="hint">{{ hint }}</span>
  </div>
</template>
```

Register by field type (covers all fields of that type) or by `@foorm.component` name (targets specific fields):

```vue
<OoForm
  :def="def"
  :form-data="formData"
  :types="{ text: MyTextInput, select: MySelect }"
  :components="{ StarRating: MyStarRating }"
  @submit="onSubmit"
/>
```

### Custom Group Component

The group component wraps all nested groups (objects with `@foorm.title`) and array items (each card in an array). It replaces the default `div.oo-group` markup. Fields are rendered in its **default slot**.

Pass it via the `groupComponent` prop on `OoForm` — it applies to all groups in the form.

```vue
<script setup lang="ts">
import type { TFoormGroupComponentProps } from '@foormjs/vue'

defineProps<TFoormGroupComponentProps>()
</script>

<template>
  <div class="card">
    <div class="card-header" v-if="title || onRemove">
      <h3 v-if="title">{{ title }}</h3>
      <span v-if="error" class="error">{{ error }}</span>
      <!-- Remove button for array items — IMPORTANT to implement -->
      <button v-if="onRemove" type="button" :disabled="!canRemove" @click="onRemove">
        {{ removeLabel || 'Remove' }}
      </button>
    </div>
    <div class="card-body">
      <!-- Fields are rendered here via default slot -->
      <slot />
    </div>
  </div>
</template>
```

`TFoormGroupComponentProps`:

| Prop          | Type          | Description                                                |
| ------------- | ------------- | ---------------------------------------------------------- |
| `title`       | `string?`     | Group title (from `@foorm.title` or `@meta.label`)         |
| `error`       | `string?`     | Group-level validation error                               |
| `onRemove`    | `() => void?` | Remove callback — present only for array items             |
| `canRemove`   | `boolean?`    | Whether removal is allowed (respects minLength)            |
| `removeLabel` | `string?`     | Label for remove button (from `@foorm.array.remove.label`) |
| `disabled`    | `boolean?`    | Whether this group is disabled                             |

Usage:

```vue
<OoForm :def="def" :form-data="formData" :group-component="MyCard" @submit="onSubmit" />
```

### Custom Add Button

Replaces the default add-item button for a specific array field. Triggered by the `@foorm.array.add.component` annotation, looked up in the `components` prop.

```
@foorm.array.add.component 'MyAddButton'
scores: number[]
```

```vue
<script setup lang="ts">
import type { TFoormAddComponentProps } from '@foormjs/vue'

defineProps<TFoormAddComponentProps>()
const emit = defineEmits<{ (e: 'add', variantIndex: number): void }>()
</script>

<template>
  <button type="button" :disabled="disabled" @click="emit('add', 0)">+ Add item</button>
</template>
```

`TFoormAddComponentProps`:

| Prop       | Type                  | Description                                                   |
| ---------- | --------------------- | ------------------------------------------------------------- |
| `disabled` | `boolean?`            | Whether adding is disabled (array at max length)              |
| `variants` | `FoormArrayVariant[]` | Available variants (single for homogeneous, multi for unions) |

The component **emits `add(variantIndex)`** to append a new item. For single-type arrays, always emit `0`. For union arrays, emit the index of the variant to add.

### Custom Variant Picker

Replaces the default variant selector buttons shown per-item in union arrays. Triggered by the `@foorm.array.variant.component` annotation, looked up in the `components` prop.

```
@foorm.array.variant.component 'MyVariantPicker'
contacts: ({ fullName: string; email?: string } | string)[]
```

```vue
<script setup lang="ts">
import type { TFoormVariantComponentProps } from '@foormjs/vue'

defineProps<TFoormVariantComponentProps>()
const emit = defineEmits<{ (e: 'update:modelValue', index: number): void }>()
</script>

<template>
  <div class="variant-picker">
    <button
      v-for="(v, i) in variants"
      :key="i"
      type="button"
      :disabled="disabled || modelValue === i"
      @click="emit('update:modelValue', i)"
    >
      {{ v.label }}
    </button>
  </div>
</template>
```

`TFoormVariantComponentProps`:

| Prop         | Type                  | Description                           |
| ------------ | --------------------- | ------------------------------------- |
| `variants`   | `FoormArrayVariant[]` | Available union variants              |
| `modelValue` | `number`              | Index of the currently active variant |
| `disabled`   | `boolean?`            | Whether the selector is disabled      |

The component **emits `update:modelValue(index)`** to switch the item's variant.

### Putting It All Together

All custom component types can be combined on a single form:

```vue
<script setup lang="ts">
import type { Component } from 'vue'
import { OoForm, useFoorm } from '@foormjs/vue'
import { MyForm } from './forms/my-form.as'
import MyTextInput from './components/MyTextInput.vue'
import MyCard from './components/MyCard.vue'
import MyAddButton from './components/MyAddButton.vue'
import MyVariantPicker from './components/MyVariantPicker.vue'

const { def, formData } = useFoorm(MyForm)

const types: Record<string, Component> = {
  text: MyTextInput,
}

const components: Record<string, Component> = {
  MyAddButton,
  MyVariantPicker,
}
</script>

<template>
  <OoForm
    :def="def"
    :form-data="formData"
    :types="types"
    :components="components"
    :group-component="MyCard"
    @submit="handleSubmit"
  />
</template>
```

### Remove Button Responsibility

The remove button for array items is **not** a standalone custom component. Instead, it is the responsibility of the wrapping component:

- **Object array items** (e.g., `addresses: { street: string; city: string }[]`): The **group component** receives `onRemove`, `canRemove`, and `removeLabel` as props. If you use a custom `groupComponent`, you must render the remove button yourself.
- **Primitive array items** (e.g., `tags: string[]`): The **field component** receives `onRemove`, `canRemove`, and `removeLabel` as props (since there is no group wrapper). Your custom field component must render the remove button when `onRemove` is present.

If you don't render the remove button, users won't be able to remove items from the array.

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
