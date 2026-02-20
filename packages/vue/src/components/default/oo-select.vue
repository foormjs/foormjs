<script setup lang="ts">
import type { TFoormEntryOptions } from '@foormjs/atscript'
import { computed, useId } from 'vue'
import type { TFoormComponentProps } from '../types'
import OoOptionalNa from './oo-optional-na.vue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<TFoormComponentProps<unknown, any, any>>()

const id = useId()
const selectId = `oo-select-${id}`
const errorId = `oo-select-${id}-err`
const descId = `oo-select-${id}-desc`

const optionalEnabled = computed(() => props.model?.value !== undefined)

function optKey(opt: TFoormEntryOptions): string {
  return typeof opt === 'string' ? opt : opt.key
}

function optLabel(opt: TFoormEntryOptions): string {
  return typeof opt === 'string' ? opt : opt.label
}
</script>

<template>
  <div class="oo-default-field" :class="$props.class" v-show="!hidden">
    <label v-if="label" :for="selectId">{{ label }}</label>
    <span v-if="description" :id="descId">{{ description }}</span>
    <template v-if="optional && !optionalEnabled">
      <OoOptionalNa :on-edit="() => onToggleOptional?.(true)" />
    </template>
    <template v-else>
      <div class="oo-field-input-row">
        <select
          :id="selectId"
          v-model="model.value"
          @blur="onBlur"
          :name="name"
          :disabled="disabled"
          :readonly="readonly"
          :aria-required="required || undefined"
          :aria-invalid="!!error || undefined"
          :aria-describedby="error || hint ? errorId : description ? descId : undefined"
          :aria-label="!label ? name : undefined"
        >
          <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
          <option v-for="opt in options" :key="optKey(opt)" :value="optKey(opt)">
            {{ optLabel(opt) }}
          </option>
        </select>
        <button
          v-if="optional"
          type="button"
          class="oo-optional-clear"
          @click="onToggleOptional?.(false)"
        >
          &times;
        </button>
        <button
          v-if="onRemove"
          type="button"
          class="oo-array-inline-remove"
          :disabled="!canRemove"
          :aria-label="removeLabel || 'Remove item'"
          @click="onRemove"
        >
          {{ removeLabel || '\u00d7' }}
        </button>
      </div>
      <div :id="errorId" class="oo-error-slot" :role="error ? 'alert' : undefined">
        {{ error || hint }}
      </div>
    </template>
  </div>
</template>
