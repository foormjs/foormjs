<script setup lang="ts">
import { useActionRefs } from '../../composables/entry-refs';
import { TFeActionProps } from './types'

const props = defineProps<TFeActionProps>()
const { classes, disabledState } = useActionRefs(props)
</script>

<template>
    <button
        class="oo-form-action"
        :disabled="!!disabledState"
        :class="classes"
        v-html="text"
    />
</template>