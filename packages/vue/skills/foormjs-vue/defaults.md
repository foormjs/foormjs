# Default Components — @foormjs/vue

> Built-in field components, what each renders, internal helpers, and how to use or override them.

## Using Default Components

### Option 1: Use `createDefaultTypes()` for all defaults

```ts
import { createDefaultTypes } from '@foormjs/vue'

const types = createDefaultTypes()
```

### Option 2: Spread and override specific types

```ts
import { createDefaultTypes } from '@foormjs/vue'
import MyInput from './components/MyInput.vue'
import MySelect from './components/MySelect.vue'

const types = { ...createDefaultTypes(), text: MyInput, select: MySelect }
```

### Option 3: Build from scratch (full control)

```ts
import type { TFoormTypeComponents } from '@foormjs/vue'
import {
  OoInput,
  OoSelect,
  OoRadio,
  OoCheckbox,
  OoParagraph,
  OoAction,
  OoObject,
  OoArray,
  OoUnion,
  OoTuple,
} from '@foormjs/vue'

const types: TFoormTypeComponents = {
  text: OoInput,
  password: OoInput,
  number: OoInput,
  select: OoSelect,
  radio: OoRadio,
  checkbox: OoCheckbox,
  paragraph: OoParagraph,
  action: OoAction,
  object: OoObject,
  array: OoArray,
  union: OoUnion,
  tuple: OoTuple,
}
```

### Option 4: Add custom type keys

```ts
const types = { ...createDefaultTypes(), textarea: MyTextarea, date: MyDatePicker }
```

Use `@foorm.type 'textarea'` or `@foorm.type 'date'` in the schema to route to your component.

### Option 5: Per-field named component override

Use `@foorm.component` in the schema + `components` prop on OoForm:

```
// schema.as — @foorm.component takes priority over @foorm.type / auto-inferred type
@foorm.component 'StarRating'
rating?: number
```

```vue
<OoForm :types="types" :components="{ StarRating: MyStarRating }" ... />
```

## Default Type-to-Component Map

| Type key    | Component   | Schema trigger                         |
| ----------- | ----------- | -------------------------------------- |
| `text`      | OoInput     | `string` fields (default)              |
| `password`  | OoInput     | `@foorm.type 'password'`               |
| `number`    | OoInput     | `number` fields                        |
| `select`    | OoSelect    | `foorm.select` primitive               |
| `radio`     | OoRadio     | `foorm.radio` primitive                |
| `checkbox`  | OoCheckbox  | `boolean` / `foorm.checkbox`           |
| `paragraph` | OoParagraph | `foorm.paragraph` phantom              |
| `action`    | OoAction    | `foorm.action` phantom                 |
| `object`    | OoObject    | nested objects / `@foorm.title` groups |
| `array`     | OoArray     | `type[]` arrays                        |
| `union`     | OoUnion     | union types (`A \| B`)                 |
| `tuple`     | OoTuple     | tuple types `[A, B]`                   |

## Responsibility Matrix — What Each Default Handles

|                         | OoInput/Select/Radio/Checkbox             | OoObject               | OoArray                               | OoUnion              | OoTuple                | OoParagraph | OoAction       |
| ----------------------- | ----------------------------------------- | ---------------------- | ------------------------------------- | -------------------- | ---------------------- | ----------- | -------------- |
| **Label**               | via OoFieldShell                          | —                      | —                                     | —                    | —                      | —           | —              |
| **Title**               | —                                         | OoStructuredHeader     | OoStructuredHeader                    | —                    | OoStructuredHeader     | —           | —              |
| **Description**         | via OoFieldShell                          | —                      | —                                     | —                    | —                      | —           | —              |
| **Hint**                | via OoFieldShell                          | —                      | —                                     | —                    | —                      | —           | —              |
| **Error**               | via OoFieldShell                          | inline div             | inline div                            | —                    | inline div             | —           | —              |
| **Remove/clear button** | via OoFieldShell                          | OoStructuredHeader     | —                                     | —                    | OoStructuredHeader     | —           | —              |
| **Variant picker**      | via OoFieldShell                          | OoStructuredHeader     | OoStructuredHeader                    | — (provides context) | OoStructuredHeader     | —           | —              |
| **Optional N/A**        | via OoFieldShell (OoNoData)               | OoNoData               | OoNoData                              | OoNoData             | OoNoData               | —           | —              |
| **Sub-field iteration** | —                                         | OoIterator             | OoField per item                      | OoField (inner)      | OoField per pos        | —           | —              |
| **Composables**         | useConsumeUnionContext (via OoFieldShell) | useConsumeUnionContext | useFoormArray, useConsumeUnionContext | useFoormUnion        | useConsumeUnionContext | —           | —              |
| **Change events**       | — (OoField handles)                       | —                      | via useFoormArray                     | via useFoormUnion    | —                      | —           | emits `action` |

## Default Component Details

### OoInput (text, password, number)

Wraps `<input>` in OoFieldShell. The `type` prop determines the HTML input type.

- **Label/description/hint/error:** Delegated to OoFieldShell
- **Remove button:** Delegated to OoFieldShell (renders when `onRemove` provided)
- **Optional N/A:** Delegated to OoFieldShell
- **Variant picker:** Delegated to OoFieldShell (renders inline if union context present)
- **Bindings:** `v-model` on input, `@blur` → `onBlur`
- **Accessibility:** `aria-required`, `aria-invalid`, `aria-describedby` (via OoFieldShell)

### OoSelect

Wraps `<select>` with `<option>` per entry in OoFieldShell.

