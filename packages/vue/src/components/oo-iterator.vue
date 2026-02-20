<script setup lang="ts">
import type { FoormDef } from '@foormjs/atscript'
import { computed, inject, provide, type ComputedRef } from 'vue'
import OoField from './oo-field.vue'

const props = defineProps<{
  def: FoormDef
  pathPrefix?: string
  onRemove?: () => void
  canRemove?: boolean
  removeLabel?: string
}>()

// Path prefix management
const parentPrefix = inject<ComputedRef<string>>(
  '__foorm_path_prefix',
  computed(() => '')
)
const myPrefix = computed(() => {
  if (props.pathPrefix !== undefined) {
    return parentPrefix.value ? `${parentPrefix.value}.${props.pathPrefix}` : props.pathPrefix
  }
  return parentPrefix.value
})
provide('__foorm_path_prefix', myPrefix)
</script>

<template>
  <OoField
    v-for="f of def.fields"
    :key="f.path ?? f.name"
    :field="f"
    :on-remove="onRemove"
    :can-remove="canRemove"
    :remove-label="removeLabel"
  />
</template>
