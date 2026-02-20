# Vue Components

foormjs provides renderless Vue components that resolve all form metadata and pass it to your UI components. You provide the `types` map — a record mapping field type strings to Vue components — and foormjs handles everything else.

## useFoorm Composable

```ts
import { useFoorm } from '@foormjs/vue'
import { MyForm } from './forms/my-form.as'

const { def, formData } = useFoorm(MyForm)
```

- **`def`** — `FoormDef` with root field, ordered fields, the source type, and a flatMap
- **`formData`** — Vue `reactive()` object with default values from the schema

---

## OoForm

Renderless form wrapper. Provides context, resolves form-level props, renders `<OoField :field="def.rootField" />`.

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
  @change="onChange"
/>
```

### Props

| Prop              | Type                                                                     | Required | Default       | Description                                                    |
| ----------------- | ------------------------------------------------------------------------ | -------- | ------------- | -------------------------------------------------------------- |
| `def`             | `FoormDef`                                                               | Yes      | —             | Form definition from `useFoorm()`                              |
| `formData`        | `object`                                                                 | No       | `{}`          | Reactive form data                                             |
| `formContext`     | `object`                                                                 | No       | —             | External context for computed fns and validators               |
| `firstValidation` | `'on-change' \| 'touched-on-blur' \| 'on-blur' \| 'on-submit' \| 'none'` | No       | `'on-change'` | When to trigger first validation                               |
| `types`           | `Record<string, Component>`                                              | Yes      | —             | Components mapped by field type                                |
| `components`      | `Record<string, Component>`                                              | No       | —             | Components mapped by `@foorm.component` name                   |
| `errors`          | `Record<string, string>`                                                 | No       | —             | External errors (e.g., server-side) keyed by field path        |

### Events

| Event                | Payload                                         | Description                                         |
| -------------------- | ----------------------------------------------- | --------------------------------------------------- |
| `submit`             | `formData`                                      | Valid form submission                               |
| `error`              | `{ path: string; message: string }[]`           | Validation failed on submit                         |
| `action`             | `name, formData`                                | Action button clicked (matching `@foorm.altAction`) |
| `unsupported-action` | `name, formData`                                | Action button clicked but no field supports it      |
| `change`             | `type: TFoormChangeType, path, value, formData` | Field update, array add/remove, or union switch     |

`TFoormChangeType` is `'update' | 'array-add' | 'array-remove' | 'union-switch'`.

### Component Resolution Order

For each field, `OoField` resolves the component in this order:

1. **`@foorm.component`** — named component from the `components` prop
2. **`types` prop** — component matched by field type

### Slots

```vue
<OoForm :def="def" :form-data="formData" :types="typeComponents" @submit="onSubmit">
  <!-- Form structure slots -->
  <template #form.header="{ clearErrors, reset, setErrors, formContext, disabled }">
    <h1>Form Header</h1>
  </template>

  <template #form.before="{ clearErrors, reset, setErrors }">
    <p>All fields required unless marked optional.</p>
  </template>

  <template #form.after="{ disabled, formContext, clearErrors, reset, setErrors }">
    <p v-if="disabled">Please complete all fields.</p>
  </template>

  <template #form.submit="{ text, disabled, clearErrors, reset, setErrors, formContext }">
    <button type="submit" :disabled="disabled">{{ text }}</button>
  </template>

  <template #form.footer="{ clearErrors, reset, setErrors, formContext, disabled }">
    <p>Terms apply.</p>
  </template>
</OoForm>
```

| Slot           | Scope                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| `form.header`  | `{ clearErrors, reset, setErrors, formContext, disabled }`                  |
| `form.before`  | `{ clearErrors, reset, setErrors }`                                         |
| `form.after`   | `{ clearErrors, reset, setErrors, disabled, formContext }`                  |
| `form.submit`  | `{ text, disabled, clearErrors, reset, setErrors, formContext }`            |
| `form.footer`  | `{ disabled, clearErrors, reset, setErrors, formContext }`                  |

---

## The `types` Map — Complete Reference

The `types` prop is **required** on `OoForm`. It maps field type strings to Vue components. Every field type your form uses must have a corresponding entry. You can use the built-in default components or your own custom ones.

### Full Default Types Map

Use `createDefaultTypes()` to get a pre-populated map with all defaults:

```ts
import { createDefaultTypes } from '@foormjs/vue'
import type { TFoormTypeComponents } from '@foormjs/vue'

const types: TFoormTypeComponents = createDefaultTypes()
```

Or build the map manually for full control:

```ts
import type { TFoormTypeComponents } from '@foormjs/vue'
import {
  OoInput, OoSelect, OoRadio, OoCheckbox, OoParagraph,
  OoAction, OoObject, OoArray, OoUnion, OoTuple,
} from '@foormjs/vue'

