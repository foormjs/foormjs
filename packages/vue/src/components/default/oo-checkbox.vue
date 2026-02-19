<script setup lang="ts">
import { useId } from 'vue'
import type { TFoormComponentProps } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
defineProps<TFoormComponentProps<unknown, any, any>>()

const id = useId()
const inputId = `oo-checkbox-${id}`
const errorId = `oo-checkbox-${id}-err`
const descId = `oo-checkbox-${id}-desc`
</script>

<template>
  <div class="oo-default-field oo-checkbox-field" :class="$props.class" v-show="!hidden">
    <label :for="inputId">
      <input
        :id="inputId"
        type="checkbox"
        v-model="model.value"
        @blur="onBlur"
        :name="name"
        :disabled="disabled"
        :readonly="readonly"
        :aria-invalid="!!error || undefined"
        :aria-describedby="error || hint ? errorId : description ? descId : undefined"
      />
      {{ label }}
    </label>
    <span v-if="description" :id="descId">{{ description }}</span>
    <div :id="errorId" class="oo-error-slot" :role="error ? 'alert' : undefined">
      {{ error || hint }}
    </div>
  </div>
</template>
