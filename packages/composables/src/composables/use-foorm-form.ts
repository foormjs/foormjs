import { computed, nextTick, provide, ref, toValue, type MaybeRef } from 'vue'
import type { TFoormFieldRegistration, TFoormState } from '../types'

/** Custom form-level validator. Returns `Record<path, message>` (empty = passed). */
export type TFoormSubmitValidator = () => Record<string, string>

export function useFoormForm<TFormData, TContext>(opts: {
  formData: MaybeRef<TFormData>
  formContext?: MaybeRef<TContext>
  firstValidation?: MaybeRef<TFoormState['firstValidation'] | undefined>
  /** When provided, replaces per-field iteration on submit. */
  submitValidator?: TFoormSubmitValidator
}) {
  const fieldsById = new Map<symbol, TFoormFieldRegistration>()
  const firstSubmitHappened = ref(false)

  // Stable functions — outside computed to avoid re-creation on reactivity ticks
  const register = (id: symbol, registration: TFoormFieldRegistration) => {
    fieldsById.set(id, registration)
  }
  const unregister = (id: symbol) => {
    fieldsById.delete(id)
  }

  // foormState is decoupled from formData/formContext — it only changes on
  // validation-state transitions (firstSubmitHappened, firstValidation), NOT on
  // every keystroke. formData and formContext are provided separately.
  const foormState = computed<TFoormState>(() => ({
    firstSubmitHappened: firstSubmitHappened.value,
    firstValidation: toValue(opts.firstValidation) ?? 'on-change',
    register,
    unregister,
  }))

  provide('__foorm_form', foormState)
  provide(
    '__foorm_form_data',
    computed(() => toValue(opts.formData))
  )
  provide(
    '__foorm_form_context',
    computed(() => (opts.formContext ? toValue(opts.formContext) : undefined))
  )

  function clearErrors() {
    firstSubmitHappened.value = false
    for (const reg of fieldsById.values()) {
      reg.callbacks.clearErrors()
    }
  }

  async function reset() {
    for (const reg of fieldsById.values()) {
      reg.callbacks.reset()
    }
    await nextTick()
    clearErrors()
  }

  function submit(): true | { path: string; message: string }[] {
    firstSubmitHappened.value = true
    const fv = toValue(opts.firstValidation) ?? 'on-change'
    if (fv === 'none') return true

    // Custom form-level validator — replaces per-field iteration
    if (opts.submitValidator) {
      const errors = opts.submitValidator()
      const entries = Object.entries(errors)
      if (entries.length === 0) return true
      setErrors(errors)
      return entries.map(([path, message]) => ({ path, message }))
    }

    // Fallback: per-field iteration
    const errors: { path: string; message: string }[] = []
    for (const reg of fieldsById.values()) {
      const result = reg.callbacks.validate()
      if (result !== true) {
        const path = reg.path()
        errors.push({ path, message: result as string })
      }
    }
    return errors.length > 0 ? errors : true
  }

  function setErrors(errors: Record<string, string>) {
    for (const reg of fieldsById.values()) {
      const p = reg.path()
      reg.callbacks.setExternalError(errors[p])
    }
  }

  return { clearErrors, reset, submit, setErrors, foormState }
}
