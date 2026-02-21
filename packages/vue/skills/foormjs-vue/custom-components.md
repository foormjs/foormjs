# Creating Custom Components — @foormjs/vue

> The `TFoormComponentProps` contract, responsibility matrix for each field kind, and complete examples aligned with the default components.

## Concepts

Every component in the `types` and `components` maps receives the same `TFoormComponentProps` interface from OoField. Your component's job depends on the **field kind** it handles:

- **Leaf fields** (text, select, radio, checkbox) — render input + label + error + hint + description + remove button
- **Structural fields** (object, array, tuple) — render title + iterator/items + remove button + optional N/A
- **Union field** — manage variant state + render inner variant field
- **Phantom fields** (paragraph, action) — render display-only content, no model binding

## Component Responsibility Matrix

This table shows what each type-component is responsible for rendering. The default components handle all of these — your custom components must too.

| Responsibility                 | text/select/radio/checkbox        | object                            | array                                 | union                             | tuple                             | paragraph | action               |
| ------------------------------ | --------------------------------- | --------------------------------- | ------------------------------------- | --------------------------------- | --------------------------------- | --------- | -------------------- |
| **Label**                      | Yes                               | No (renders title instead)        | No (renders title instead)            | No                                | No (renders title instead)        | No        | No                   |
| **Title** (`@foorm.title`)     | No                                | Yes (h2 at root, h3 nested)       | Yes                                   | No                                | Yes                               | No        | No                   |
| **Description**                | Yes                               | No                                | No                                    | No                                | No                                | No        | No                   |
| **Hint**                       | Yes                               | No                                | No                                    | No                                | No                                | No        | No                   |
| **Error message**              | Yes                               | Yes (structural error)            | Yes (array-level error)               | No                                | Yes (tuple-level error)           | No        | No                   |
| **Remove/clear button**        | Yes (array item + optional clear) | Yes (array item + optional clear) | No                                    | No                                | Yes (array item + optional clear) | No        | No                   |
| **Variant picker**             | Yes (inline next to label)        | Yes (inline in header)            | Yes (in header)                       | No (provides context only)        | Yes (inline in header)            | No        | No                   |
| **Optional N/A toggle**        | Yes                               | Yes                               | Yes                                   | Yes                               | Yes                               | No        | No                   |
| **OoIterator**                 | No                                | Yes (for sub-fields)              | No (manual v-for)                     | No                                | No (manual v-for)                 | No        | No                   |
| **OoField children**           | No                                | No (OoIterator does it)           | Yes (per array item)                  | Yes (inner variant)               | Yes (per position)                | No        | No                   |
| **Change event**               | No (OoField handles on blur)      | No                                | Yes (array-add/remove via composable) | Yes (union-switch via composable) | No                                | No        | No                   |
| **Action event**               | No                                | No                                | No                                    | No                                | No                                | No        | Yes (emits `action`) |
| **`useConsumeUnionContext()`** | **Yes**                           | **Yes**                           | **Yes**                               | No                                | **Yes**                           | No        | No                   |
| **`v-show="!hidden"`**         | Yes                               | Yes                               | Yes                                   | Yes                               | Yes                               | Yes       | Yes                  |

### Key rules

- **Every component** must handle `v-show="!hidden"` for dynamic visibility.
- **Leaf components** handle ALL display chrome: label, description, hint, error, remove button, variant picker, optional N/A.
- **ALL non-phantom components** (leaf AND structural) must call `useConsumeUnionContext()`. This reads and clears the `__foorm_union` context so children don't inherit it. The return value tells you whether to render a variant picker.
- **The variant picker** is rendered by whichever component is the direct child of a union. When a primitive is a union variant (e.g., `string | { name: string }`), the **leaf component** (text input) renders the picker inline next to its label. When an object is a union variant, the **object component** renders it in its header.
- **The remove/clear button** serves two purposes: removing an array item (`onRemove`) and clearing an optional field to N/A state (`onToggleOptional(false)`). Both are the component's responsibility (not OoField's). If a text input appears as a primitive array item, the text component renders the remove button. Same component shows the × clear button when the field is optional.
- **Change events** for field value updates are handled by OoField (on blur). Array and union composables emit their own change events (`array-add`, `array-remove`, `union-switch`).

## The TFoormComponentProps Interface

```ts
import type { TFoormComponentProps } from '@foormjs/vue'

const props = defineProps<TFoormComponentProps<string>>() // generic = value type
```

