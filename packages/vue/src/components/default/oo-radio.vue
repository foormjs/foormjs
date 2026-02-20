<script setup lang="ts">
import { optKey, optLabel } from '@foormjs/atscript'
import type { TFoormComponentProps } from '../types'
import OoFieldShell from './oo-field-shell.vue'

defineProps<TFoormComponentProps>()
</script>

<template>
  <OoFieldShell v-bind="$props" field-class="oo-radio-field" id-prefix="oo-radio">
    <template #header="{ inputId, descId }">
      <span :id="inputId" class="oo-field-label">{{ label }}</span>
      <span v-if="description" :id="descId">{{ description }}</span>
    </template>
    <template #default="{ inputId, errorId, descId }">
      <div
        class="oo-radio-group"
        role="radiogroup"
        :aria-labelledby="inputId"
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
    </template>
  </OoFieldShell>
</template>
