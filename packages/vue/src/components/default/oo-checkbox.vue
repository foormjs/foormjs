<script setup lang="ts">
import type { TFoormComponentProps } from '../types'
import OoFieldShell from '../internal/oo-field-shell.vue'

defineProps<TFoormComponentProps>()
</script>

<template>
  <OoFieldShell v-bind="$props" field-class="oo-checkbox-field" id-prefix="oo-checkbox">
    <template #header="{ optionalEnabled }">
      <span v-if="optional && !optionalEnabled" class="oo-field-label">{{ label }}</span>
    </template>
    <template #default="{ inputId, errorId, descId }">
      <label :for="inputId">
        <input
          :id="inputId"
          type="checkbox"
          :checked="!!model.value"
          @change="model.value = ($event.target as HTMLInputElement).checked; onBlur()"
          @blur="onBlur"
          :name="name"
          :disabled="disabled"
          :readonly="readonly"
          :aria-invalid="!!error || undefined"
          :aria-describedby="error || hint ? errorId : description ? descId : undefined"
        />
        {{ label }}
      </label>
    </template>
    <template #after-input="{ descId }">
      <span v-if="description" :id="descId">{{ description }}</span>
    </template>
  </OoFieldShell>
</template>
