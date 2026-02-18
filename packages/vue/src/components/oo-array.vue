<script setup lang="ts" generic="TFormData = any, TFormContext = any">
import type { FoormArrayFieldDef, FoormArrayVariant, FoormDef } from '@foormjs/atscript'
import { getFieldMeta, createItemData, detectVariant, getByPath } from '@foormjs/atscript'
import { computed, inject, reactive, watch, type Component, type ComputedRef } from 'vue'
// eslint-disable-next-line import/no-cycle -- OoArray ↔ OoGroup recursive component pattern
import OoGroup from './oo-group.vue'

export interface OoArrayProps {
  field: FoormArrayFieldDef
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components?: Record<string, Component<any>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  types?: Record<string, Component<any>>
  groupComponent?: Component
  errors?: Record<string, string | undefined>
  error?: string
  disabled?: boolean
}

const props = defineProps<OoArrayProps>()

// ── Root data + path prefix ──────────────────────────────────
const rootData = inject<ComputedRef<TFormData>>(
  '__foorm_root_data',
  undefined as unknown as ComputedRef<TFormData>
)
const pathPrefix = inject<ComputedRef<string>>(
  '__foorm_path_prefix',
  computed(() => '')
)

function rootFormData(): Record<string, unknown> {
  return (rootData?.value ?? {}) as Record<string, unknown>
}

