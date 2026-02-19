import type { TFoormFieldEvaluated, TFoormFnScope } from '@foormjs/atscript'
import type { TFoormState } from '@foormjs/composables'
import { computed, inject, type ComputedRef } from 'vue'

/**
 * Unified injection composable for oo-* components.
 * Consolidates `__foorm_form`, `__foorm_root_data`, and `__foorm_path_prefix`
 * into a single call with shared helpers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFoormContext<TFormData = any, TFormContext = any>(componentName: string) {
  // ── Form state (with throw guard) ─────────────────────────
  const _foormState = inject<ComputedRef<TFoormState<TFormData, TFormContext>>>('__foorm_form')
  if (!_foormState) {
    throw new Error(`${componentName} must be used inside an OoForm component`)
  }
  const foormState = _foormState

  // ── Root form data (fallback chain) ───────────────────────
  const rootData = inject<ComputedRef<TFormData>>('__foorm_root_data')
  const rootFormData = () =>
    (rootData?.value ?? foormState.value?.formData ?? {}) as Record<string, unknown>

  // ── Path prefix ───────────────────────────────────────────
  const pathPrefix = inject<ComputedRef<string>>(
    '__foorm_path_prefix',
    computed(() => '')
  )

  // ── Derived: formContext with fallback ────────────────────
  const formContext = computed(
    () => (foormState.value.formContext ?? {}) as Record<string, unknown>
  )

  // ── Path-join utility (reactive — returns ComputedRef) ────
  function joinPath(segment: string | undefined): ComputedRef<string | undefined> {
    return computed(() => {
      if (segment === undefined) return pathPrefix.value || undefined
      return pathPrefix.value ? `${pathPrefix.value}.${segment}` : segment
    })
  }

  // ── Path-build utility (non-reactive — plain function) ───
  function buildPath(segment: string | undefined): string | undefined {
    if (segment === undefined) return pathPrefix.value || undefined
    return pathPrefix.value ? `${pathPrefix.value}.${segment}` : segment
  }

  // ── Scope builder ───────────────────────────────────────────
  function buildScope(v?: unknown, entry?: TFoormFieldEvaluated): TFoormFnScope {
    return { v, data: rootFormData(), context: formContext.value, entry }
  }

  return { foormState, rootFormData, pathPrefix, formContext, joinPath, buildPath, buildScope }
}