const types: TFoormTypeComponents = {
  text: OoInput,        // string fields → <input type="text">
  password: OoInput,    // @foorm.type 'password' → <input type="password">
  number: OoInput,      // number fields → <input type="number">
  select: OoSelect,     // foorm.select fields → <select>
  radio: OoRadio,       // foorm.radio fields → radio button group
  checkbox: OoCheckbox, // boolean / foorm.checkbox fields → <input type="checkbox">
  paragraph: OoParagraph, // foorm.paragraph phantom fields → <p> display text
  action: OoAction,     // foorm.action phantom fields → action button
  object: OoObject,     // nested object / group fields → titled section with sub-fields
  array: OoArray,       // array fields → list with add/remove buttons
  union: OoUnion,       // union type fields → variant selector + inner field
  tuple: OoTuple,       // tuple type fields → fixed-length list of fields
}
```

`TFoormTypeComponents` requires the 10 base type keys (`text`, `select`, `radio`, `checkbox`, `paragraph`, `action`, `object`, `array`, `union`, `tuple`) and allows additional custom keys.

### Type Key → Schema Mapping

| Type Key     | Schema Triggers                                       | Component Responsibility                             |
| ------------ | ----------------------------------------------------- | ---------------------------------------------------- |
| `text`       | `string` fields (default)                             | Text input with label, error, validation             |
| `password`   | `@foorm.type 'password'`                              | Password input (same as text, different input type)   |
| `number`     | `number` fields                                       | Number input                                         |
| `select`     | `foorm.select` primitive                              | Dropdown with options from `@foorm.options`          |
| `radio`      | `foorm.radio` primitive                               | Radio button group with options                      |
| `checkbox`   | `boolean` / `foorm.checkbox`                          | Boolean toggle checkbox                              |
| `paragraph`  | `foorm.paragraph` phantom type                        | Read-only text display (not a data field)            |
| `action`     | `foorm.action` phantom type                           | Button that emits an action event                    |
| `object`     | Nested objects / `@foorm.title` groups                | Header + iterates sub-fields                         |
| `array`      | `type[]` array fields                                 | List with add/remove, iterates items                 |
| `union`      | Union types (`A \| B`)                                | Variant selector + renders selected variant          |
| `tuple`      | Tuple types (`[A, B]`)                                | Fixed-length, renders each position                  |

### Custom Types

You can add any custom type key. Use `@foorm.type 'myCustomType'` in your schema, then map it in `types`:

```ts
const types = {
  // ... standard types ...
  textarea: MyTextarea,
  'date-picker': MyDatePicker,
  rating: MyStarRating,
}
```

---

## The TFoormComponentProps Interface

Every custom component receives these props from `OoField`:

```ts
import type { TFoormComponentProps } from '@foormjs/vue'

const props = defineProps<TFoormComponentProps<string>>()
```

| Prop               | Type                          | Description                                                |
| ------------------ | ----------------------------- | ---------------------------------------------------------- |
| `model`            | `{ value: V }`                | Reactive model — bind with `v-model="model.value"`         |
| `value`            | `unknown?`                    | Phantom display value (`@foorm.value` / `@foorm.fn.value`) |
| `onBlur`           | `(e: FocusEvent) => void`     | Triggers validation on blur                                |
| `error`            | `string?`                     | Validation error message                                   |
| `label`            | `string?`                     | Resolved label                                             |
| `description`      | `string?`                     | Resolved description                                       |
| `hint`             | `string?`                     | Hint text                                                  |
| `placeholder`      | `string?`                     | Placeholder                                                |
| `disabled`         | `boolean?`                    | Disabled state                                             |
| `hidden`           | `boolean?`                    | Hidden state                                               |
| `readonly`         | `boolean?`                    | Read-only state                                            |
| `optional`         | `boolean?`                    | Whether optional                                           |
| `required`         | `boolean?`                    | Whether required                                           |
| `type`             | `string`                      | Field input type                                           |
| `options`          | `TFoormEntryOptions[]?`       | Select/radio options                                       |
| `maxLength`        | `number?`                     | Max length constraint                                      |
| `autocomplete`     | `string?`                     | HTML autocomplete value                                    |
| `altAction`        | `TFoormAltAction?`            | Alternate action `{ id, label }` from `@foorm.altAction`   |
| `name`             | `string?`                     | Field name                                                 |
| `field`            | `FoormFieldDef?`              | Full field definition                                      |
| `title`            | `string?`                     | Title for object/array fields                              |
| `level`            | `number?`                     | Nesting level (root=0, increments per object/array)        |
| `class`            | `string \| object?`           | CSS classes from `@foorm.fn.classes`                       |
| `style`            | `string \| object?`           | Inline styles from `@foorm.fn.styles`                      |
| `onRemove`         | `() => void?`                 | Callback to remove this item from its parent array         |
| `canRemove`        | `boolean?`                    | Whether removal is allowed (respects minLength)            |
| `removeLabel`      | `string?`                     | Label for the remove button                                |
| `arrayIndex`       | `number?`                     | Zero-based index when rendered as an array item            |
| `onToggleOptional` | `(enabled: boolean) => void?` | Toggle an optional field on/off                            |

---

## Custom Field Components — Complete Examples

### Text Input (`text` / `password` / `number`)

Handles `string`, `number`, and password fields. The `type` prop determines the `<input>` type.

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'

const props = defineProps<TFoormComponentProps<string>>()
</script>

<template>
  <div class="field" :class="{ error: !!error, disabled }" v-show="!hidden">
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
      :aria-invalid="!!error || undefined"
      :aria-required="required || undefined"
    />
    <!-- Remove button for primitive array items -->
    <button v-if="onRemove" type="button" :disabled="!canRemove" @click="onRemove">
      {{ removeLabel || 'Remove' }}
    </button>
    <span v-if="error" class="error-msg">{{ error }}</span>
    <span v-else-if="hint" class="hint">{{ hint }}</span>
  </div>
</template>
```

