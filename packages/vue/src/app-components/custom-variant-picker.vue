<script setup lang="ts">
import type { TFoormVariantComponentProps } from '../components/types'

defineProps<TFoormVariantComponentProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', variantIndex: number): void
}>()
</script>

<template>
  <div class="custom-variant-picker">
    <span class="custom-variant-label">Type:</span>
    <button
      v-for="(v, vi) in variants"
      :key="vi"
      type="button"
      class="custom-variant-chip"
      :class="{ 'custom-variant-chip--active': modelValue === vi }"
      :disabled="disabled || modelValue === vi"
      @click="emit('update:modelValue', vi)"
    >
      {{ v.label }}
    </button>
  </div>
</template>

<style scoped>
.custom-variant-picker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.custom-variant-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.custom-variant-chip {
  padding: 4px 12px;
  border: 1.5px solid #d1d5db;
  border-radius: 16px;
  background: #fff;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}

.custom-variant-chip:hover:not(:disabled) {
  border-color: #8b5cf6;
  color: #7c3aed;
  background: #f5f3ff;
}

.custom-variant-chip--active {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: #fff;
  cursor: default;
}

.custom-variant-chip--active:hover {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: #fff;
}

.custom-variant-chip:disabled:not(.custom-variant-chip--active) {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
