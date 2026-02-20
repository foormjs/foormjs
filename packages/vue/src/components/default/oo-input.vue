<script setup lang="ts">
import type { TFoormComponentProps } from '../types'
import OoFieldShell from './oo-field-shell.vue'

defineProps<TFoormComponentProps>()
</script>

<template>
  <OoFieldShell v-bind="$props" id-prefix="oo-input">
    <template #default="{ inputId, errorId, descId }">
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
    </template>
  </OoFieldShell>
</template>