| Prop               | Type                          | Used by                                            |
| ------------------ | ----------------------------- | -------------------------------------------------- |
| `model`            | `{ value: V }`                | Leaf fields — bind with `v-model="model.value"`    |
| `value`            | `unknown?`                    | Phantom fields — display value from `@foorm.value` |
| `onBlur`           | `() => void`                  | Leaf fields — triggers validation                  |
| `error`            | `string?`                     | All non-phantom — validation error message         |
| `label`            | `string?`                     | Leaf fields — field label                          |
| `description`      | `string?`                     | Leaf fields — field description                    |
| `hint`             | `string?`                     | Leaf fields — hint text below input                |
| `placeholder`      | `string?`                     | Leaf fields — input placeholder                    |
| `disabled`         | `boolean?`                    | All — disabled state                               |
| `hidden`           | `boolean?`                    | All — controls `v-show`                            |
| `readonly`         | `boolean?`                    | Leaf fields — read-only state                      |
| `optional`         | `boolean?`                    | All — whether the field is optional                |
| `required`         | `boolean?`                    | Leaf fields — whether required                     |
| `type`             | `string`                      | All — the field type string                        |
| `options`          | `TFoormEntryOptions[]?`       | select, radio — resolved options                   |
| `maxLength`        | `number?`                     | text — max length constraint                       |
| `autocomplete`     | `string?`                     | text — HTML autocomplete value                     |
| `altAction`        | `TFoormAltAction?`            | action — `{ id, label }`                           |
| `name`             | `string?`                     | Leaf fields — field name                           |
| `field`            | `FoormFieldDef?`              | Structural/union — access extended properties      |
| `title`            | `string?`                     | object, array, tuple — section title               |
| `level`            | `number?`                     | object, array, tuple — nesting depth (0 = root)    |
| `class`            | `string \| object?`           | All — CSS classes from `@foorm.fn.classes`         |
| `style`            | `string \| object?`           | All — inline styles from `@foorm.fn.styles`        |
| `onRemove`         | `() => void?`                 | Leaf/object/tuple in arrays — remove callback      |
| `canRemove`        | `boolean?`                    | Same — whether removal is allowed                  |
| `removeLabel`      | `string?`                     | Same — remove button label                         |
| `arrayIndex`       | `number?`                     | Items in arrays — zero-based index                 |
| `onToggleOptional` | `(enabled: boolean) => void?` | All optional — enable/disable toggle               |

## Leaf Field Components

Leaf components handle ALL display responsibilities: label, description, hint, error, optional N/A, remove button, **and variant picker** (when inside a union).

### Best practice: Create a reusable field shell

The default components (OoInput, OoSelect, OoRadio, OoCheckbox) all delegate their chrome to an internal `OoFieldShell` wrapper — which is NOT exported. The recommended approach for custom components is the same: **create your own reusable shell** that handles the shared responsibilities once, then each leaf component only provides the input element.

This is the pattern the defaults use, and it keeps every leaf component trivially simple.

#### `FieldShell.vue` — Reusable wrapper for all your leaf components

