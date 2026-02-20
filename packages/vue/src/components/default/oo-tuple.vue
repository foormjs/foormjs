<script setup lang="ts">
import type { FoormTupleFieldDef } from '@foormjs/atscript'
import { isTupleField } from '@foormjs/atscript'
import { computed } from 'vue'
import type { TFoormComponentProps } from '../types'
import OoField from '../oo-field.vue'
import OoOptionalNa from './oo-optional-na.vue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<TFoormComponentProps<unknown, any, any>>()

const tupleField = isTupleField(props.field!)
  ? (props.field as FoormTupleFieldDef)
  : undefined

const optionalEnabled = computed(() => props.model?.value !== undefined)
</script>

<template>
  <div class="oo-tuple" v-show="!hidden">
    <div v-if="title || optional" class="oo-tuple-header">
      <div class="oo-tuple-header-content">
        <h3 v-if="title" class="oo-tuple-title">{{ title }}</h3>
      </div>
      <button
        v-if="optional && optionalEnabled"
        type="button"
        class="oo-optional-clear"
        @click="onToggleOptional?.(false)"
      >
        &times;
      </button>
    </div>

    <template v-if="optional && !optionalEnabled">
      <OoOptionalNa :on-edit="() => onToggleOptional?.(true)" />
    </template>
    <template v-else>
      <template v-if="tupleField">
        <OoField v-for="(itemField, i) in tupleField.itemFields" :key="i" :field="itemField" />
      </template>

      <div v-if="error" class="oo-tuple-error" role="alert">{{ error }}</div>
    </template>
  </div>
</template>

<style>
.oo-tuple-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.oo-tuple-header-content {
  flex: 1;
}

.oo-tuple-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.oo-tuple-error {
  font-size: 12px;
  color: #ef4444;
}
</style>
