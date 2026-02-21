import type {
  FoormArrayFieldDef,
  FoormFieldDef,
  FoormUnionFieldDef,
  FoormUnionVariant,
} from '@foormjs/atscript'
import {
  getFieldMeta,
  createFormData,
  createFoormValueResolver,
  isUnionField,
} from '@foormjs/atscript'
import { computed, inject, reactive, watch, type ComputedRef } from 'vue'
import type { TFoormChangeType } from '../components/types'
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
  const { rootFormData, formContext, pathPrefix, getByPath, setByPath } =
    useFoormContext('useFoormArray')
  const handleChange = inject<(type: TFoormChangeType, path: string, value: unknown) => void>(
    '__foorm_change_handler',
    () => {}
  )

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
    const newLen = arrayValue.value.length
    if (itemKeys.length > newLen) {
      // Invalidate cached field defs for removed indices
      for (const key of itemFieldCache.keys()) {
        if (key >= newLen) itemFieldCache.delete(key)
      }
      while (itemKeys.length > newLen) {
        itemKeys.pop()
      }
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
  const itemFieldCache = new Map<number, FoormFieldDef>()

  function getItemField(index: number): FoormFieldDef {
    let cached = itemFieldCache.get(index)
    if (!cached) {
      cached = { ...field.itemField, path: String(index), name: '' }
      itemFieldCache.set(index, cached)
    }
    return cached
  }

  // ── Length constraints ──────────────────────────────────────
  const minLengthMeta = getFieldMeta(field.prop, 'expect.minLength')
  const maxLengthMeta = getFieldMeta(field.prop, 'expect.maxLength')
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
    const resolver = createFoormValueResolver(
      rootFormData().value as Record<string, unknown>,
      formContext.value
    )
    let newItem: unknown
    if (isUnion) {
      const variant = unionVariants[variantIndex]
      if (!variant) return
      newItem = createFormData(variant.type, resolver).value
    } else {
      newItem = createFormData(field.itemType, resolver).value
    }
    ensureArray().push(newItem)
    itemKeys.push(generateKey())
    handleChange('array-add', pathPrefix.value, arrayValue.value)
  }

  function removeItem(index: number) {
    if (!canRemove.value) return
    ensureArray().splice(index, 1)
    itemKeys.splice(index, 1)
    // Invalidate cached field defs at and above the removed index
    // since items shift down and cached `path` values become stale
    for (const key of itemFieldCache.keys()) {
      if (key >= index) itemFieldCache.delete(key)
    }
    handleChange('array-remove', pathPrefix.value, arrayValue.value)
  }

  // ── Labels from annotations ─────────────────────────────────
  const addLabel = getFieldMeta(field.prop, 'foorm.array.add.label') ?? 'Add item'
  const removeLabel = getFieldMeta(field.prop, 'foorm.array.remove.label') ?? 'Remove'

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
