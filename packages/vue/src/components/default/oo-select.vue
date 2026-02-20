<script setup lang="ts">
import { optKey, optLabel } from '@foormjs/atscript'
import type { TFoormComponentProps } from '../types'
import OoFieldShell from '../internal/oo-field-shell.vue'

defineProps<TFoormComponentProps>()
</script>

<template>
  <OoFieldShell v-bind="$props" id-prefix="oo-select">
    <template #default="{ inputId, errorId, descId }">
      <select
        :id="inputId"
        v-model="model.value"
        @change="onBlur"
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
    </template>
  </OoFieldShell>
</template>
