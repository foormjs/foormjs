<script setup lang="ts">
import type { TFoormComponentProps } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
defineProps<TFoormComponentProps<unknown, any, any>>()
const emit = defineEmits<{
  (e: 'action', name: string): void
}>()
</script>

<template>
  <div class="oo-default-field oo-action-field" :class="$props.class" v-show="!hidden">
    <button type="button" @click="altAction && emit('action', altAction.id)">
      {{ altAction?.label }}
    </button>
  </div>
</template>
