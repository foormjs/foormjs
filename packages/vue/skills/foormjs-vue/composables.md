# Array & Union Composables — @foormjs/vue

> `useFoormArray`, `useFoormUnion`, `useConsumeUnionContext`, `formatIndexedLabel`, and `useDropdown`.

## useFoormArray

Manages array field state: stable keys, add/remove with constraints, per-index field caching, and union variant support.

```ts
import { useFoormArray } from '@foormjs/vue'
import type { FoormArrayFieldDef } from '@foormjs/atscript'
import { isArrayField } from '@foormjs/atscript'
import { computed } from 'vue'

const arrayField = isArrayField(props.field!) ? (props.field as FoormArrayFieldDef) : undefined

const {
  arrayValue, // ComputedRef<unknown[]> — current array items
  itemKeys, // string[] (reactive) — stable keys for v-for
  getItemField, // (index: number) => FoormFieldDef
  isUnion, // boolean — items are union types?
  unionVariants, // FoormUnionVariant[] — variants (if union)
  addItem, // (variantIndex?: number) => void
  removeItem, // (index: number) => void
  canAdd, // ComputedRef<boolean> — respects @expect.maxLength
  canRemove, // ComputedRef<boolean> — respects @expect.minLength
  addLabel, // string — from @foorm.array.add.label
  removeLabel, // string — from @foorm.array.remove.label
} = useFoormArray(
  arrayField!,
  computed(() => props.disabled ?? false)
)
```

**Parameters:**

- `field: FoormArrayFieldDef` — array field definition (use type guard first)
- `disabled?: ComputedRef<boolean>` — reactive disabled state

**Key behaviors:**

- `itemKeys` — stable string keys for Vue `v-for` tracking; auto-synced on array mutations
- `getItemField(index)` — returns a `FoormFieldDef` for the item at index; caches and reuses across calls
- `addItem(variantIndex?)` — for non-union arrays, pass `0`; for union arrays, pass the variant index
- `removeItem(index)` — removes item and its key; invalidates cached field defs
- `canAdd` / `canRemove` — computed from `@expect.maxLength` / `@expect.minLength`
- Emits `'array-add'` and `'array-remove'` change events via injected `__foorm_change_handler`

**Union arrays:**

- `isUnion` is `true` when the array item type is a union
- `unionVariants` lists available variants
- `addItem(variantIndex)` creates a new item from the selected variant via `createItemData(variant)`

## useFoormUnion

Manages union variant state with data stashing — switching away saves data, switching back restores it.

```ts
import { useFoormUnion } from '@foormjs/vue'

const {
  unionField, // ComputedRef<FoormUnionFieldDef | undefined>
  hasMultipleVariants, // ComputedRef<boolean>
  localUnionIndex, // Ref<number> — current variant index
  currentVariant, // ComputedRef<FoormUnionVariant>
  innerField, // ComputedRef<FoormFieldDef | undefined>
  changeVariant, // (newIndex: number) => void
  optionalEnabled, // ComputedRef<boolean>
  dropdownRef, // Ref<HTMLElement | null> — for variant picker dropdown
  isOpen, // Ref<boolean> — dropdown open state
  toggle, // () => void — toggle dropdown
  select, // (callback) => void — select and close
  handleNaClick, // () => void — handle N/A click for optional unions
} = useFoormUnion(props)
```

**Parameters:**

- `props: TFoormComponentProps` — the union component's props

**Key behaviors:**

- **Data stashing:** when switching from variant A to B, A's data is saved; switching back restores it
- **Variant detection:** auto-detects the initial variant from existing data using `detectUnionVariant()`
- **Provides `__foorm_union` context:** `{ variants, currentIndex, changeVariant }` — consumed by child components (e.g., inline variant picker in headers)
- **Emits `'union-switch'`** change event when variant changes
- **Dropdown state** (`dropdownRef`, `isOpen`, `toggle`, `select`) — for optional N/A variant picker UI

## useConsumeUnionContext

Reads the `__foorm_union` injection and immediately clears it. Prevents nested children from inheriting stale union context.

```ts
import { useConsumeUnionContext } from '@foormjs/vue'

const unionCtx = useConsumeUnionContext()
// unionCtx?.variants     — FoormUnionVariant[]
// unionCtx?.currentIndex — Ref<number>
// unionCtx?.changeVariant — (index: number) => void
```

**Must call in:** custom object, array, tuple, and field shell components. Without this, deeply nested components would incorrectly see a parent union's context.

**Return type: `TFoormUnionContext | undefined`**

```ts
interface TFoormUnionContext {
  variants: FoormUnionVariant[]
  currentIndex: Ref<number>
  changeVariant: (index: number) => void
}
```

## formatIndexedLabel

Formats a label with an array index prefix.

```ts
import { formatIndexedLabel } from '@foormjs/vue'

formatIndexedLabel('Address', 0) // "Address #1"
formatIndexedLabel('Address', 2) // "Address #3"
formatIndexedLabel(undefined, 0) // "#1"
formatIndexedLabel('Name', undefined) // "Name"
formatIndexedLabel(undefined, undefined) // undefined
```

Used by default OoObject and OoFieldShell components for array item labels.

## Common Patterns

### Pattern: Custom array with drag-and-drop

```vue
<script setup lang="ts">
import type { TFoormComponentProps } from '@foormjs/vue'
import type { FoormArrayFieldDef } from '@foormjs/atscript'
import { isArrayField } from '@foormjs/atscript'
import { OoField, useFoormArray } from '@foormjs/vue'
import { computed } from 'vue'

const props = defineProps<TFoormComponentProps>()
const arrayField = isArrayField(props.field!) ? (props.field as FoormArrayFieldDef) : undefined

const {
  arrayValue,
  itemKeys,
  getItemField,
  addItem,
  removeItem,
  canAdd,
  canRemove,
  addLabel,
  removeLabel,
} = useFoormArray(
  arrayField!,
  computed(() => props.disabled ?? false)
)

// Your drag-and-drop logic here — reorder arrayValue items and itemKeys
</script>
```

### Pattern: Union with inline variant picker in object header

The default `OoUnion` provides `__foorm_union` context. The default `OoStructuredHeader` (used by `OoObject`) consumes it to render a variant picker dropdown. For custom components, use `useConsumeUnionContext()`:

```vue
<script setup lang="ts">
import { useConsumeUnionContext } from '@foormjs/vue'

const unionCtx = useConsumeUnionContext()

// Render a variant picker if unionCtx is present
// unionCtx.variants — show as dropdown
// unionCtx.changeVariant(index) — switch variant
// unionCtx.currentIndex — highlight active
</script>
```

## Gotchas

- `useFoormArray` must receive a `FoormArrayFieldDef` — always use `isArrayField()` type guard first
- `itemKeys` is a reactive array, not a ref — it mutates in place
- `getItemField(index)` caches field defs — after `removeItem`, cached entries at removed indices are invalidated
- `changeVariant()` in `useFoormUnion` triggers data stashing — don't manually modify form data before/after
- `useConsumeUnionContext()` has a side effect: it `provide`s `undefined` for `__foorm_union` to clear the injection for children. Always call it even if you don't use the return value.
- `addItem()` for non-union arrays always takes `0` as the variant index argument