**Key points:**
- Use `v-model="model.value"` or `@input` + `:value` for two-way binding
- Call `onBlur` on blur events to trigger validation
- When inside an array (primitive items), you receive `onRemove`/`canRemove`/`removeLabel` — render a remove button
- Use `v-show="!hidden"` to respect dynamic visibility

### Select (`select`)

Renders a dropdown from `@foorm.options` annotations.

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
import { optKey, optLabel } from '@foormjs/atscript'

const props = defineProps<TFoormComponentProps<string>>()
</script>

<template>
  <div class="field" :class="{ error: !!error }" v-show="!hidden">
    <label v-if="label">{{ label }}</label>
    <p v-if="description" class="description">{{ description }}</p>
    <select v-model="model.value" @blur="onBlur" :disabled="disabled">
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in options" :key="optKey(opt)" :value="optKey(opt)">
        {{ optLabel(opt) }}
      </option>
    </select>
    <!-- Remove button for primitive array items -->
    <button v-if="onRemove" type="button" :disabled="!canRemove" @click="onRemove">
      {{ removeLabel || 'Remove' }}
    </button>
    <span v-if="error" class="error-msg">{{ error }}</span>
  </div>
</template>
```

**Key points:**
- Import `optKey`/`optLabel` from `@foormjs/atscript` — options can be `string` or `{ key, label }`
- `options` is a resolved array from `@foorm.options` (static) or `@foorm.fn.options` (computed)
- Use `placeholder` as a disabled first option

### Radio Button Group (`radio`)

Renders radio buttons from options — same option handling as select.

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
import { optKey, optLabel } from '@foormjs/atscript'

const props = defineProps<TFoormComponentProps<string>>()
</script>

<template>
  <div class="field radio-field" :class="{ error: !!error }" v-show="!hidden">
    <span v-if="label" class="label">{{ label }}</span>
    <p v-if="description" class="description">{{ description }}</p>
    <div role="radiogroup" :aria-labelledby="name" :aria-required="required || undefined">
      <label v-for="opt in options" :key="optKey(opt)" class="radio-option">
        <input
          type="radio"
          :value="optKey(opt)"
          v-model="model.value"
          @blur="onBlur"
          :name="name"
          :disabled="disabled"
          :readonly="readonly"
        />
        {{ optLabel(opt) }}
      </label>
    </div>
    <span v-if="error" class="error-msg">{{ error }}</span>
  </div>
</template>
```

**Key points:**
- Uses `role="radiogroup"` for accessibility
- Each radio uses the same `name` for grouping
- Options work identically to select

### Checkbox (`checkbox`)

Renders a boolean toggle. Bound via `:checked` + `@change` (not `v-model`).

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'

const props = defineProps<TFoormComponentProps<boolean>>()
</script>

<template>
  <div class="field checkbox-field" :class="{ error: !!error }" v-show="!hidden">
    <label>
      <input
        type="checkbox"
        :checked="!!model.value"
        @change="model.value = ($event.target as HTMLInputElement).checked"
        @blur="onBlur"
        :name="name"
        :disabled="disabled"
        :readonly="readonly"
      />
      {{ label }}
    </label>
    <p v-if="description" class="description">{{ description }}</p>
    <span v-if="error" class="error-msg">{{ error }}</span>
  </div>
</template>
```

**Key points:**
- Model type is `boolean` — use `:checked` + `@change` to toggle
- Label wraps the input for click area
- For required checkboxes (`boolean.required`), validation enforces `true`

### Paragraph (`paragraph`)

Read-only text display — not a data field. The `value` prop comes from `@foorm.value` or `@foorm.fn.value`.

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'

const props = defineProps<TFoormComponentProps>()
</script>

<template>
  <p v-show="!hidden" aria-live="polite">{{ value }}</p>
</template>
```

**Key points:**
- Use `value` (not `model.value`) — paragraphs display static/computed text
- No validation, no data binding
- Phantom field: excluded from form data, TypeScript type, and validation

### Action Button (`action`)

