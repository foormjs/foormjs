<script setup lang="ts">
import type { FoormTupleFieldDef } from '@foormjs/atscript'
import { isTupleField } from '@foormjs/atscript'
import { computed } from 'vue'
import type { TFoormComponentProps } from '../types'
import { useConsumeUnionContext } from '../../composables/use-foorm-context'
import OoField from '../oo-field.vue'
import OoNoData from './oo-no-data.vue'
import OoStructuredHeader from './oo-structured-header.vue'

const props = defineProps<TFoormComponentProps>()

const tupleField = isTupleField(props.field!) ? (props.field as FoormTupleFieldDef) : undefined

// ── Union context: consume and clear for nested children ────
const unionCtx = useConsumeUnionContext()

const optionalEnabled = computed(() => props.model?.value !== undefined)
</script>

<template>
  <div class="oo-tuple" v-show="!hidden">
    <OoStructuredHeader
      :title="title"
      :level="level"
      :on-remove="onRemove"
      :can-remove="canRemove"
      :remove-label="removeLabel"
      :optional="optional"
      :optional-enabled="optionalEnabled"
      :on-toggle-optional="onToggleOptional"
      :disabled="disabled"
      :union-context="unionCtx"
    />

    <template v-if="optional && !optionalEnabled">
      <OoNoData :on-edit="() => onToggleOptional?.(true)" />
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
.oo-tuple {
  margin: 12px 0;
}

.oo-tuple-error {
  font-size: 12px;
  color: #ef4444;
}
</style>
