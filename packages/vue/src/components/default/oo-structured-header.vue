<script setup lang="ts">
defineProps<{
  title?: string
  level?: number
  onRemove?: () => void
  canRemove?: boolean
  removeLabel?: string
  optional?: boolean
  optionalEnabled?: boolean
  onToggleOptional?: (enable: boolean) => void
}>()
</script>

<template>
  <div class="oo-structured-header" v-if="title || onRemove || optional">
    <div class="oo-structured-header-content">
      <h2 v-if="title && level === 0" class="oo-structured-title oo-form-title">{{ title }}</h2>
      <h3 v-else-if="title" class="oo-structured-title">{{ title }}</h3>
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
