<script setup lang="ts">
import { computed, useId } from 'vue'
import type { TFoormComponentProps } from '../types'
import OoOptionalNa from './oo-optional-na.vue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<TFoormComponentProps<unknown, any, any>>()

const id = useId()
const inputId = `oo-input-${id}`
const errorId = `oo-input-${id}-err`
const descId = `oo-input-${id}-desc`

const optionalEnabled = computed(() => props.model?.value !== undefined)
</script>

<template>
  <div class="oo-default-field" :class="$props.class" v-show="!hidden">
    <label v-if="label" :for="inputId">{{ label }}</label>
    <span v-if="description" :id="descId">{{ description }}</span>
    <template v-if="optional && !optionalEnabled">
      <OoOptionalNa :on-edit="() => onToggleOptional?.(true)" />
    </template>
    <template v-else>
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
