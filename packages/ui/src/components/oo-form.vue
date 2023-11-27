<script setup lang="ts">
import { Foorm } from 'foorm'
import type { TFoormEntry, TFoormEntryUI } from 'foorm'
import components from './fe'
import { ref, watch } from 'vue';

type Props = {
    title?: string
    entries: TFoormEntry[]
    defaultAction?: string
    values: Record<string, unknown>
}

const props = defineProps<Props>()
const uiEntries = ref<TFoormEntryUI[]>()
const form = new Foorm()
// const formData = ref<Record<string, unknown>>({})

updateUiEntries()
watch(() => props.entries, updateUiEntries)

function updateUiEntries() {
    form.setEntries(props.entries)
    uiEntries.value = form.genUIEntries()
}

const errors = ref<Record<string, string>>({})
const validator = form.getFormValidator()
function validate() {
  const result = validator(props.values || {})
  errors.value = result.errors || {}
  return result
}
</script>

<template>
<section class="oo-form oo-vars">
    <div v-if="!!title" class="oo-title">{{ title }}</div>

    <template v-for="entry of uiEntries">
        <component 
        v-if="!!entry.component && !!components[entry.component as 'fe-input']"
        :key="entry.id"
        :is="components[entry.component as 'fe-input']"
        v-bind="{ ...entry, ...(entry.bind || {}) }"
        :inputs="values"
        v-model="(values[entry.field || ''] as string)"
        :error="errors[entry.field || ''] || undefined"
        />
        <div v-else class="oo-text-negative oo-text-small"> Unknown component "{{ entry.component }}"</div>
    </template>

    <slot name="actions" :validate="validate" :values="values"></slot>
</section>
</template>

<style>
@import "./css/oo-base.css";
@import "./css/oo-form.css";

.oo-form {

}

.oo-form .oo-text-negative {
  color: var(--oo-c-negative);
}

.oo-form .oo-text-neutral {
  color: var(--oo-c-neutral);
}

.oo-form .oo-text-cetner {
  text-align: center;
}
</style>