```vue
<script setup lang="ts">
import type { TFoormComponentProps, TFoormUnionContext } from '@foormjs/vue'
import { useConsumeUnionContext, formatIndexedLabel } from '@foormjs/vue'
import { computed, useId } from 'vue'

const props = defineProps<TFoormComponentProps & { idPrefix?: string }>()

// ── Accessibility IDs ──
const id = useId()
const prefix = props.idPrefix ?? 'field'
const inputId = `${prefix}-${id}`
const errorId = `${prefix}-${id}-err`
const descId = `${prefix}-${id}-desc`

// ── Union context (reads & clears — prevents leak to children) ──
const unionCtx: TFoormUnionContext | undefined = useConsumeUnionContext()
const hasVariantPicker = unionCtx !== undefined && unionCtx.variants.length > 1

// ── Display label with array index: "Name #1", "Name #2" ──
const displayLabel = computed(() => formatIndexedLabel(props.label, props.arrayIndex))
const optionalEnabled = computed(() => props.model?.value !== undefined)
</script>

<template>
  <div class="field" v-show="!hidden">
    <!-- Header row: label/custom header on left, action buttons on right -->
    <div
      v-if="
        displayLabel ||
        onRemove ||
        (optional && optionalEnabled) ||
        hasVariantPicker ||
        $slots.header
      "
      class="field-header"
    >
      <div class="field-header-content">
        <!-- Allow override for radio/checkbox custom header layout -->
        <template v-if="$slots.header">
          <slot
            name="header"
            :input-id="inputId"
            :desc-id="descId"
            :optional-enabled="optionalEnabled"
          />
        </template>
        <template v-else>
          <label v-if="displayLabel" :for="inputId">{{ displayLabel }}</label>
          <span v-if="description" :id="descId">{{ description }}</span>
        </template>

        <!-- Variant picker (when this field is a direct child of a union) -->
        <div v-if="hasVariantPicker" class="variant-picker">
          <button
            v-for="(v, vi) in unionCtx!.variants"
            :key="vi"
            type="button"
            :class="{ active: vi === unionCtx!.currentIndex.value }"
            @click="unionCtx!.changeVariant(vi)"
          >
            {{ v.label }}
          </button>
        </div>
      </div>

      <div v-if="(optional && optionalEnabled) || onRemove" class="field-actions">
        <button v-if="optional && optionalEnabled" type="button" @click="onToggleOptional?.(false)">
          &times;
        </button>
        <button v-if="onRemove" type="button" :disabled="!canRemove" @click="onRemove">
          {{ removeLabel || 'Remove' }}
        </button>
      </div>
    </div>

    <!-- Optional N/A state -->
    <template v-if="optional && !optionalEnabled">
      <div class="no-data" @click="onToggleOptional?.(true)">No Data — Click to Edit</div>
    </template>
    <template v-else>
      <!-- Input slot — each leaf component provides its input here -->
      <slot :input-id="inputId" :error-id="errorId" :desc-id="descId" />
      <!-- Extra slot for checkbox description, etc. -->
      <slot name="after-input" :desc-id="descId" />
      <!-- Error or hint -->
      <div :id="errorId" v-if="error || hint" :role="error ? 'alert' : undefined">
        {{ error || hint }}
      </div>
    </template>
  </div>
</template>
```

