<script setup lang="ts">
import { computed, useId } from 'vue'
import type { TFoormComponentProps } from '../types'
import OoOptionalNa from './oo-optional-na.vue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<TFoormComponentProps<unknown, any, any>>()

const id = useId()
const inputId = `oo-checkbox-${id}`
const errorId = `oo-checkbox-${id}-err`
const descId = `oo-checkbox-${id}-desc`

const optionalEnabled = computed(() => props.model?.value !== undefined)
</script>

<template>
  <div class="oo-default-field oo-checkbox-field" :class="$props.class" v-show="!hidden">
    <template v-if="optional && !optionalEnabled">
      <span class="oo-field-label">{{ label }}</span>
      <OoOptionalNa :on-edit="() => onToggleOptional?.(true)" />
    </template>
    <template v-else>
      <div class="oo-field-input-row">
        <label :for="inputId">
          <input
            :id="inputId"
            type="checkbox"
            :checked="!!model.value"
            @change="model.value = ($event.target as HTMLInputElement).checked"
            @blur="onBlur"
            :name="name"
            :disabled="disabled"
            :readonly="readonly"
            :aria-invalid="!!error || undefined"
            :aria-describedby="error || hint ? errorId : description ? descId : undefined"
          />
          {{ label }}
        </label>
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
      <span v-if="description" :id="descId">{{ description }}</span>
      <div :id="errorId" class="oo-error-slot" :role="error ? 'alert' : undefined">
        {{ error || hint }}
      </div>
    </template>
  </div>
</template>
