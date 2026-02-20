import { computed, nextTick, provide, reactive, toValue, watchEffect, type MaybeRef } from 'vue'
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

  // Stable functions — outside computed to avoid re-creation on reactivity ticks
  const register = (id: symbol, registration: TFoormFieldRegistration) => {
    fieldsById.set(id, registration)
  }
  const unregister = (id: symbol) => {
    fieldsById.delete(id)
  }

  // Reactive object — properties are mutated in-place so Vue's fine-grained
  // reactivity only invalidates dependents that read the specific changed property
  // (e.g. firstSubmitHappened), instead of every consumer on every tick.
  const foormState = reactive<TFoormState>({
    firstSubmitHappened: false,
    firstValidation: toValue(opts.firstValidation) ?? 'on-change',
    register,
    unregister,
  })

  // Sync firstValidation from opts (may be a ref)
  watchEffect(() => {
    foormState.firstValidation = toValue(opts.firstValidation) ?? 'on-change'
  })

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
    foormState.firstSubmitHappened = false
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
    foormState.firstSubmitHappened = true
    if (foormState.firstValidation === 'none') return true

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
