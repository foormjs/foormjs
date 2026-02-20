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
  const foormState = inject<TFoormState>('__foorm_form')
  const formData = inject<ComputedRef<TFormData | undefined>>('__foorm_form_data')
  const formContext = inject<ComputedRef<TContext | undefined>>('__foorm_form_context')

  const id = Symbol('foorm-field')
  const submitError = ref<string>()
  const externalError = ref<string>()
  const touched = ref(false)
  const blur = ref(false)

  const model = computed<TValue>({
    get: opts.getValue,
    set: opts.setValue,
  })

  watch(
    model,
    () => {
      submitError.value = undefined
      externalError.value = undefined
      touched.value = true
    },
    {}
  )

  const isValidationActive = computed(() => {
    if (!foormState?.firstValidation) return false
    switch (foormState.firstValidation) {
      case 'on-change':
        return foormState.firstSubmitHappened || touched.value
      case 'touched-on-blur':
        return foormState.firstSubmitHappened || (blur.value && touched.value)
      case 'on-blur':
        return foormState.firstSubmitHappened || blur.value
      case 'on-submit':
        return foormState.firstSubmitHappened
      default:
        return false
    }
  })

  function validate(): string | undefined {
    if (opts.rules?.length) {
      for (const rule of opts.rules) {
        const result = rule(
          model.value as TValue,
          formData?.value as TFormData,
          formContext?.value as TContext
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
    // Return submitError directly — validate() already ran during the submit callback,
    // calling it again here would double-validate every field on every submit.
    if (submitError.value) return submitError.value
    if (isValidationActive.value) {
      return validate()
    }
    return undefined
  })

  function onBlur() {
    blur.value = true
  }

  // Register with form
  if (foormState) {
    foormState.register(id, {
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
    foormState?.unregister(id)
  })

  return { model, error, onBlur }
}
