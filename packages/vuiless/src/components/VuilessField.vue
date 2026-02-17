<script setup lang="ts" generic="TValue, TFormData, TContext">
import { inject, ref, watch, computed, getCurrentInstance, onUnmounted } from 'vue'
import type { ComputedRef } from 'vue'
import type { TVuilessRule, TVuilessState } from './vuiless.types'

type Props = {
  rules?: TVuilessRule<TValue, TFormData, TContext>[]
}
const props = defineProps<Props>()
const modelValue = defineModel<TValue>()

const vuiless = inject<ComputedRef<TVuilessState<TFormData, TContext>>>('vuiless')

// submitError stores error when the field is not
// yet touched, but submit button is clicked
const submitError = ref<string>()
const touched = ref(false)
const blur = ref(false)

const isValidationActive = computed(() => {
  if (vuiless?.value?.firstValidation) {
    switch (vuiless.value.firstValidation) {
      case 'on-change':
        return vuiless.value.firstSubmitHappened || touched.value
      case 'touched-on-blur':
        return vuiless.value.firstSubmitHappened || (blur.value && touched.value)
      case 'on-blur':
        return vuiless.value.firstSubmitHappened || blur.value
      case 'on-submit':
        return vuiless.value.firstSubmitHappened
      case 'none':
        return false
    }
  }
  return false
})

const error = computed<string | undefined>(() => {
  if (isValidationActive.value || submitError.value) {
    return validate()
  }
})

watch([modelValue], () => {
  submitError.value = undefined
  touched.value = true
})

onUnmounted(() => {
  vuiless?.value?.unregister(getCurrentInstance())
})

// registering field in form
if (vuiless?.value) {
  vuiless.value.register(getCurrentInstance(), {
    validate: () => {
      submitError.value = validate()
      return submitError.value || true
    },
    clearErrors: () => {
      touched.value = false
      blur.value = false
      submitError.value = undefined
    },
    reset: () => {
      modelValue.value = '' as TValue
    },
  })
}

function validate() {
  if (props.rules?.length) {
    for (const rule of props.rules) {
      const result = rule(
        modelValue.value as TValue,
        vuiless?.value?.formData,
        vuiless?.value?.formContext
      )
      if (result !== true) {
        return result || 'Wrong value'
      }
    }
  }
}

function onBlur() {
  blur.value = true
}

const model = {
  v: computed({
    get: () => modelValue.value,
    set: v => (modelValue.value = v),
  }),
}
</script>

<template>
  <slot
    :on-blur="onBlur"
    :error="error"
    :form-data="vuiless?.formData"
    :form-context="vuiless?.formContext"
    :model="model.v"
  >
  </slot>
</template>
