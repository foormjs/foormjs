<script setup lang="ts">
import type { TFoormAddComponentProps } from '../components/types'

defineProps<TFoormAddComponentProps>()

const emit = defineEmits<{
  (e: 'add', variantIndex: number): void
}>()
</script>

<template>
  <button type="button" class="custom-add-btn" :disabled="disabled" @click="emit('add', 0)">
    <span class="custom-add-btn-icon">+</span>
    Add new score
  </button>
</template>

<style scoped>
.custom-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: 2px solid #10b981;
  border-radius: 20px;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  font-size: 13px;
  font-weight: 600;
  color: #065f46;
  cursor: pointer;
  transition: all 0.15s;
}

.custom-add-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  border-color: #059669;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
}

.custom-add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.custom-add-btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #10b981;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}
</style>
