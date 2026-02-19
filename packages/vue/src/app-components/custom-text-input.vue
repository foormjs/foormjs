<script setup lang="ts">
import { useId } from 'vue'
import type { TFoormComponentProps } from '../components/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
defineProps<TFoormComponentProps<string, any, any>>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const id = useId()
const inputId = `ct-input-${id}`
const errorId = `ct-input-${id}-err`
const descId = `ct-input-${id}-desc`
</script>

<template>
  <div
    class="ct-field"
    :class="{ 'ct-field--error': !!error, 'ct-field--hidden': hidden }"
    v-show="!hidden"
  >
    <div class="ct-header">
      <label v-if="label" class="ct-label" :for="inputId">
        {{ label }}
        <span v-if="required" class="ct-required" aria-hidden="true">*</span>
      </label>
      <button
        v-if="onRemove"
        type="button"
        class="ct-remove"
        :disabled="!canRemove"
        :aria-label="removeLabel || 'Remove item'"
        :title="removeLabel || 'Remove'"
        @click="onRemove"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M5.5 2h3M2 3.5h10M11 3.5l-.5 7.5a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11L3 3.5M5.5 6v3.5M8.5 6v3.5"
            stroke="currentColor"
            stroke-width="1.3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
    <span v-if="description" :id="descId" class="ct-description">{{ description }}</span>
    <input
      :id="inputId"
      class="ct-input"
      :value="model.value"
      @input="model.value = ($event.target as HTMLInputElement).value"
      @blur="onBlur"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :name="name"
      :type="type"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxLength"
      :aria-required="required || undefined"
      :aria-invalid="!!error || undefined"
      :aria-describedby="error || hint ? errorId : description ? descId : undefined"
    />
    <div class="ct-footer" v-if="error || hint">
      <span
        :id="errorId"
        :class="error ? 'ct-error' : 'ct-hint'"
        :role="error ? 'alert' : undefined"
        >{{ error || hint }}</span
      >
    </div>
  </div>
</template>

<style scoped>
.ct-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
}

.ct-field--hidden {
  display: none;
}

.ct-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ct-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.ct-required {
  color: #ef4444;
  margin-left: 2px;
}

.ct-description {
  font-size: 12px;
  color: #6b7280;
}

.ct-input {
  padding: 8px 12px;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #1d1d1f;
  background: #fff;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.ct-input::placeholder {
  color: #9ca3af;
}

.ct-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.ct-field--error .ct-input {
  border-color: #ef4444;
}

.ct-field--error .ct-input:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}

.ct-input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.ct-footer {
  min-height: 16px;
}

.ct-hint {
  font-size: 12px;
  color: #6b7280;
}

.ct-error {
  font-size: 12px;
  color: #ef4444;
}

.ct-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1.5px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.15s;
}

.ct-remove:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #ef4444;
}

.ct-remove:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
