<script setup lang="ts">
import type { TFoormComponentProps } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
defineProps<TFoormComponentProps<unknown, any, any>>()
</script>

<template>
  <p v-show="!hidden" aria-live="polite">{{ value }}</p>
</template>