// ── Array value reference ───────────────────────────────────
// pathPrefix already includes the array field's path (e.g. 'addresses')
const arrayValue = computed<unknown[]>(() => {
  const v = getByPath(rootFormData(), pathPrefix.value)
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
watch(() => arrayValue.value.length, syncKeys)

// ── Variant tracking ────────────────────────────────────────
const variants = props.field.variants
const isUnion = variants.length > 1

const variantIndices: number[] = reactive(
  arrayValue.value.map(item => detectVariant(item, variants))
)

watch(
  () => arrayValue.value.length,
  () => {
    while (variantIndices.length < arrayValue.value.length) {
      const i = variantIndices.length
      variantIndices.push(detectVariant(arrayValue.value[i], variants))
    }
    while (variantIndices.length > arrayValue.value.length) {
      variantIndices.pop()
    }
  }
)

function currentVariant(index: number): FoormArrayVariant {
  return variants[variantIndices[index] ?? 0] ?? variants[0]
}

// ── Item def resolution ─────────────────────────────────────
// Prioritize itemField (for type-level @foorm.component and primitives),
// fall back to variant.def for standard objects.
function itemDef(index: number): FoormDef | undefined {
  const variant = currentVariant(index)
  if (variant.itemField) {
    return {
      type: variant.type as FoormDef['type'],
      fields: [variant.itemField],
      flatMap: new Map(),
    }
  }
  if (variant.def) return variant.def
  return undefined
}

// ── Length constraints ──────────────────────────────────────
const minLengthMeta = getFieldMeta<{ length: number }>(props.field.prop, 'expect.minLength')
const maxLengthMeta = getFieldMeta<{ length: number }>(props.field.prop, 'expect.maxLength')
const minLength = minLengthMeta?.length ?? 0
const maxLength = maxLengthMeta?.length ?? Infinity
const canAdd = computed(() => !props.disabled && arrayValue.value.length < maxLength)
const canRemove = computed(() => !props.disabled && arrayValue.value.length > minLength)

// ── Array mutations ─────────────────────────────────────────
function addItem(variantIndex = 0) {
  if (!canAdd.value) return
  const variant = variants[variantIndex]
  const newItem = createItemData(variant)
  arrayValue.value.push(newItem)
  itemKeys.push(generateKey())
  variantIndices.push(variantIndex)
}

function removeItem(index: number) {
  if (!canRemove.value) return
  arrayValue.value.splice(index, 1)
  itemKeys.splice(index, 1)
  variantIndices.splice(index, 1)
}

function changeVariant(index: number, newVariantIndex: number) {
  const variant = variants[newVariantIndex]
  arrayValue.value[index] = createItemData(variant)
  variantIndices[index] = newVariantIndex
  // Regenerate key to force OoGroup re-creation — clean state for the new variant
  itemKeys[index] = generateKey()
}

// ── Labels from annotations ─────────────────────────────────
const addLabel = getFieldMeta<string>(props.field.prop, 'foorm.array.add.label') ?? 'Add item'
const removeLabel = getFieldMeta<string>(props.field.prop, 'foorm.array.remove.label') ?? 'Remove'

// ── Custom variant selector component ────────────────────────
const variantComponentName = getFieldMeta<string>(props.field.prop, 'foorm.array.variant.component')

const variantComponent = computed(() => {
  if (variantComponentName && props.components?.[variantComponentName]) {
    return props.components[variantComponentName]
  }
  return undefined
})

// ── Custom add component ───────────────────────────────────
const addComponentName = getFieldMeta<string>(props.field.prop, 'foorm.array.add.component')

const addComponent = computed(() => {
  if (addComponentName && props.components?.[addComponentName]) {
    return props.components[addComponentName]
  }
  return undefined
})
</script>

<template>
  <div class="oo-array">
    <!-- Items -->
    <div
      v-for="(_item, i) in arrayValue"
      :key="itemKeys[i]"
      class="oo-array-item"
      :class="{
        'oo-array-item--primitive': !currentVariant(i).def,
        'oo-array-item--custom-group': !!groupComponent && !!currentVariant(i).def,
      }"
    >
      <!-- Variant selector (union arrays) -->
      <component
        v-if="isUnion && variantComponent"
        :is="variantComponent"
        :variants="variants"
        :model-value="variantIndices[i]"
        :disabled="disabled"
        @update:model-value="changeVariant(i, $event)"
      />
      <div v-else-if="isUnion" class="oo-array-variant-btns">
        <button
          v-for="(v, vi) in variants"
          :key="vi"
          type="button"
          class="oo-array-variant-btn"
          :class="{ 'oo-array-variant-btn--active': variantIndices[i] === vi }"
          :disabled="disabled || variantIndices[i] === vi"
          @click="changeVariant(i, vi)"
        >
          {{ v.label }}
        </button>
      </div>

      <!-- Item content → OoGroup handles rendering + remove button -->
      <OoGroup
        :def="itemDef(i)"
        :path-prefix="String(i)"
        :components="components"
        :types="types"
        :group-component="groupComponent"
        :errors="errors"
        :disabled="disabled"
        :on-remove="() => removeItem(i)"
        :can-remove="canRemove"
        :remove-label="removeLabel"
      />
    </div>

    <!-- Add button -->
    <div class="oo-array-add">
      <component
        v-if="addComponent"
        :is="addComponent"
        :disabled="!canAdd"
        :variants="variants"
        @add="addItem"
      />

      <!-- Single variant: simple add button -->
      <button
        v-else-if="!isUnion"
        type="button"
        class="oo-array-add-btn"
        :disabled="!canAdd"
        @click="addItem(0)"
      >
        {{ addLabel }}
      </button>

      <!-- Union: one button per variant -->
      <div v-else class="oo-array-variant-picker">
        <button
          v-for="(v, vi) in variants"
          :key="vi"
          type="button"
          class="oo-array-add-btn"
          :disabled="!canAdd"
          @click="addItem(vi)"
        >
          {{ addLabel }}: {{ v.label }}
        </button>
      </div>
    </div>

    <!-- Array-level validation error -->
    <div v-if="error" class="oo-array-error">{{ error }}</div>
  </div>
</template>

<style>
.oo-array {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.oo-array-error {
  font-size: 12px;
  color: #ef4444;
}

.oo-array-item {
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fafafa;
}

.oo-array-item--primitive,
.oo-array-item--custom-group {
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
}

.oo-array-variant-btns {
  display: inline-flex;
  margin-bottom: 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  overflow: hidden;
}

.oo-array-variant-btn {
  padding: 2px 8px;
  border: none;
  border-right: 1px solid #d1d5db;
  font-size: 0.8rem;
  line-height: 1.4;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
}

.oo-array-variant-btn:last-child {
  border-right: none;
}

.oo-array-variant-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #374151;
}

.oo-array-variant-btn--active {
  background: #6366f1;
  color: #fff;
  cursor: default;
}

.oo-array-variant-btn--active:hover {
  background: #6366f1;
  color: #fff;
}

.oo-array-variant-btn:disabled:not(.oo-array-variant-btn--active) {
  opacity: 0.4;
  cursor: not-allowed;
}

.oo-array-add {
  margin-top: 4px;
}

.oo-array-add-btn {
  padding: 6px 14px;
  border: 1px dashed #d1d5db;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
}

.oo-array-add-btn:hover:not(:disabled) {
  border-color: #6366f1;
  color: #6366f1;
}

.oo-array-add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.oo-array-variant-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