Renders a button that emits an action event. Used for alternate form actions (e.g., "Save Draft").

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'

const props = defineProps<TFoormComponentProps<never>>()
const emit = defineEmits<{ (e: 'action', name: string): void }>()
</script>

<template>
  <div v-show="!hidden" :class="$props.class" :style="$props.style">
    <button
      type="button"
      :disabled="disabled"
      @click="altAction && emit('action', altAction.id)"
    >
      {{ altAction?.label }}
    </button>
  </div>
</template>
```

**Key points:**
- `altAction` is `{ id, label }` from `@foorm.altAction 'id', 'label'`
- Emits `'action'` event — `OoField` intercepts and forwards to `OoForm`'s `action` event
- Phantom field: excluded from form data and validation

### Object / Group (`object`)

Renders a titled section with sub-fields. This is the most complex structural component.

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
import type { FoormObjectFieldDef } from '@foormjs/atscript'
import { isObjectField } from '@foormjs/atscript'
import { OoIterator, useConsumeUnionContext, formatIndexedLabel } from '@foormjs/vue'
import { computed } from 'vue'

const props = defineProps<TFoormComponentProps>()

// Extract the nested form definition
const objectDef = isObjectField(props.field!)
  ? (props.field as FoormObjectFieldDef).objectDef
  : undefined

// Consume union context (if inside a union) — pass to header for variant picker
const unionCtx = useConsumeUnionContext()

// In array context, show "#1", "#2" etc. alongside the title
const displayTitle = computed(() => formatIndexedLabel(props.title, props.arrayIndex))

const optionalEnabled = computed(() => props.model?.value !== undefined)
</script>

<template>
  <div class="object-group" v-show="!hidden">
    <!-- Header: title, variant picker, optional clear, remove button -->
    <div v-if="displayTitle || onRemove" class="object-header">
      <h3 v-if="displayTitle">{{ displayTitle }}</h3>
      <!-- Remove button (for object array items) -->
      <button v-if="onRemove" type="button" :disabled="!canRemove" @click="onRemove">
        {{ removeLabel || 'Remove' }}
      </button>
    </div>

    <!-- Optional field: show placeholder when undefined -->
    <template v-if="optional && !optionalEnabled">
      <div class="no-data" @click="onToggleOptional?.(true)">No Data — Click to Edit</div>
    </template>
    <template v-else>
      <div v-if="error" class="object-error">{{ error }}</div>
      <!-- OoIterator renders all sub-fields -->
      <OoIterator v-if="objectDef" :def="objectDef" />
    </template>
  </div>
</template>
```

**Key points:**
- Use `isObjectField()` type guard to cast `field` to `FoormObjectFieldDef` and access `objectDef`
- **`OoIterator`** renders all sub-fields from `objectDef` — import from `@foormjs/vue`
- Call `useConsumeUnionContext()` to read and clear union context (prevents nested children from inheriting it)
- `formatIndexedLabel()` prepends `#1`, `#2` etc. when rendered as an array item
- `onRemove`/`canRemove`/`removeLabel` are for removing this item from its parent array
- `onToggleOptional` enables/disables optional objects

### Array (`array`)

Renders a list with add/remove buttons. Uses the `useFoormArray()` composable for state management.

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
import type { FoormArrayFieldDef } from '@foormjs/atscript'
import { isArrayField } from '@foormjs/atscript'
import { OoField, useFoormArray, useConsumeUnionContext } from '@foormjs/vue'
import { computed } from 'vue'

const props = defineProps<TFoormComponentProps>()

const arrayField = isArrayField(props.field!) ? (props.field as FoormArrayFieldDef) : undefined

// Consume union context (if inside a union)
const unionCtx = useConsumeUnionContext()

const optionalEnabled = computed(() => Array.isArray(props.model?.value))

const {
  arrayValue,     // ComputedRef<unknown[]> — current array items
  itemKeys,       // string[] — stable keys for v-for
  getItemField,   // (index) => FoormFieldDef — field def for each item
  isUnion,        // boolean — whether items are union types
  unionVariants,  // FoormUnionVariant[] — available variants (if union)
  addItem,        // (variantIndex?) => void — add a new item
  removeItem,     // (index) => void — remove item at index
  canAdd,         // ComputedRef<boolean> — respects @expect.maxLength
  canRemove,      // ComputedRef<boolean> — respects @expect.minLength
  addLabel,       // string — from @foorm.array.add.label or "Add item"
  removeLabel,    // string — from @foorm.array.remove.label or "Remove"
} = useFoormArray(
  arrayField!,
  computed(() => props.disabled ?? false)
)
</script>

