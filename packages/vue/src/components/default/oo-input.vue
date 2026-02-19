<script setup lang="ts">
import { useId } from 'vue'
import type { TFoormComponentProps } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
defineProps<TFoormComponentProps<unknown, any, any>>()

const id = useId()
const inputId = `oo-input-${id}`
const errorId = `oo-input-${id}-err`
const descId = `oo-input-${id}-desc`
</script>

<template>
  <div class="oo-default-field" :class="$props.class" v-show="!hidden">
    <label v-if="label" :for="inputId">{{ label }}</label>
    <span v-if="description" :id="descId">{{ description }}</span>
    <div class="oo-field-input-row">
      <input
        :id="inputId"
        v-model="model.value"
        @blur="onBlur"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :name="name"
        :type="type"
        :disabled="disabled"
        :readonly="readonly"
        :aria-required="required || undefined"
        :aria-invalid="!!error || undefined"
        :aria-describedby="error || hint ? errorId : description ? descId : undefined"
        :aria-label="!label ? name : undefined"
      />
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
  </div>
</template>
