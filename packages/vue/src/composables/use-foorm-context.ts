import type { TFoormFieldEvaluated, TFoormFnScope } from '@foormjs/atscript'
import { getByPath as _getByPath, setByPath as _setByPath } from '@foormjs/atscript'
import type { TFoormState } from '@foormjs/composables'
import { computed, inject, provide, type ComputedRef } from 'vue'
import type { TFoormUnionContext } from '../components/types'

const EMPTY_PREFIX = computed(() => '')

/**
 * Unified injection composable for oo-* components.
 * Consolidates `__foorm_form`, `__foorm_root_data`, and `__foorm_path_prefix`
 * into a single call with shared helpers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFoormContext<TFormData = any, TFormContext = any>(componentName: string) {
  // ── Form state (with throw guard) ─────────────────────────
  const _foormState = inject<TFoormState>('__foorm_form')
  if (!_foormState) {
    throw new Error(`${componentName} must be used inside an OoForm component`)
  }
  const foormState = _foormState

  // ── Root form data ─────────────────────────────────────────
  const rootData = inject<ComputedRef<TFormData>>('__foorm_root_data')
  const rootFormData = () => (rootData?.value ?? {}) as Record<string, unknown>

  // ── Path prefix ───────────────────────────────────────────
  const pathPrefix = inject<ComputedRef<string>>('__foorm_path_prefix', EMPTY_PREFIX)

  // ── Form context (separate injection — decoupled from foormState) ──
  const _formContext = inject<ComputedRef<TFormContext | undefined>>('__foorm_form_context')
  const formContext = computed(() => (_formContext?.value ?? {}) as Record<string, unknown>)

  // ── Path-join utility (reactive — returns ComputedRef) ────
  function joinPath(segment: string | (() => string)): ComputedRef<string> {
    return computed(() => {
      const s = typeof segment === 'function' ? segment() : segment
      if (!s) return pathPrefix.value
      return pathPrefix.value ? `${pathPrefix.value}.${s}` : s
    })
  }

  // ── Path-build utility (non-reactive — plain function) ───
  function buildPath(segment: string): string {
    if (!segment) return pathPrefix.value
    return pathPrefix.value ? `${pathPrefix.value}.${segment}` : segment
  }

  // ── Path-aware data access (closure over rootFormData) ──────
  function getByPath(path: string): unknown {
    return _getByPath(rootFormData(), path)
  }

  function setByPath(path: string, value: unknown): void {
    _setByPath(rootFormData(), path, value)
  }

  // ── Scope builder ───────────────────────────────────────────
  function buildScope(v?: unknown, entry?: TFoormFieldEvaluated): TFoormFnScope {
    const rd = rootFormData()
    return { v, data: rd.value as Record<string, unknown>, context: formContext.value, entry }
  }

  return {
    foormState,
    rootFormData,
    pathPrefix,
    formContext,
    joinPath,
    buildPath,
    getByPath,
    setByPath,
    buildScope,
  }
}

/**
 * Consume and clear the `__foorm_union` injection.
 *
 * Structured components (object, tuple, array, field-shell) call this to
 * read the union context provided by `OoUnion` and immediately clear it
 * so nested children don't inherit it.
 */
export function useConsumeUnionContext(): TFoormUnionContext | undefined {
  const unionCtx = inject<TFoormUnionContext | undefined>('__foorm_union', undefined)
  provide('__foorm_union', undefined)
  return unionCtx
}

/**
 * Format a label/title with an array-index prefix.
 *
 * When `arrayIndex` is defined, prepends `#<index+1>` to the label.
 * Used by field-shell (label) and object (title) components for array items.
 */
export function formatIndexedLabel(
  label: string | undefined,
  arrayIndex: number | undefined
): string | undefined {
  if (arrayIndex !== undefined) {
    return label ? `${label} #${arrayIndex + 1}` : `#${arrayIndex + 1}`
  }
  return label
}