<template>
  <div class="array-field" v-show="!hidden">
    <h3 v-if="title">{{ title }}</h3>

    <template v-if="optional && !optionalEnabled">
      <div class="no-data" @click="onToggleOptional?.(true)">No Data — Click to Edit</div>
    </template>
    <template v-else>
      <!-- Render each item as an OoField -->
      <OoField
        v-for="(_item, i) in arrayValue"
        :key="itemKeys[i]"
        :field="getItemField(i)"
        :on-remove="() => removeItem(i)"
        :can-remove="canRemove"
        :remove-label="removeLabel"
        :array-index="i"
      />

      <!-- Add button -->
      <div v-if="!isUnion">
        <button type="button" :disabled="!canAdd" @click="addItem(0)">
          {{ addLabel }}
        </button>
      </div>
      <!-- Union: show variant options when adding -->
      <div v-else>
        <button
          v-for="(v, vi) in unionVariants"
          :key="vi"
          type="button"
          :disabled="!canAdd"
          @click="addItem(vi)"
        >
          {{ addLabel }} — {{ v.label }}
        </button>
      </div>

      <div v-if="error" class="array-error">{{ error }}</div>
    </template>
  </div>
</template>
```

**Key points:**
- Use `isArrayField()` type guard to cast `field` to `FoormArrayFieldDef`
- **`useFoormArray()`** manages all array state — stable keys, add/remove, constraints
- Render items with `<OoField>` using `getItemField(i)` — pass `onRemove`, `canRemove`, `removeLabel`, `arrayIndex`
- `itemKeys` provides stable keys for Vue's `v-for` tracking
- For **union arrays** (`isUnion`), the add button should offer variant selection
- `canAdd`/`canRemove` respect `@expect.maxLength`/`@expect.minLength` constraints
- Array-level validation errors come through `error` prop

### Union (`union`)

Renders a variant selector and the currently selected variant. Uses the `useFoormUnion()` composable.

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
import { OoField, useFoormUnion } from '@foormjs/vue'

const props = defineProps<TFoormComponentProps>()

const {
  unionField,           // ComputedRef<FoormUnionFieldDef | undefined>
  hasMultipleVariants,  // ComputedRef<boolean>
  localUnionIndex,      // Ref<number> — current variant index
  innerField,           // ComputedRef<FoormFieldDef | undefined> — field for current variant
  changeVariant,        // (newIndex) => void — switch variant (stashes/restores data)
  optionalEnabled,      // ComputedRef<boolean>
} = useFoormUnion(props)
</script>

<template>
  <div class="union-field" v-show="!hidden">
    <!-- Optional N/A state -->
    <template v-if="optional && !optionalEnabled">
      <div class="no-data" @click="onToggleOptional?.(true)">No Data — Click to Edit</div>
    </template>
    <template v-else>
      <!-- Variant picker (when multiple variants) -->
      <div v-if="hasMultipleVariants" class="variant-picker">
        <button
          v-for="(v, vi) in unionField!.unionVariants"
          :key="vi"
          type="button"
          :class="{ active: vi === localUnionIndex }"
          @click="changeVariant(vi)"
        >
          {{ v.label }}
        </button>
      </div>

      <!-- Optional clear button -->
      <button v-if="optional" type="button" @click="onToggleOptional?.(false)">&times;</button>

      <!-- Render the selected variant -->
      <OoField
        v-if="innerField"
        :key="localUnionIndex"
        :field="innerField"
        :array-index="arrayIndex"
        :on-remove="onRemove"
        :can-remove="canRemove"
        :remove-label="removeLabel"
      />
    </template>
  </div>
</template>
```

**Key points:**
- **`useFoormUnion()`** manages variant state including data stashing (saves/restores data when switching variants)
- Use `:key="localUnionIndex"` on `OoField` to force re-render when variant changes
- Pass through `onRemove`/`canRemove`/`removeLabel`/`arrayIndex` to the inner field (for union items inside arrays)
- The default `OoUnion` also provides union context (`__foorm_union`) so child components can render an inline variant picker

### Tuple (`tuple`)

Renders a fixed-length list with one field per position.

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
import type { FoormTupleFieldDef } from '@foormjs/atscript'
import { isTupleField } from '@foormjs/atscript'
import { OoField, useConsumeUnionContext } from '@foormjs/vue'
import { computed } from 'vue'

const props = defineProps<TFoormComponentProps>()

const tupleField = isTupleField(props.field!) ? (props.field as FoormTupleFieldDef) : undefined

const unionCtx = useConsumeUnionContext()
const optionalEnabled = computed(() => props.model?.value !== undefined)
</script>

<template>
  <div class="tuple-field" v-show="!hidden">
    <h3 v-if="title">{{ title }}</h3>

    <template v-if="optional && !optionalEnabled">
      <div class="no-data" @click="onToggleOptional?.(true)">No Data — Click to Edit</div>
    </template>
    <template v-else>
      <!-- Render each position as an OoField -->
      <OoField
        v-if="tupleField"
        v-for="(itemField, i) in tupleField.itemFields"
        :key="i"
        :field="itemField"
      />
      <div v-if="error" class="tuple-error">{{ error }}</div>
    </template>
  </div>
