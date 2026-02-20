<script setup lang="ts">
import type { FoormObjectFieldDef } from '@foormjs/atscript'
import { isObjectField } from '@foormjs/atscript'
import { computed } from 'vue'
import type { TFoormComponentProps } from '../types'
import OoIterator from '../oo-iterator.vue'
import OoOptionalNa from './oo-optional-na.vue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<TFoormComponentProps<unknown, any, any>>()

const objectDef = isObjectField(props.field!)
  ? (props.field as FoormObjectFieldDef).objectDef
  : undefined

// In array context, show #<index+1> (with or without title)
const displayTitle = computed(() => {
  const idx = props.arrayIndex
  if (idx !== undefined) {
    return props.title ? `${props.title} #${idx + 1}` : `#${idx + 1}`
  }
  return props.title
})

const optionalEnabled = computed(() => props.model?.value !== undefined)
</script>

<template>
  <div
    class="oo-object"
    :class="{ 'oo-object--root': level === 0, 'oo-object--nested': (level ?? 0) > 0 }"
    v-show="!hidden"
  >
    <div class="oo-object-header" v-if="displayTitle || (onRemove && objectDef) || optional">
      <div class="oo-object-header-content">
        <h2 v-if="displayTitle && level === 0" class="oo-object-title oo-form-title">{{ displayTitle }}</h2>
        <h3 v-else-if="displayTitle" class="oo-object-title">{{ displayTitle }}</h3>
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
        v-if="onRemove && objectDef"
        type="button"
        class="oo-object-remove-btn"
        :disabled="!canRemove"
        :aria-label="removeLabel || 'Remove item'"
        @click="onRemove"
      >
        {{ removeLabel || 'Remove' }}
      </button>
    </div>

    <template v-if="optional && !optionalEnabled">
      <OoOptionalNa :on-edit="() => onToggleOptional?.(true)" />
    </template>
    <template v-else>
      <div v-if="error" class="oo-object-error" role="alert">{{ error }}</div>
      <OoIterator v-if="objectDef" :def="objectDef" />
    </template>
  </div>
</template>

<style>
.oo-object {
  margin: 8px 0;
}

.oo-object--nested {
  padding-left: 12px;
  border-left: 2px solid #e5e7eb;
}

.oo-object--root {
  /* Root object: no left border, no extra padding */
}

.oo-object-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.oo-object-header-content {
  flex: 1;
}

.oo-object-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.oo-object-title.oo-form-title {
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1f;
}

.oo-object-remove-btn {
  padding: 4px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
}

.oo-object-remove-btn:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.oo-object-remove-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.oo-object-error {
  font-size: 12px;
  color: #ef4444;
  margin-bottom: 4px;
}

/* ── Shared default field styles ──────────────────────────── */

.oo-default-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
}

.oo-default-field label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.oo-default-field.required label::after {
  content: ' *';
  color: #ef4444;
}

.oo-default-field span {
  font-size: 12px;
  color: #6b7280;
}

.oo-default-field input,
.oo-default-field select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #1d1d1f;
  background: #fff;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  outline: none;
}

.oo-default-field input::placeholder {
  color: #9ca3af;
}

.oo-default-field input:focus,
.oo-default-field select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.oo-default-field input:disabled,
.oo-default-field select:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.oo-default-field.error input,
.oo-default-field.error select {
  border-color: #ef4444;
}

.oo-default-field.error input:focus,
.oo-default-field.error select:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.oo-default-field .oo-field-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.oo-field-input-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.oo-field-input-row > input,
.oo-field-input-row > select {
  flex: 1;
}

.oo-array-inline-remove {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1;
}

.oo-array-inline-remove:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.oo-array-inline-remove:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.oo-radio-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.oo-radio-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 400;
  color: #1d1d1f;
  cursor: pointer;
}

.oo-radio-group input[type='radio'] {
  padding: 0;
  border: none;
  box-shadow: none;
}

.oo-checkbox-field > label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 400;
  color: #1d1d1f;
  cursor: pointer;
}

.oo-checkbox-field > label input[type='checkbox'] {
  padding: 0;
  border: none;
  box-shadow: none;
}

.oo-default-field .oo-error-slot {
  min-height: 16px;
  line-height: 16px;
  font-size: 12px;
  color: #6b7280;
}

.oo-default-field.error .oo-error-slot {
  color: #ef4444;
}

.oo-default-field.oo-action-field button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.oo-default-field.oo-action-field button:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* ── Optional clear button ──────────────────────────────── */

.oo-optional-clear {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1;
}

.oo-optional-clear:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}
</style>
