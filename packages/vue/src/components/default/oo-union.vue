<script setup lang="ts">
import type { FoormFieldDef, FoormUnionFieldDef } from '@foormjs/atscript'
import { isUnionField, createItemData, detectUnionVariant } from '@foormjs/atscript'
import { computed, ref } from 'vue'
import type { TFoormComponentProps } from '../types'
import OoField from '../oo-field.vue'
import OoOptionalNa from './oo-optional-na.vue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<TFoormComponentProps<unknown, any, any>>()

// ── Union field def ─────────────────────────────────────────
const unionField = computed(() =>
  props.field && isUnionField(props.field) ? (props.field as FoormUnionFieldDef) : undefined
)

// ── Local union state ───────────────────────────────────────
const localUnionIndex = ref(
  unionField.value
    ? detectUnionVariant(props.model?.value, unionField.value.unionVariants)
    : 0
)

const currentUnionIndex = computed(() => localUnionIndex.value)

const currentVariant = computed(() => {
  const variants = unionField.value?.unionVariants
  if (!variants) return undefined
  return variants[currentUnionIndex.value] ?? variants[0]
})

// ── Inner field def (resolves current variant to actual field) ──
const innerField = computed<FoormFieldDef | undefined>(() => {
  const variant = currentVariant.value
  if (!variant) return undefined

  const fieldName = unionField.value?.name ?? ''

  if (variant.def) {
    // Object variant: override name for identification
    return { ...variant.def.rootField, path: '', name: fieldName }
  }
  if (variant.itemField) {
    // Primitive variant: keep original name from itemField
    return { ...variant.itemField, path: '' }
  }

  return undefined
})

// ── Change variant handler ──────────────────────────────────
function onChangeVariant(newIndex: number) {
  localUnionIndex.value = newIndex
  const variant = unionField.value?.unionVariants[newIndex]
  if (variant && props.model) {
    props.model.value = createItemData(variant)
  }
}

const optionalEnabled = computed(() => props.model?.value !== undefined)
</script>

<template>
  <div class="oo-union" v-show="!hidden">
    <!-- Label with optional clear -->
    <div v-if="label || optional" class="oo-union-header">
      <label v-if="label" class="oo-union-label">{{ label }}</label>
      <button
        v-if="optional && optionalEnabled"
        type="button"
        class="oo-optional-clear"
        @click="onToggleOptional?.(false)"
      >
        &times;
      </button>
    </div>

    <template v-if="optional && !optionalEnabled">
      <OoOptionalNa :on-edit="() => onToggleOptional?.(true)" />
    </template>
    <template v-else>
      <!-- Union picker (only when multiple variants) -->
      <div v-if="unionField && unionField.unionVariants.length > 1" class="oo-union-picker">
        <button
          v-for="(v, vi) in unionField.unionVariants"
          :key="vi"
          type="button"
          class="oo-union-btn"
          :class="{ 'oo-union-btn--active': currentUnionIndex === vi }"
          :disabled="disabled || currentUnionIndex === vi"
          @click="onChangeVariant(vi)"
        >
          {{ v.label }}
        </button>
      </div>

      <!-- Inner field content -->
      <OoField
        v-if="innerField"
        :field="innerField"
        :on-remove="onRemove"
        :can-remove="canRemove"
        :remove-label="removeLabel"
      />
    </template>
  </div>
</template>

<style>
.oo-union-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.oo-union-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.oo-union-picker {
  display: inline-flex;
  margin-bottom: 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  overflow: hidden;
}

.oo-union-btn {
  padding: 2px 8px;
  border: none;
  border-right: 1px solid #d1d5db;
  font-size: 0.8rem;
  line-height: 1.4;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
}

.oo-union-btn:last-child {
  border-right: none;
}

.oo-union-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #374151;
}

.oo-union-btn--active {
  background: #6366f1;
  color: #fff;
  cursor: default;
}

.oo-union-btn--active:hover {
  background: #6366f1;
  color: #fff;
}

.oo-union-btn:disabled:not(.oo-union-btn--active) {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
