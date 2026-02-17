<script setup lang="ts" generic="TFormData, TContext">
import { provide, ref, computed, nextTick } from 'vue'
import type { ComponentInstance } from 'vue'
import type { TVuilessState, TVuilessFieldCallbacks } from './vuiless.types'

type Props = {
  formData: TFormData
  formContext?: TContext
  firstValidation?: TVuilessState<TFormData, TContext>['firstValidation']
}

const props = withDefaults(defineProps<Props>(), {
  firstValidation: 'on-change',
})

const emit = defineEmits<{
  (e: 'submit', data: TFormData): void
}>()

const fieldsRegistry: Map<ComponentInstance<any>, TVuilessFieldCallbacks> = new Map()
const firstSubmitHappened = ref(false)

const vuiless = computed<TVuilessState<TFormData, TContext>>(() => ({
  firstSubmitHappened: firstSubmitHappened.value,
  firstValidation: props.firstValidation,
  register: (instance: ComponentInstance<any>, fieldCallbacks: TVuilessFieldCallbacks) => {
    fieldsRegistry.set(instance, fieldCallbacks)
  },
  unregister: (instance: ComponentInstance<any>) => fieldsRegistry.delete(instance),
  formData: props.formData,
  formContext: props.formContext,
}))

provide('vuiless', vuiless)

function clearErrors() {
  firstSubmitHappened.value = false
  for (const { clearErrors } of fieldsRegistry.values()) {
    clearErrors()
  }
}

async function resetForm() {
  for (const { reset } of fieldsRegistry.values()) {
    reset()
  }
  await nextTick()
  clearErrors()
}

function onSubmit() {
  firstSubmitHappened.value = true
  let hasErrors = false
  if (props.firstValidation !== 'none') {
    for (const { validate } of fieldsRegistry.values()) {
      if (validate() !== true) {
        hasErrors = true
      }
    }
  }
  if (hasErrors) {
    return
  }
  emit('submit', props.formData)
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <slot :clear-errors="clearErrors" :reset="resetForm"></slot>
  </form>
</template>
