import { computed, inject, onUnmounted, ref, watch, type ComputedRef } from 'vue'
import type { TFoormRule, TFoormState } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UseFoormFieldOptions<TValue = any, TFormData = any, TContext = any> {
  getValue: () => TValue
  setValue: (v: TValue) => void
  rules?: TFoormRule<TValue, TFormData, TContext>[]
  path: () => string
  /** Value to set on reset. Defaults to `''`. Use `[]` for arrays, `{}` for objects. */
  resetValue?: TValue
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFoormField<TValue = any, TFormData = any, TContext = any>(
  opts: UseFoormFieldOptions<TValue, TFormData, TContext>
) {
  const foormState = inject<ComputedRef<TFoormState<TFormData, TContext>>>('__foorm_form')

  const id = Symbol('foorm-field')
  const submitError = ref<string>()
  const externalError = ref<string>()
  const touched = ref(false)
  const blur = ref(false)

  const model = computed<TValue>({
    get: opts.getValue,
    set: opts.setValue,
  })

  watch(model, () => {
    submitError.value = undefined
    externalError.value = undefined
    touched.value = true
  }, { deep: true })

  const isValidationActive = computed(() => {
    if (foormState?.value?.firstValidation) {
      switch (foormState.value.firstValidation) {
        case 'on-change':
          return foormState.value.firstSubmitHappened || touched.value
        case 'touched-on-blur':
          return foormState.value.firstSubmitHappened || (blur.value && touched.value)
        case 'on-blur':
          return foormState.value.firstSubmitHappened || blur.value
        case 'on-submit':
          return foormState.value.firstSubmitHappened
        case 'none':
          return false
      }
    }
    return false
  })

  function validate(): string | undefined {
    if (opts.rules?.length) {
      for (const rule of opts.rules) {
        const result = rule(
          model.value as TValue,
          foormState?.value?.formData,
          foormState?.value?.formContext
        )
        if (result !== true) {
          return (result as string) || 'Wrong value'
        }
      }
    }
    return undefined
  }

  const error = computed<string | undefined>(() => {
    if (externalError.value) return externalError.value
    if (isValidationActive.value || submitError.value) {
      return validate()
    }
    return undefined
  })

  function onBlur() {
    blur.value = true
  }

  // Register with form
  if (foormState?.value) {
    foormState.value.register(id, {
      path: opts.path,
      callbacks: {
        validate: () => {
          submitError.value = validate()
          return submitError.value || true
        },
        clearErrors: () => {
          touched.value = false
          blur.value = false
          submitError.value = undefined
          externalError.value = undefined
        },
        reset: () => {
          model.value = (opts.resetValue ?? '') as TValue
        },
        setExternalError: (msg?: string) => {
          externalError.value = msg
        },
      },
    })
  }

  onUnmounted(() => {
    foormState?.value?.unregister(id)
  })

  return { model, error, onBlur }
}