</template>
```

**Key points:**
- Use `isTupleField()` type guard to access `tupleField.itemFields`
- Each position has a pre-built `FoormFieldDef` — just render them in order
- Tuples have fixed length — no add/remove buttons
- Items don't receive `onRemove` or `arrayIndex` (they're positional, not dynamic)

---

## Registering Components

```vue
<script setup lang="ts">
import { OoForm, useFoorm } from '@foormjs/vue'
import type { Component } from 'vue'
import { MyForm } from './forms/my-form.as'
import MyTextInput from './components/MyTextInput.vue'
import MySelect from './components/MySelect.vue'
import MyCheckbox from './components/MyCheckbox.vue'
import MyRadio from './components/MyRadio.vue'
import MyParagraph from './components/MyParagraph.vue'
import MyActionButton from './components/MyActionButton.vue'
import MyObjectGroup from './components/MyObjectGroup.vue'
import MyArrayList from './components/MyArrayList.vue'
import MyUnion from './components/MyUnion.vue'
import MyTuple from './components/MyTuple.vue'
import StarRating from './components/StarRating.vue'

const { def, formData } = useFoorm(MyForm)

// By field type (required)
const typeComponents: Record<string, Component> = {
  text: MyTextInput,
  password: MyTextInput,
  number: MyTextInput,
  select: MySelect,
  radio: MyRadio,
  checkbox: MyCheckbox,
  paragraph: MyParagraph,
  action: MyActionButton,
  object: MyObjectGroup,
  array: MyArrayList,
  union: MyUnion,
  tuple: MyTuple,
}