- **All chrome:** Delegated to OoFieldShell (same as OoInput)
- **Options:** Uses `optKey()`/`optLabel()` from `@foormjs/atscript`
- **Placeholder:** Disabled first `<option>` when `placeholder` prop present
- **Bindings:** `v-model` on select, `@change` and `@blur` both call `onBlur`

### OoRadio

Wraps radio group in OoFieldShell with custom header slot.

- **All chrome:** Delegated to OoFieldShell
- **Custom header:** Renders label + description in OoFieldShell's `#header` slot (not as default label)
- **Radios:** `v-for` over options, grouped by `name` prop, `role="radiogroup"`

### OoCheckbox

Wraps checkbox in OoFieldShell with custom header slot.

- **All chrome:** Delegated to OoFieldShell
- **Custom header:** Renders label only when optional && not enabled (in `#header` slot)
- **Label:** Wraps checkbox input for click area
- **Description:** In `#after-input` slot (after the checkbox label)
- **Binding:** `:checked` + `@change` manual update + `onBlur()`

### OoParagraph (phantom)

Simple `<p>` tag displaying `value` prop. No OoFieldShell, no model, no validation. Respects `v-show="!hidden"`.

### OoAction (phantom)

Button that emits `action` event with `altAction.id`. No OoFieldShell, no model, no validation. OoField catches the `action` emit and forwards to OoForm.

### OoObject

Container for nested object fields.

- **Title:** OoStructuredHeader (h2 at level 0, h3 at deeper levels)
- **Remove button:** OoStructuredHeader (when `onRemove` provided)
- **Variant picker:** OoStructuredHeader (when union context has multiple variants)
- **Optional N/A:** OoNoData placeholder
- **Sub-fields:** OoIterator with the nested `objectDef`
- **Composables:** `useConsumeUnionContext()` — reads and clears union context
- **Array index:** `formatIndexedLabel()` for titles like "Address #1"

### OoArray

List container with add/remove buttons.

- **Title:** OoStructuredHeader
- **Items:** `<OoField>` per item (NOT OoIterator) with stable keys from `useFoormArray`
- **Remove:** Passed as `onRemove` prop to each item's OoField
- **Add button:** Simple button for scalar items; dropdown with variant options for union items (via `useDropdown()`)
- **Variant picker:** OoStructuredHeader (when union context present)
- **Optional N/A:** OoNoData placeholder
- **Composables:** `useFoormArray()` (manages state + emits `array-add`/`array-remove`), `useConsumeUnionContext()`, `useDropdown()`
- **Constraints:** `canAdd` respects `@expect.maxLength`, `canRemove` respects `@expect.minLength`

### OoUnion

Variant selector that provides context to children.

- **Variant management:** `useFoormUnion()` — manages variant index, data stashing (saves/restores data on switch)
- **Provides:** `__foorm_union` context `{ variants, currentIndex, changeVariant }` — consumed by the inner field's component (object/tuple renders variant picker in its header)
- **Inner field:** Renders `<OoField :key="localUnionIndex">` for the selected variant
- **Optional N/A:** OoNoData with variant picker dropdown for multiple variants
- **Does NOT render:** title, label, variant picker, remove button (delegates all to inner field)
- **Passes through:** `onRemove`/`canRemove`/`removeLabel`/`arrayIndex` to the inner OoField

### OoTuple

Fixed-length field list.

- **Title:** OoStructuredHeader
- **Items:** `<OoField>` per position from `tupleField.itemFields` (fixed count, no add/remove)
- **Remove button:** OoStructuredHeader (when `onRemove` provided)
- **Variant picker:** OoStructuredHeader (when union context present)
- **Optional N/A:** OoNoData placeholder
- **Composables:** `useConsumeUnionContext()`

## Internal Components (Not Exported)

Used by default components. Custom components must handle these responsibilities themselves.

### OoFieldShell

Wrapper for leaf field components. Provides:

- Header row: label + required indicator + optional clear button + remove button
- Inline variant picker (when `__foorm_union` context exists with multiple variants)
- Optional N/A state (OoNoData)
- Input slot for the actual element
- Error/hint display
- Accessibility IDs: `inputId`, `errorId`, `descId`
- Slots: `#header`, `#default` (input), `#after-input`

### OoStructuredHeader

Header for structural components (object, array, tuple). Provides:

- Title: `<h2>` at level 0, `<h3>` at deeper levels
- Inline variant picker (OoVariantPicker) when union context has multiple variants
- Optional clear button
- Remove button (when `onRemove` provided)
- Flexbox layout: title left, buttons right

### OoNoData

Clickable placeholder for optional fields in N/A state.

- Dashed border with "No Data" text
- Hover state: "Edit" text
- Click/keyboard triggers `onEdit` callback

### OoVariantPicker

Dropdown for switching union variants.

- Three-dot icon button
- Dropdown menu listing all variants
- Active variant highlighted
- Uses `useDropdown()` for open/close + click-outside

## Styles

```ts
import '@foormjs/vue/styles' // optional — provides CSS for default components
```

CSS classes use `oo-` prefix: `oo-form`, `oo-field`, `oo-object`, `oo-array`, etc.

## Gotchas

- Internal components (OoFieldShell, OoStructuredHeader, OoNoData, OoVariantPicker) are NOT exported — custom components must handle label/error/hint/N/A rendering themselves
- OoInput serves three type keys (`text`, `password`, `number`) — the `type` prop determines behavior
- OoObject without `@foorm.title` still renders as a container — just without a visible title
- OoArray uses `<OoField>` per item (not OoIterator) because it needs per-item remove props and stable keys
- OoUnion renders NO chrome — it provides context and delegates everything to the inner variant's component
- Default styles are optional but recommended when using default components
