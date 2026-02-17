import type { TAtscriptAnnotatedType, TAtscriptTypeObject } from '@atscript/typescript/utils'

/**
 * Scope object passed to computed functions.
 * Properties become variables inside compiled function strings:
 *   v, data, context, entry
 */
export interface TFoormFnScope<
  V = unknown,
  D = Record<string, unknown>,
  C = Record<string, unknown>,
> {
  v?: V
  data: D
  context: C
  entry?: TFoormFieldEvaluated
  action?: string
}

/**
 * A value that is either static or a function of the form scope.
 */
export type TComputed<T> = T | ((scope: TFoormFnScope) => T)

/**
 * Minimal evaluated snapshot of a field — passed to validators and
 * computed functions as `entry`.
 */
export interface TFoormFieldEvaluated {
  field: string
  type: string
  component?: string
  name: string
  disabled?: boolean
  optional?: boolean
  hidden?: boolean
  readonly?: boolean
  options?: TFoormEntryOptions[]
}

/** An option for select/radio fields — either a plain string or a `{ key, label }` pair. */
export type TFoormEntryOptions = { key: string; label: string } | string

/**
 * A single form field definition — thin pointer to the ATScript prop.
 *
 * All metadata (label, disabled, options, etc.) lives in `prop.metadata`
 * and is resolved on demand via resolve utilities.
 */
export interface FoormFieldDef {
  path: string
  prop: TAtscriptAnnotatedType
  type: string
  phantom: boolean
  name: string
  /** True when no foorm.fn.* metadata keys exist. Vue perf flag. */
  allStatic: boolean
}

/**
 * Complete form definition — produced by createFoormDef().
 * Form-level metadata (title, submit) resolved on demand via resolveFormProp.
 */
export interface FoormDef {
  type: TAtscriptAnnotatedType<TAtscriptTypeObject>
  fields: FoormFieldDef[]
  flatMap: Map<string, TAtscriptAnnotatedType>
}
