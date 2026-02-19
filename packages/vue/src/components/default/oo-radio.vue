<script setup lang="ts">
import type { TFoormEntryOptions } from '@foormjs/atscript'
import { useId } from 'vue'
import type { TFoormComponentProps } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
defineProps<TFoormComponentProps<unknown, any, any>>()

const id = useId()
const groupLabelId = `oo-radio-${id}-label`
const errorId = `oo-radio-${id}-err`
const descId = `oo-radio-${id}-desc`

function optKey(opt: TFoormEntryOptions): string {
  return typeof opt === 'string' ? opt : opt.key
}

function optLabel(opt: TFoormEntryOptions): string {
  return typeof opt === 'string' ? opt : opt.label
}
</script>

<template>
  <div class="oo-default-field oo-radio-field" :class="$props.class" v-show="!hidden">
    <span :id="groupLabelId" class="oo-field-label">{{ label }}</span>
    <span v-if="description" :id="descId">{{ description }}</span>
    <div
      class="oo-radio-group"
      role="radiogroup"
      :aria-labelledby="groupLabelId"
      :aria-required="required || undefined"
      :aria-invalid="!!error || undefined"
      :aria-describedby="error || hint ? errorId : description ? descId : undefined"
    >
      <label v-for="opt in options" :key="optKey(opt)">
        <input
          type="radio"
          :value="optKey(opt)"
          v-model="model.value"
          @blur="onBlur"
          :name="name"
          :disabled="disabled"
          :readonly="readonly"
        />
        {{ optLabel(opt) }}
      </label>
    </div>
    <div :id="errorId" class="oo-error-slot" :role="error ? 'alert' : undefined">
      {{ error || hint }}
    </div>
  </div>
</template>
