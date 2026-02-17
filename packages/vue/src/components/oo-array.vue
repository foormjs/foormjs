<script setup lang="ts" generic="TFormData = any, TFormContext = any">
import type { FoormArrayFieldDef, FoormArrayVariant } from 'foorm'
import { getFieldMeta, createItemData, detectVariant } from 'foorm'
import { computed, inject, reactive, watch, type Component, type ComputedRef } from 'vue'
import type { TVuilessState } from 'vuiless-forms'
// eslint-disable-next-line import/no-cycle -- OoArray ↔ OoGroup recursive component pattern
import OoGroup from './oo-group.vue'

export interface OoArrayProps {
  field: FoormArrayFieldDef
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components?: Record<string, Component<any>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  types?: Record<string, Component<any>>
  errors?: Record<string, string | undefined>
  error?: string
  disabled?: boolean
}

const props = defineProps<OoArrayProps>()

const vuiless = inject<ComputedRef<TVuilessState<TFormData, TFormContext>>>(
  'vuiless'
) as ComputedRef<TVuilessState<TFormData, TFormContext>>

// ── Array value reference ───────────────────────────────────
const arrayValue = computed<unknown[]>(() => {
  const fd = vuiless.value.formData as Record<string, unknown>
  const keys = props.field.path.split('.')
  let current: unknown = fd
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') return []
    current = (current as Record<string, unknown>)[key]
  }
  return (Array.isArray(current) ? current : []) as unknown[]
})

// ── Stable keys for v-for ───────────────────────────────────
let keyCounter = 0
const itemKeys: string[] = reactive([])

function generateKey(): string {
  return `oo-item-${keyCounter++}`
}

// Initialize keys for existing items
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
    // Sync variant indices with array length
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
}

// ── Labels from annotations ─────────────────────────────────
const addLabel = getFieldMeta<string>(props.field.prop, 'foorm.array.add.label') ?? 'Add item'
const removeLabel = getFieldMeta<string>(props.field.prop, 'foorm.array.remove.label') ?? 'Remove'

// ── Custom components ───────────────────────────────────────
const addComponentName = getFieldMeta<string>(props.field.prop, 'foorm.array.add.component')
const removeComponentName = getFieldMeta<string>(props.field.prop, 'foorm.array.remove.component')

const addComponent = computed(() => {
  if (addComponentName && props.components?.[addComponentName]) {
    return props.components[addComponentName]
  }
  return undefined
})

const removeComponent = computed(() => {
  if (removeComponentName && props.components?.[removeComponentName]) {
    return props.components[removeComponentName]
  }
  return undefined
})

// ── Error path mapping ──────────────────────────────────────
function getItemErrors(index: number): Record<string, string | undefined> | undefined {
  if (!props.errors) return undefined
  const prefix = `${props.field.path}.${index}.`
  const result: Record<string, string | undefined> = {}
  let hasErrors = false
  for (const [key, value] of Object.entries(props.errors) as [string, string | undefined][]) {
    if (key.startsWith(prefix)) {
      result[key.slice(prefix.length)] = value
      hasErrors = true
    }
  }
  return hasErrors ? result : undefined
}

// ── Primitive input type ────────────────────────────────────
function primitiveInputType(index: number): string {
  const variant = currentVariant(index)
  switch (variant.designType) {
    case 'number':
      return 'number'
    case 'boolean':
      return 'checkbox'
    default:
      return 'text'
  }
}
</script>

<template>
  <div class="oo-array">
    <!-- Items -->
    <div
      v-for="(_item, i) in arrayValue"
      :key="itemKeys[i]"
      :class="currentVariant(i).def ? 'oo-array-item' : 'oo-array-scalar-row'"
    >
      <!-- Variant selector (union arrays — always visible so user can switch back) -->
      <select
        v-if="isUnion"
        class="oo-array-variant-select"
        :value="variantIndices[i]"
        :disabled="disabled"
        @change="changeVariant(i, +($event.target as HTMLSelectElement).value)"
      >
        <option v-for="(v, vi) in variants" :key="vi" :value="vi">{{ v.label }}</option>
      </select>

      <!-- Primitive item → inline input -->
      <template v-if="!currentVariant(i).def">
        <input
          v-if="currentVariant(i).designType !== 'boolean'"
          v-model="arrayValue[i]"
          :type="primitiveInputType(i)"
          :disabled="disabled"
          class="oo-array-scalar-input"
        />
        <label v-else class="oo-array-checkbox-label">
          <input type="checkbox" v-model="arrayValue[i]" :disabled="disabled" />
        </label>
      </template>

      <!-- Object item → OoGroup sub-fields -->
      <template v-else>
        <OoGroup
          :def="currentVariant(i).def!"
          :form-data="arrayValue[i] as Record<string, unknown>"
          :components="components"
          :types="types"
          :errors="getItemErrors(i)"
        />
      </template>

      <!-- Remove button -->
      <component
        v-if="removeComponent"
        :is="removeComponent"
        :index="i"
        :disabled="!canRemove"
        @remove="removeItem(i)"
      />
      <button
        v-else
        type="button"
        class="oo-array-remove-btn"
        :disabled="!canRemove"
        @click="removeItem(i)"
      >
        {{ removeLabel }}
      </button>
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

    <!-- Array-level validation error (e.g., minLength / maxLength) -->
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

.oo-array-item > .oo-array-remove-btn {
  margin-top: 4px;
}

.oo-array-item > .oo-array-variant-select {
  margin-bottom: 8px;
}

.oo-array-variant-select {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  background: #fff;
}

.oo-array-remove-btn {
  margin-left: auto;
  padding: 4px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
}

.oo-array-remove-btn:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.oo-array-remove-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.oo-array-scalar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.oo-array-scalar-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.oo-array-scalar-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
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

.oo-array-checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
</style>