**What this handles (so leaf components don't have to):**

- `useConsumeUnionContext()` — reads and clears union context
- Variant picker rendering (inline next to label)
- Label with array index formatting (`formatIndexedLabel`)
- Description display
- Remove button (when in array)
- Optional clear button + N/A state
- Error/hint display
- Accessibility IDs (`inputId`, `errorId`, `descId`)
- `v-show="!hidden"`

### Custom Text Input (`text` / `password` / `number`)

With the shell, each leaf component only provides its input element:

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
import FieldShell from './FieldShell.vue'

defineProps<TFoormComponentProps<string>>()
</script>

<template>
  <FieldShell v-bind="$props" id-prefix="input">
    <template #default="{ inputId, errorId, descId }">
      <input
        :id="inputId"
        v-model="model.value"
        @blur="onBlur"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxLength"
        :autocomplete="autocomplete"
        :name="name"
        :aria-required="required || undefined"
        :aria-invalid="!!error || undefined"
        :aria-describedby="error || hint ? errorId : description ? descId : undefined"
      />
    </template>
  </FieldShell>
</template>
```

Compare this with the default `OoInput` — the structure is identical: `v-bind="$props"` passes all foorm props to the shell, and the default slot receives accessibility IDs for the input element.

### Custom Select (`select`)

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
import { optKey, optLabel } from '@foormjs/atscript'
import FieldShell from './FieldShell.vue'

defineProps<TFoormComponentProps<string>>()
</script>

<template>
  <FieldShell v-bind="$props" id-prefix="select">
    <template #default="{ inputId, errorId, descId }">
      <select
        :id="inputId"
        v-model="model.value"
        @change="onBlur"
        @blur="onBlur"
        :disabled="disabled"
        :name="name"
        :aria-required="required || undefined"
        :aria-invalid="!!error || undefined"
        :aria-describedby="error || hint ? errorId : description ? descId : undefined"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="opt in options" :key="optKey(opt)" :value="optKey(opt)">
          {{ optLabel(opt) }}
        </option>
      </select>
    </template>
  </FieldShell>
</template>
```

Import `optKey`/`optLabel` from `@foormjs/atscript` — options can be `string` or `{ key, label }`.

### Custom Radio Group (`radio`)

Radio uses the `#header` slot to render its own label + description layout (label as `<span>` instead of `<label :for>`, since the group uses `role="radiogroup"`):

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
import { optKey, optLabel } from '@foormjs/atscript'
import FieldShell from './FieldShell.vue'

defineProps<TFoormComponentProps<string>>()
</script>

<template>
  <FieldShell v-bind="$props" id-prefix="radio">
    <template #header="{ inputId, descId }">
      <span :id="inputId" class="label">{{ label }}</span>
      <span v-if="description" :id="descId">{{ description }}</span>
    </template>
    <template #default="{ inputId, errorId, descId }">
      <div
        role="radiogroup"
        :aria-labelledby="inputId"
        :aria-required="required || undefined"
        :aria-invalid="!!error || undefined"
        :aria-describedby="error || hint ? errorId : description ? descId : undefined"
      >
        <label v-for="opt in options" :key="optKey(opt)">
          <input
            type="radio"
            :value="optKey(opt)"
            v-model="model.value"
            @change="onBlur"
            @blur="onBlur"
            :name="name"
            :disabled="disabled"
          />
          {{ optLabel(opt) }}
        </label>
      </div>
    </template>
  </FieldShell>
</template>
```

### Custom Checkbox (`checkbox`)

Checkbox uses `#header` for the optional-only label and `#after-input` for description placement:

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
import FieldShell from './FieldShell.vue'

defineProps<TFoormComponentProps<boolean>>()
</script>

<template>
  <FieldShell v-bind="$props" id-prefix="checkbox">
    <template #header="{ optionalEnabled }">
      <span v-if="optional && !optionalEnabled" class="label">{{ label }}</span>
    </template>
    <template #default="{ inputId, errorId, descId }">
      <label :for="inputId">
        <input
          :id="inputId"
          type="checkbox"
          :checked="!!model.value"
          @change="
            model.value = ($event.target as HTMLInputElement).checked
            onBlur()
          "
          @blur="onBlur"
          :name="name"
          :disabled="disabled"
          :aria-invalid="!!error || undefined"
          :aria-describedby="error || hint ? errorId : description ? descId : undefined"
        />
        {{ label }}
      </label>
    </template>
    <template #after-input="{ descId }">
      <span v-if="description" :id="descId">{{ description }}</span>
    </template>
  </FieldShell>
</template>
```

## Structural Field Components

Structural components render a **title** (not label), iterate sub-fields, and handle the remove button for when they appear inside arrays. They must call `useConsumeUnionContext()`.

### Custom Object (`object`)

**Responsibilities:** title, sub-field iteration via OoIterator, remove button, variant picker (from union context), optional N/A, error.

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
import type { FoormObjectFieldDef } from '@foormjs/atscript'
import { isObjectField } from '@foormjs/atscript'
import { OoIterator, useConsumeUnionContext, formatIndexedLabel } from '@foormjs/vue'
import { computed } from 'vue'

const props = defineProps<TFoormComponentProps>()

// Access nested form definition
const objectDef = isObjectField(props.field!)
  ? (props.field as FoormObjectFieldDef).objectDef
  : undefined

// MUST call — clears union context so children don't inherit it
const unionCtx = useConsumeUnionContext()

// Format title with array index: "Address #1", "Address #2"
const displayTitle = computed(() => formatIndexedLabel(props.title, props.arrayIndex))
const optionalEnabled = computed(() => props.model?.value !== undefined)
</script>

<template>
  <div class="object-group" v-show="!hidden">
    <!-- Header: title + variant picker + remove button -->
    <div v-if="displayTitle || onRemove || unionCtx" class="object-header">
      <component :is="level === 0 ? 'h2' : 'h3'" v-if="displayTitle">{{ displayTitle }}</component>

      <!-- Variant picker (when inside a union with multiple variants) -->
      <div v-if="unionCtx && unionCtx.variants.length > 1" class="variant-picker">
        <button
          v-for="(v, vi) in unionCtx.variants"
          :key="vi"
          :class="{ active: vi === unionCtx.currentIndex.value }"
          @click="unionCtx.changeVariant(vi)"
          type="button"
        >
          {{ v.label }}
        </button>
      </div>

      <!-- Optional clear button -->
      <button v-if="optional && optionalEnabled" type="button" @click="onToggleOptional?.(false)">
        &times;
      </button>
      <!-- Remove button (when this object is an array item) -->
      <button v-if="onRemove" type="button" :disabled="!canRemove" @click="onRemove">
        {{ removeLabel || 'Remove' }}
      </button>
    </div>

    <!-- Optional N/A state -->
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

### Custom Array (`array`)

**Responsibilities:** title, item rendering via OoField (NOT OoIterator), add button (with variant dropdown for unions), remove button passed to items, optional N/A, error. Change events (`array-add`/`array-remove`) are handled by the `useFoormArray` composable.

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
import type { FoormArrayFieldDef } from '@foormjs/atscript'
import { isArrayField } from '@foormjs/atscript'
import { OoField, useFoormArray, useConsumeUnionContext } from '@foormjs/vue'
import { computed } from 'vue'

const props = defineProps<TFoormComponentProps>()

const arrayField = isArrayField(props.field!) ? (props.field as FoormArrayFieldDef) : undefined

// MUST call — clears union context
const unionCtx = useConsumeUnionContext()

const optionalEnabled = computed(() => Array.isArray(props.model?.value))

// useFoormArray manages all array state + emits array-add/array-remove change events
const {
  arrayValue, // ComputedRef<unknown[]> — current items
  itemKeys, // string[] — stable v-for keys
  getItemField, // (index) => FoormFieldDef — field def per item
  isUnion, // boolean — items are union type?
  unionVariants, // FoormUnionVariant[] — variants (if union)
  addItem, // (variantIndex?) => void — add new item
  removeItem, // (index) => void — remove item
  canAdd, // ComputedRef<boolean> — respects @expect.maxLength
  canRemove, // ComputedRef<boolean> — respects @expect.minLength
  addLabel, // string — from @foorm.array.add.label
  removeLabel: arrayRemoveLabel, // string — from @foorm.array.remove.label
} = useFoormArray(
  arrayField!,
  computed(() => props.disabled ?? false)
)
</script>

<template>
  <div class="array-field" v-show="!hidden">
    <!-- Title -->
    <component :is="level === 0 ? 'h2' : 'h3'" v-if="title">{{ title }}</component>

    <!-- Optional N/A state -->
    <template v-if="optional && !optionalEnabled">
      <div class="no-data" @click="onToggleOptional?.(true)">No Data — Click to Edit</div>
    </template>
    <template v-else>
      <!-- Render each item as OoField — pass remove props -->
      <OoField
        v-for="(_item, i) in arrayValue"
        :key="itemKeys[i]"
        :field="getItemField(i)"
        :on-remove="() => removeItem(i)"
        :can-remove="canRemove"
        :remove-label="arrayRemoveLabel"
        :array-index="i"
      />

      <!-- Add button: simple for non-union, variant dropdown for union -->
      <div v-if="!isUnion">
        <button type="button" :disabled="!canAdd" @click="addItem(0)">
          {{ addLabel }}
        </button>
      </div>
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

### Custom Tuple (`tuple`)

**Responsibilities:** title, fixed-length item rendering via OoField, remove button, variant picker (from union context), optional N/A, error.

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
import type { FoormTupleFieldDef } from '@foormjs/atscript'
import { isTupleField } from '@foormjs/atscript'
import { OoField, useConsumeUnionContext, formatIndexedLabel } from '@foormjs/vue'
import { computed } from 'vue'

const props = defineProps<TFoormComponentProps>()

const tupleField = isTupleField(props.field!) ? (props.field as FoormTupleFieldDef) : undefined

// MUST call — clears union context
const unionCtx = useConsumeUnionContext()
const optionalEnabled = computed(() => props.model?.value !== undefined)
const displayTitle = computed(() => formatIndexedLabel(props.title, props.arrayIndex))
</script>

<template>
  <div class="tuple-field" v-show="!hidden">
    <div v-if="displayTitle || onRemove" class="tuple-header">
      <component :is="level === 0 ? 'h2' : 'h3'" v-if="displayTitle">{{ displayTitle }}</component>
      <button v-if="onRemove" type="button" :disabled="!canRemove" @click="onRemove">
        {{ removeLabel || 'Remove' }}
      </button>
    </div>

    <template v-if="optional && !optionalEnabled">
      <div class="no-data" @click="onToggleOptional?.(true)">No Data — Click to Edit</div>
    </template>
    <template v-else>
      <!-- Fixed-length: one OoField per position -->
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

## Union Component

**Responsibilities:** variant state management via `useFoormUnion`, provides `__foorm_union` context for children (so the inner object/tuple can render an inline variant picker), renders inner variant as OoField, optional N/A. Does NOT render label, title, remove button, or variant picker directly — it **provides** the context and the inner field handles those.

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
import { OoField, useFoormUnion } from '@foormjs/vue'

const props = defineProps<TFoormComponentProps>()

// useFoormUnion manages variant state + provides __foorm_union context + emits union-switch
const {
  unionField, // ComputedRef<FoormUnionFieldDef | undefined>
  hasMultipleVariants, // ComputedRef<boolean>
  localUnionIndex, // Ref<number> — current variant index
  innerField, // ComputedRef<FoormFieldDef | undefined>
  changeVariant, // (newIndex) => void — switch variant (stashes data)
  optionalEnabled, // ComputedRef<boolean>
} = useFoormUnion(props)
</script>

<template>
  <div class="union-field" v-show="!hidden">
    <!-- Optional N/A state -->
    <template v-if="optional && !optionalEnabled">
      <div class="no-data" @click="onToggleOptional?.(true)">No Data — Click to Edit</div>
    </template>
    <template v-else>
      <!-- Optional clear button -->
      <button v-if="optional" type="button" @click="onToggleOptional?.(false)">&times;</button>

      <!-- Render the selected variant — `:key` forces re-render on switch -->
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

**Why no variant picker here?** The union provides `__foorm_union` context. The child component (object, tuple, or leaf field) consumes it via `useConsumeUnionContext()` and renders the variant picker inline in its header. This avoids double-rendering the picker at both the union and child level.

## Phantom Field Components

No model binding, no validation, no label/error/hint. Simple display-only.

### Custom Paragraph (`paragraph`)

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
const props = defineProps<TFoormComponentProps>()
</script>

<template>
  <p v-show="!hidden" aria-live="polite">{{ value }}</p>
</template>
```

Use `value` (not `model.value`) — comes from `@foorm.value` or `@foorm.fn.value`.

### Custom Action Button (`action`)

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
const props = defineProps<TFoormComponentProps<never>>()
const emit = defineEmits<{ (e: 'action', name: string): void }>()
</script>

<template>
  <div v-show="!hidden">
    <button type="button" :disabled="disabled" @click="altAction && emit('action', altAction.id)">
      {{ altAction?.label }}
    </button>
  </div>
</template>
```

The emitted `action` event is caught by OoField and forwarded to OoForm's `action`/`unsupported-action` event.

## Best Practices

- **Create a reusable field shell for leaf components** — handle `useConsumeUnionContext()`, variant picker, label, description, error/hint, remove button, and optional N/A in one place. Each leaf component then only provides the input element via a slot. This mirrors how the defaults work with the internal OoFieldShell.
- Always handle `v-show="!hidden"` in every component (the shell handles it for leaf fields)
- Always handle `onRemove`/`canRemove`/`removeLabel` (array removal) and `onToggleOptional` (optional clear to N/A) in leaf and object/tuple components — if you skip it, users can't remove array items or clear optional fields
- Always call `useConsumeUnionContext()` in ALL non-phantom components (leaf AND structural) — it reads and clears the union context. For leaf fields, the return value tells you whether to render an inline variant picker
- Call `onBlur()` on blur events in leaf fields — without it, `'on-blur'` and `'touched-on-blur'` validation never triggers
- Use `optKey()`/`optLabel()` from `@foormjs/atscript` for option handling in select/radio
- Use `formatIndexedLabel()` from `@foormjs/vue` for array item titles in structural components
- Use type guards (`isObjectField`, `isArrayField`, `isUnionField`, `isTupleField`) before accessing extended field properties

## Gotchas

- `model` is `{ value: V }` (a wrapper object), not a Vue ref — use `model.value` for binding
- `value` (without model) is for phantom fields only (paragraph, action)
- Change events for leaf fields are emitted by OoField on blur — your component does NOT need to emit them
- Array and union change events are emitted by `useFoormArray`/`useFoormUnion` composables — your component does NOT emit them directly
- `onBlur` must be called for validation timing — the default OoSelect calls it on both `@change` and `@blur`
- `arrayIndex` is zero-based but `formatIndexedLabel` displays one-based (#1, #2)
- Union components pass through `onRemove`/`canRemove`/`removeLabel`/`arrayIndex` to the inner OoField — the inner component renders the remove button, not the union
