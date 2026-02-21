<script setup lang="ts">
import { useFoormField } from './composables/use-foorm-field'
import type { TFoormRule } from './types'

const props = defineProps<{
  modelValue: string
  path: string
  label: string
  rules?: TFoormRule<string, unknown, unknown>[]
  type?: string
  placeholder?: string
  textarea?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { model, error, onBlur } = useFoormField({
  getValue: () => props.modelValue,
  setValue: v => emit('update:modelValue', v),
  rules: props.rules,
  path: () => props.path,
})
</script>

<template>
  <div class="field">
    <label :for="path">{{ label }}</label>
    <textarea
      v-if="textarea"
      :id="path"
      v-model="model"
      rows="3"
      :placeholder="placeholder"
      @blur="onBlur"
    />
    <input
      v-else
      :id="path"
      v-model="model"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      @blur="onBlur"
    />
    <span v-if="error" class="error">{{ error }}</span>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.field input,
.field textarea {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.field input:focus,
.field textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.error {
  color: #ef4444;
  font-size: 13px;
}
</style>
