<script setup lang="ts">
import type { FoormObjectFieldDef } from '@foormjs/atscript'
import { isObjectField } from '@foormjs/atscript'
import { computed } from 'vue'
import type { TFoormComponentProps } from '../types'
import OoIterator from '../oo-iterator.vue'
import OoNoData from './oo-no-data.vue'
import OoStructuredHeader from './oo-structured-header.vue'

const props = defineProps<TFoormComponentProps>()

const objectDef = isObjectField(props.field!)
  ? (props.field as FoormObjectFieldDef).objectDef
  : undefined

// In array context, show #<index+1> (with or without title)
const displayTitle = computed(() => {
  const idx = props.arrayIndex
  if (idx !== undefined) {
    return props.title ? `${props.title} #${idx + 1}` : `#${idx + 1}`
  }
  return props.title
})

const optionalEnabled = computed(() => props.model?.value !== undefined)
</script>

<template>
  <div
    class="oo-object"
    :class="{ 'oo-object--root': level === 0, 'oo-object--nested': (level ?? 0) > 0 }"
    v-show="!hidden"
  >
    <OoStructuredHeader
      :title="displayTitle"
      :level="level"
      :on-remove="onRemove && objectDef ? onRemove : undefined"
      :can-remove="canRemove"
      :remove-label="removeLabel"
      :optional="optional"
      :optional-enabled="optionalEnabled"
      :on-toggle-optional="onToggleOptional"
    />

    <template v-if="optional && !optionalEnabled">
      <OoNoData :on-edit="() => onToggleOptional?.(true)" />
    </template>
    <template v-else>
      <div v-if="error" class="oo-object-error" role="alert">{{ error }}</div>
      <OoIterator v-if="objectDef" :def="objectDef" />
    </template>
  </div>
</template>

<style>
.oo-object {
  margin: 12px 0;
}

.oo-object--nested {
  padding-left: 16px;
  border-left: 2px solid #d1d5db;
}

.oo-object--root {
  /* Root object: no left border, no extra padding */
}

.oo-object-error {
  font-size: 12px;
  color: #ef4444;
  margin-bottom: 4px;
}
</style>
