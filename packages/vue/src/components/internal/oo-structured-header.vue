<script setup lang="ts">
import type { TFoormUnionContext } from '../types'
import OoVariantPicker from './oo-variant-picker.vue'

const props = defineProps<{
  title?: string
  level?: number
  onRemove?: () => void
  canRemove?: boolean
  removeLabel?: string
  optional?: boolean
  optionalEnabled?: boolean
  onToggleOptional?: (enable: boolean) => void
  disabled?: boolean
  unionContext?: TFoormUnionContext
}>()

// ── Variant picker (from union context prop) ────────────────
const hasVariantPicker = props.unionContext !== undefined && props.unionContext.variants.length > 1
</script>

<template>
  <div class="oo-structured-header" v-if="title || onRemove || optional || hasVariantPicker">
    <div class="oo-structured-header-content">
      <h2 v-if="title && level === 0" class="oo-structured-title oo-form-title">{{ title }}</h2>
      <h3 v-else-if="title" class="oo-structured-title">{{ title }}</h3>

      <!-- Union variant picker — inline next to title -->
      <OoVariantPicker
        v-if="hasVariantPicker"
        :union-context="unionContext!"
        :disabled="disabled"
      />
    </div>

    <button
      v-if="optional && optionalEnabled"
      type="button"
      class="oo-optional-clear"
      @click="onToggleOptional?.(false)"
    >
      &times;
    </button>
    <button
      v-if="onRemove"
      type="button"
      class="oo-structured-remove-btn"
      :disabled="!canRemove"
      :aria-label="removeLabel || 'Remove item'"
      @click="onRemove"
    >
      {{ removeLabel || 'Remove' }}
    </button>
  </div>
</template>

<style>
.oo-structured-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.oo-structured-header-content {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.oo-structured-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.oo-structured-title.oo-form-title {
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1f;
}

.oo-structured-remove-btn {
  padding: 4px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
}

.oo-structured-remove-btn:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.oo-structured-remove-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
