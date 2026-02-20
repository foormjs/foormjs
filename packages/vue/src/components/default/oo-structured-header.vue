<script setup lang="ts">
import { ref } from 'vue'
import type { TFoormUnionContext } from '../types'
import { useDropdown } from '../../composables/use-dropdown'

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

const dropdownRef = ref<HTMLElement | null>(null)
const { isOpen, toggle, select } = useDropdown(dropdownRef)

function onSelectVariant(index: number) {
  select(() => props.unionContext!.changeVariant(index))
}
</script>

<template>
  <div class="oo-structured-header" v-if="title || onRemove || optional || hasVariantPicker">
    <div class="oo-structured-header-content">
      <h2 v-if="title && level === 0" class="oo-structured-title oo-form-title">{{ title }}</h2>
      <h3 v-else-if="title" class="oo-structured-title">{{ title }}</h3>

      <!-- Union variant picker — inline next to title -->
      <div v-if="hasVariantPicker" ref="dropdownRef" class="oo-dropdown">
        <button
          type="button"
          class="oo-variant-trigger"
          :disabled="disabled"
          :title="
            unionContext!.variants[unionContext!.currentIndex.value]?.label ?? 'Switch variant'
          "
          @click="toggle"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="3" cy="8" r="1.5" fill="currentColor" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            <circle cx="13" cy="8" r="1.5" fill="currentColor" />
          </svg>
        </button>
        <div v-if="isOpen" class="oo-dropdown-menu">
          <button
            v-for="(v, vi) in unionContext!.variants"
            :key="vi"
            type="button"
            class="oo-dropdown-item"
            :class="{ 'oo-dropdown-item--active': unionContext!.currentIndex.value === vi }"
            @click="onSelectVariant(vi)"
          >
            {{ v.label }}
          </button>
        </div>
      </div>
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
