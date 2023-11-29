<script setup lang="ts">
import { Foorm } from 'foorm'
import type { TFoormEntry, TFoormAction, TFoormUiMetadata, TFoormActionUI } from 'foorm'
import components from './fe'
import { ref, watch, computed } from 'vue'
import FeAction from './fe/fe-action.vue'

type Props = {
    title?: string
    entries: TFoormEntry[]
    actions?: TFoormAction[]
    validate?: TFoormUiMetadata['validate']
    values: Record<string, unknown>
    errors?: Record<string, string>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'action', action: TFoormAction): void
}>()

const uiMeta = ref<TFoormUiMetadata>()
const form = new Foorm()
const actionAttempt = ref(false)
const enableValidation = computed(() => {
  const v = props.validate || 'always'
  switch (v) {
    case 'always': return true
    case 'on-action-only': return false
    case 'after-action-attempt': return actionAttempt.value
    case 'never': return false
  }
})

updateUiMetadata()
watch(() => [props.entries, props.actions], updateUiMetadata)

function updateUiMetadata() {
    form.setEntries(props.entries)
    form.setActions(props.actions || [])
    uiMeta.value = form.getUiMetadata()
}

watch(() => props.errors, () => {
  if (props.errors) {
    innerErrors.value = props.errors
  }
})

const innerErrors = ref<Record<string, string>>(props.errors || {})
const validator = form.getFormValidator()
function validate() {
  const result = validator(props.values || {})
  innerErrors.value = result.errors || {}
  return result
}

function onAction(action: TFoormActionUI) {
  if (action.type === 'submit') {
    actionAttempt.value = true
    if (props.validate === 'never' || validate().passed) {
      emit('action', props.actions?.find(a => a.type === action.type && a.action === action.action) as TFoormAction)
    }
  }
}
</script>

<template>
<section class="oo-form oo-vars">
    <div v-if="!!title" class="oo-title">{{ title }}</div>

    <template v-for="entry of uiMeta?.entries">
        <component 
        v-if="!!entry.component && !!components[entry.component as 'fe-input']"
        :key="entry.id"
        :is="components[entry.component as 'fe-input']"
        v-bind="{ ...entry, ...(entry.bind || {}) }"
        :inputs="values"
        v-model="(values[entry.field || ''] as string)"
        :error="innerErrors[entry.field || ''] || undefined"
        :enable-validation="enableValidation"
        />
        <div v-else class="oo-text-negative oo-text-small"> Unknown component "{{ entry.component }}"</div>
    </template>
    <slot name="actions" :validate="validate" :values="values">
      <fe-action v-for="action of uiMeta?.actions" v-bind="action" :inputs="values" @click="onAction(action)" />
    </slot>
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