// By @foorm.component name (optional)
const namedComponents: Record<string, Component> = {
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

You don't need to include all type keys — only the ones your form actually uses. If a field's type has no matching entry, `OoField` shows an error: `[label] No component for type "X"`.

---

## Vue Composables

### `useFoormArray(field, disabled?)`

Manages array field state. Used by custom array components.

```ts
import { useFoormArray } from '@foormjs/vue'
import type { FoormArrayFieldDef } from '@foormjs/atscript'
import { isArrayField } from '@foormjs/atscript'

// Inside your custom array component:
const arrayField = isArrayField(props.field!) ? (props.field as FoormArrayFieldDef) : undefined

const {
  arrayValue,     // ComputedRef<unknown[]> — current items
  itemKeys,       // string[] (reactive) — stable keys for v-for
  getItemField,   // (index: number) => FoormFieldDef
  isUnion,        // boolean — items are union types?
  unionVariants,  // FoormUnionVariant[] — variants if union
  addItem,        // (variantIndex?: number) => void
  removeItem,     // (index: number) => void
  canAdd,         // ComputedRef<boolean> — respects @expect.maxLength
  canRemove,      // ComputedRef<boolean> — respects @expect.minLength
  addLabel,       // string — from @foorm.array.add.label
  removeLabel,    // string — from @foorm.array.remove.label
} = useFoormArray(arrayField!, computed(() => props.disabled ?? false))
```

### `useFoormUnion(props)`

Manages union variant state with data stashing. Used by custom union components.

```ts
import { useFoormUnion } from '@foormjs/vue'

const {
  unionField,           // ComputedRef<FoormUnionFieldDef | undefined>
  hasMultipleVariants,  // ComputedRef<boolean>
  localUnionIndex,      // Ref<number> — current variant index
  innerField,           // ComputedRef<FoormFieldDef | undefined>
  changeVariant,        // (newIndex: number) => void — switch variant
  optionalEnabled,      // ComputedRef<boolean>
  currentVariant,       // ComputedRef<FoormUnionVariant>
} = useFoormUnion(props)
```

**Data stashing:** When switching from variant A to B, `useFoormUnion` saves A's data in a stash. Switching back to A restores it. This lets users switch between variants without losing input.

### `useConsumeUnionContext()`

Reads the `__foorm_union` injection and immediately clears it (prevents nested children from inheriting it). Used by structural components (object, array, tuple, field shell) to read union context from a parent `OoUnion`.

```ts
import { useConsumeUnionContext } from '@foormjs/vue'

const unionCtx = useConsumeUnionContext()
// unionCtx?.variants — FoormUnionVariant[]
// unionCtx?.currentIndex — number
// unionCtx?.changeVariant — (index: number) => void
```

### `formatIndexedLabel(label, arrayIndex)`

Formats a label with an array index prefix. Returns `"Title #1"` for `arrayIndex=0`, or `"#1"` if no label.

```ts
import { formatIndexedLabel } from '@foormjs/vue'

formatIndexedLabel('Address', 0) // "Address #1"
formatIndexedLabel(undefined, 2)  // "#3"
formatIndexedLabel('Name', undefined)  // "Name"
```

---

## Helper Components

### `OoIterator`

Iterates `def.fields` and renders `<OoField>` per field. Used by object and tuple components.

```vue
<script setup lang="ts">
import { OoIterator } from '@foormjs/vue'
</script>

<template>
  <!-- Basic: iterate all fields from an object def -->
  <OoIterator :def="objectDef" />

  <!-- With path prefix (for array items) -->
  <OoIterator :def="objectDef" path-prefix="[0]" />

  <!-- With remove props (passed to child fields) -->
  <OoIterator
    :def="objectDef"
    :on-remove="onRemove"
    :can-remove="canRemove"
    :remove-label="removeLabel"
  />
</template>
```

### `createDefaultTypes()`

Returns a `TFoormTypeComponents` map pre-populated with all default type components. Useful as a starting point — override individual entries as needed:

```ts
import { createDefaultTypes } from '@foormjs/vue'
import type { TFoormTypeComponents } from '@foormjs/vue'

const types: TFoormTypeComponents = {
  ...createDefaultTypes(),
  text: MyCustomInput,       // override just the text field
  select: MyCustomSelect,    // override just the select
}
```

The default map includes: `text`, `password`, `number` → `OoInput`, `select` → `OoSelect`, `radio` → `OoRadio`, `checkbox` → `OoCheckbox`, `paragraph` → `OoParagraph`, `action` → `OoAction`, `object` → `OoObject`, `array` → `OoArray`, `union` → `OoUnion`, `tuple` → `OoTuple`.

### Internal Components (not exported)

The default type components use several internal building blocks that are **not** publicly exported. These are implementation details:

- **OoFieldShell** — label/description/hint/error wrapper with a11y used by leaf field defaults
- **OoStructuredHeader** — title + remove button + union variant picker used by container defaults
- **OoNoData** — placeholder for optional fields that aren't enabled
- **OoVariantPicker** — dropdown for switching union variants

When building custom components, you handle these concerns yourself (see the custom component examples above).

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
  <OoForm :def="def" :form-data="formData" :form-context="ctx" :types="typeComponents" @submit="onSubmit" />
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
  <OoForm :def="def" :form-data="formData" :errors="serverErrors" :types="typeComponents" @submit="handleSubmit" />
</template>
```

Errors are keyed by field path (e.g., `email`, `address.street`).

You can also set errors programmatically via slot scope:

```vue
<OoForm :def="def" :form-data="formData" :types="types" @submit="handleSubmit">
  <template #form.submit="{ text, disabled, setErrors, clearErrors }">
    <button type="submit" :disabled="disabled">{{ text }}</button>
    <button type="button" @click="clearErrors">Clear Errors</button>
  </template>
</OoForm>
```

`setErrors(errors)` takes `Record<string, string>` keyed by field path. `clearErrors()` removes all validation and external errors.

---

## Change Events

`OoForm` emits a `change` event whenever form data is modified — field updates, array mutations, or union variant switches.

```vue
<OoForm
  :def="def"
  :form-data="formData"
  :types="types"
  @change="onChange"
  @submit="onSubmit"
/>
```

```ts
import type { TFoormChangeType } from '@foormjs/vue'

function onChange(type: TFoormChangeType, path: string, value: unknown, formData: Record<string, unknown>) {
  console.log(type, path, value)
}
```

### Change Types

| Type             | When                                            | `path`            | `value`              |
| ---------------- | ----------------------------------------------- | ----------------- | -------------------- |
| `'update'`       | A field value changed (user input)              | Field path        | New value            |
| `'array-add'`    | An item was added to an array                   | Array field path  | New item value       |
| `'array-remove'` | An item was removed from an array               | Array field path  | Removed item value   |
| `'union-switch'` | A union variant was switched                    | Union field path  | New variant value    |

### Use Cases

- **Auto-save / dirty tracking**: Compare `formData` snapshots on each change
- **Conditional logic outside the form**: React to specific field changes in the parent component
- **Analytics**: Track which fields users interact with
- **Dependent fetches**: Load options from an API when a field changes

```ts
function onChange(type: TFoormChangeType, path: string, value: unknown) {
  if (type === 'update' && path === 'country') {
    // Fetch cities for selected country
    fetchCities(value as string).then(cities => {
      formContext.cityOptions = cities
    })
  }
}
```

---

## Form Validation

### Client-Side Validation

`OoForm` handles validation automatically on submit. When the user submits:

1. All registered fields are validated (ATScript `@expect.*` + `@foorm.validate` + `@meta.required`)
2. If all pass → emits `submit` with `formData`
3. If any fail → emits `error` with `{ path, message }[]` and shows errors on fields

```vue
<OoForm
  :def="def"
  :form-data="formData"
  :types="types"
  first-validation="on-blur"
  @submit="onSubmit"
  @error="onError"
/>
```

```ts
function onSubmit(data: Record<string, unknown>) {
  // All fields passed validation
  api.submit(data)
}

function onError(errors: { path: string; message: string }[]) {
  // Validation failed — errors are already shown on fields
  console.log('Validation errors:', errors)
}
```

### Validation Timing (`firstValidation`)

Controls when errors first appear for each field:

| Value              | Behavior                                                              |
| ------------------ | --------------------------------------------------------------------- |
| `'on-change'`     | Show errors immediately as the user types (default)                   |
| `'touched-on-blur'` | Show errors after the field loses focus, then update on each change |
| `'on-blur'`       | Only show/update errors when the field loses focus                    |
| `'on-submit'`     | No errors shown until the user submits the form                       |
| `'none'`          | Never show errors automatically (manual only)                         |

After the first submit, all fields show errors on change regardless of this setting.

### Standalone Validation (without OoForm)

Use `getFormValidator()` from `@foormjs/atscript` for headless validation (API routes, server-side, tests):

```ts
import { createFoormDef, getFormValidator } from '@foormjs/atscript'
import { MyForm } from './forms/my-form.as'

const def = createFoormDef(MyForm)
const validate = getFormValidator(def)

// Validate data
const errors = validate({ data: formData })
// errors: Record<string, string> — empty object = all passed

// With context
const errors = validate({ data: formData, context: { maxAge: 120 } })

// Check result
if (Object.keys(errors).length === 0) {
  // Valid — submit
} else {
  // errors = { email: 'Invalid email', 'address.city': 'Required' }
}
```

### Per-Field Validation

Use `createFieldValidator()` for validating individual fields:

```ts
import { createFieldValidator } from '@foormjs/atscript'

const validate = createFieldValidator(field.prop)
const result = validate(value, { data: formData, context })
// result: true (valid) or string (error message)
```

---

## Rendering Architecture

`OoForm` handles all field types through a unified `OoField` renderer. The component tree is:

```
OoForm (useFoormForm + form chrome)
  └── OoField(def.rootField) → types['object'] → OoObject
        └── OoIterator (iterates def.fields)
              ├── OoField (leaf) → types['text'] → OoInput / your component
              ├── OoField (object with @foorm.title) → types['object'] → OoObject
              │     └── OoIterator → OoField ...
              ├── OoField (array) → types['array'] → OoArray
              │     └── OoField (per item via useFoormArray) → ...
              ├── OoField (union) → types['union'] → OoUnion
              │     └── OoField (selected variant) → ...
              └── OoField (tuple) → types['tuple'] → OoTuple
                    └── OoField (per position) → ...
```

### OoField

Universal renderer. For each field:

1. Injects types/components from OoForm
2. Resolves component: `@foorm.component` → `components[name]`, else → `types[field.type]`
3. Resolves all field props (label, placeholder, disabled, etc.) — static or via `foorm.fn.*`
4. Tracks nesting level (`__foorm_level`: root object = 0, increments per nested object/array)
5. Renders via `<component :is="resolvedComponent" v-bind="componentProps" />`

Performance optimization: `allStatic` flag skips Vue `computed()` creation for fields with no `foorm.fn.*` annotations.

### Remove Button Responsibility

The remove button for array items is **not** a standalone component. Instead, it is the responsibility of the wrapping component:

- **Object array items**: The object component receives `onRemove`, `canRemove`, and `removeLabel` as props.
- **Primitive array items**: The field component (e.g., text input) receives `onRemove`, `canRemove`, and `removeLabel` as props (since there is no object wrapper around them).

If you don't render the remove button, users won't be able to remove items from the array.

---

## Provide/Inject Keys

Set by `OoForm` and consumed by child components:

| Key                       | Type                                    | Set By                | Used By                          |
| ------------------------- | --------------------------------------- | --------------------- | -------------------------------- |
| `__foorm_form`            | `TFoormState`                           | `OoForm`              | `internal composables`, `OoField`     |
| `__foorm_form_data`       | `ComputedRef<TFormData>`                | `OoForm`              | `useFoormField`                  |
| `__foorm_form_context`    | `ComputedRef<TContext>`                 | `OoForm`              | `internal composables`                |
| `__foorm_root_data`       | `ComputedRef<TFormData>`                | `OoForm`              | `internal composables`                |
| `__foorm_path_prefix`     | `ComputedRef<string>`                   | `OoForm`, `OoField`   | `internal composables`, `OoIterator`  |
| `__foorm_types`           | `Record<string, Component>`             | `OoForm`              | `OoField`                        |
| `__foorm_components`      | `Record<string, Component>`             | `OoForm`              | `OoField`                        |
| `__foorm_errors`          | `Record<string, string>`                | `OoForm`              | `OoField`                        |
| `__foorm_action_handler`  | `(name, data) => void`                  | `OoForm`              | `OoAction`                       |
| `__foorm_change_handler`  | `(type, path, value) => void`           | `OoForm`              | `OoField`, `useFoormArray`, `useFoormUnion` |
| `__foorm_level`           | `number`                                | `OoField`             | `OoField` (children)             |
| `__foorm_union`           | `TFoormUnionContext`                    | `useFoormUnion`       | `useConsumeUnionContext`         |
