import type { TFoormState } from '@foormjs/composables'
import { inject, type ComputedRef } from 'vue'

/**
 * Injects root form data and returns a function to access it consistently.
 * Fallback chain: `__foorm_root_data` → `foormState.formData` → `{}`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRootFormData<TFormData = any, TFormContext = any>(): () => Record<
  string,
  unknown
> {
  const rootData = inject<ComputedRef<TFormData>>('__foorm_root_data')
  const foormState = inject<ComputedRef<TFoormState<TFormData, TFormContext>>>('__foorm_form')

  return () => (rootData?.value ?? foormState?.value?.formData ?? {}) as Record<string, unknown>
}
