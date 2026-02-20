<script setup lang="ts">
import type { TFoormComponentProps } from '../types'

defineProps<TFoormComponentProps>()
</script>

<template>
  <p v-show="!hidden" aria-live="polite">{{ value }}</p>
</template>
