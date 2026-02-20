import type {
  FoormArrayFieldDef,
  FoormFieldDef,
  FoormUnionFieldDef,
  FoormUnionVariant,
} from '@foormjs/atscript'
import { getFieldMeta, createItemData, createDefaultValue, isUnionField } from '@foormjs/atscript'
import { computed, reactive, watch, type ComputedRef } from 'vue'
import { useFoormContext } from './use-foorm-context'

/**
 * Composable for managing array field state.
 *
 * Manages stable keys, add/remove with constraints, and item field resolution.
 * Union item types are handled transparently — OoUnion manages variant state locally.
 * Used by the default `OoArray` component and available for custom array components.
 */
export function useFoormArray(field: FoormArrayFieldDef, disabled?: ComputedRef<boolean>) {
  // ── Context (root data, path, getByPath) ──────────────────────
  const { pathPrefix, getByPath, setByPath } = useFoormContext('useFoormArray')

  // ── Array value reference ───────────────────────────────────
  const arrayValue = computed<unknown[]>(() => {
    const v = getByPath(pathPrefix.value)
    return Array.isArray(v) ? v : []
  })

  // ── Stable keys for v-for ───────────────────────────────────
  let keyCounter = 0
  const itemKeys: string[] = reactive([])

  function generateKey(): string {
    return `oo-item-${keyCounter++}`
  }

  function syncKeys() {
    while (itemKeys.length < arrayValue.value.length) {
      itemKeys.push(generateKey())
    }
    while (itemKeys.length > arrayValue.value.length) {
      itemKeys.pop()
    }
  }

  syncKeys()
  watch(
    () => arrayValue.value.length,
    () => syncKeys()
  )

  // ── Union info (derived from item field template) ─────────────
  const isUnion = isUnionField(field.itemField)
  const unionVariants: FoormUnionVariant[] = isUnion
    ? (field.itemField as FoormUnionFieldDef).unionVariants
    : []

  // ── Item field resolution ─────────────────────────────────────
  function getItemField(index: number): FoormFieldDef {
    return { ...field.itemField, path: String(index), name: '' }
  }

  // ── Length constraints ──────────────────────────────────────
  const minLengthMeta = getFieldMeta<{ length: number }>(field.prop, 'expect.minLength')
  const maxLengthMeta = getFieldMeta<{ length: number }>(field.prop, 'expect.maxLength')
  const minLength = minLengthMeta?.length ?? 0
  const maxLength = maxLengthMeta?.length ?? Infinity
  const canAdd = computed(() => !disabled?.value && arrayValue.value.length < maxLength)
  const canRemove = computed(() => !disabled?.value && arrayValue.value.length > minLength)

  // ── Array mutations ─────────────────────────────────────────
  function ensureArray(): unknown[] {
    let arr = getByPath(pathPrefix.value)
    if (!Array.isArray(arr)) {
      arr = []
      setByPath(pathPrefix.value, arr)
    }
    return arr as unknown[]
  }

  function addItem(variantIndex = 0) {
    if (!canAdd.value) return
    let newItem: unknown
    if (isUnion) {
      const variant = unionVariants[variantIndex]
      if (!variant) return
      newItem = createItemData(variant)
    } else {
      newItem = createDefaultValue(field.itemType)
    }
    ensureArray().push(newItem)
    itemKeys.push(generateKey())
  }

  function removeItem(index: number) {
    if (!canRemove.value) return
    ensureArray().splice(index, 1)
    itemKeys.splice(index, 1)
  }

  // ── Labels from annotations ─────────────────────────────────
  const addLabel = getFieldMeta<string>(field.prop, 'foorm.array.add.label') ?? 'Add item'
  const removeLabel = getFieldMeta<string>(field.prop, 'foorm.array.remove.label') ?? 'Remove'

  return {
    arrayValue,
    itemKeys,
    isUnion,
    unionVariants,
    getItemField,
    addItem,
    removeItem,
    canAdd,
    canRemove,
    addLabel,
    removeLabel,
  }
}
