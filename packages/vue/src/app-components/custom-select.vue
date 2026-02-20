<script setup lang="ts">
import { ref, computed, useId } from 'vue'
import type { TFoormComponentProps } from '../components/types'

const props = defineProps<TFoormComponentProps<string>>()

const id = useId()
const labelId = `ct-select-${id}-label`
const errorId = `ct-select-${id}-err`

const isOpen = ref(false)
const triggerRef = ref<HTMLElement>()

const selectedLabel = computed(() => {
  if (!props.model.value) return undefined
  const opt = props.options?.find(o =>
    typeof o === 'string' ? o === props.model.value : o.key === props.model.value
  )
  if (!opt) return props.model.value
  return typeof opt === 'string' ? opt : opt.label
})

function toggle() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function select(key: string) {
  props.model.value = key
  isOpen.value = false
  props.onBlur({} as FocusEvent)
}

function handleBlur(e: FocusEvent) {
  const root = triggerRef.value?.closest('.ct-select-wrapper')
  if (root && e.relatedTarget instanceof Node && root.contains(e.relatedTarget)) return
  isOpen.value = false
  props.onBlur(e)
}

function optKey(opt: string | { key: string; label: string }): string {
  return typeof opt === 'string' ? opt : opt.key
}

function optLabel(opt: string | { key: string; label: string }): string {
  return typeof opt === 'string' ? opt : opt.label
}
</script>

<template>
  <div
    class="ct-field"
    :class="{ 'ct-field--error': !!error, 'ct-field--hidden': hidden }"
    v-show="!hidden"
  >
    <div class="ct-header">
      <label v-if="label" :id="labelId" class="ct-label">
        {{ label }}
        <span v-if="required" class="ct-required" aria-hidden="true">*</span>
      </label>
    </div>
    <span v-if="description" class="ct-description">{{ description }}</span>

    <!-- Hidden native select for form semantics / Playwright selectOption -->
    <select
      :name="name"
      :value="model.value"
      class="ct-select-hidden"
      tabindex="-1"
      aria-hidden="true"
      @change="model.value = ($event.target as HTMLSelectElement).value"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in options" :key="optKey(opt)" :value="optKey(opt)">
        {{ optLabel(opt) }}
      </option>
    </select>

    <div class="ct-select-wrapper" @focusout="handleBlur">
      <button
        ref="triggerRef"
        type="button"
        class="ct-select-trigger"
        :class="{
          'ct-select-trigger--open': isOpen,
          'ct-select-trigger--placeholder': !model.value,
        }"
        :disabled="disabled"
        @click="toggle"
        role="combobox"
        :aria-expanded="isOpen"
        aria-haspopup="listbox"
        :aria-labelledby="label ? labelId : undefined"
        :aria-required="required || undefined"
        :aria-invalid="!!error || undefined"
        :aria-describedby="error || hint ? errorId : undefined"
      >
        <span class="ct-select-value">{{ selectedLabel || placeholder || 'Select...' }}</span>
        <svg
          class="ct-select-chevron"
          :class="{ 'ct-select-chevron--open': isOpen }"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 5.5l3 3 3-3"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <Transition name="ct-dropdown">
        <ul
          v-if="isOpen"
          class="ct-select-dropdown"
          role="listbox"
          :aria-labelledby="label ? labelId : undefined"
        >
          <li
            v-for="opt in options"
            :key="optKey(opt)"
            class="ct-select-option"
            :class="{ 'ct-select-option--selected': optKey(opt) === model.value }"
            role="option"
            :aria-selected="optKey(opt) === model.value"
            tabindex="0"
            @click="select(optKey(opt))"
            @keydown.enter.prevent="select(optKey(opt))"
            @keydown.space.prevent="select(optKey(opt))"
          >
            <span>{{ optLabel(opt) }}</span>
            <svg
              v-if="optKey(opt) === model.value"
              class="ct-select-check"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 7l3 3 5-6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </li>
        </ul>
      </Transition>
    </div>

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

.ct-select-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  padding: 0;
  margin: -1px;
}

.ct-select-wrapper {
  position: relative;
}

.ct-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #1d1d1f;
  background: #fff;
  cursor: pointer;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.ct-select-trigger--placeholder .ct-select-value {
  color: #9ca3af;
}

.ct-select-trigger:focus,
.ct-select-trigger--open {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.ct-field--error .ct-select-trigger {
  border-color: #ef4444;
}

.ct-field--error .ct-select-trigger:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}

.ct-select-trigger:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.ct-select-chevron {
  color: #6b7280;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.ct-select-chevron--open {
  transform: rotate(180deg);
}

.ct-select-dropdown {
  position: absolute;
  z-index: 50;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.06);
  max-height: 200px;
  overflow-y: auto;
}

.ct-select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition:
    background 0.1s,
    color 0.1s;
  outline: none;
}

.ct-select-option:hover,
.ct-select-option:focus {
  background: #f3f4f6;
}

.ct-select-option--selected {
  color: #6366f1;
  font-weight: 500;
}

.ct-select-check {
  color: #6366f1;
  flex-shrink: 0;
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

/* Dropdown transition */
.ct-dropdown-enter-active,
.ct-dropdown-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}

.ct-dropdown-enter-from,
.ct-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
