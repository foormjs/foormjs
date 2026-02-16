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

export type TFoormEntryOptions = { key: string; label: string } | string

/**
 * A single form field definition with static or computed properties.
 */
export interface TFoormField {
  field: string
  type: string
  component?: string
  autocomplete?: string
  altAction?: string
  order?: number
  name?: string

  // Description (static or computed)
  label: TComputed<string>
  description?: TComputed<string>
  hint?: TComputed<string>
  placeholder?: TComputed<string>

  // Constraints (static or computed)
  optional: TComputed<boolean>
  disabled: TComputed<boolean>
  hidden: TComputed<boolean>
  readonly: TComputed<boolean>

  // Appearance (static or computed)
  classes?: TComputed<string | Record<string, boolean>>
  styles?: TComputed<string | Record<string, string>>

  // Options for select/radio/checkbox
  options?: TComputed<TFoormEntryOptions[]>

  // Additional HTML attributes
  attrs?: Record<string, TComputed<unknown>>

  // Default value (static or computed)
  value?: TComputed<unknown>

  // Validators: each returns true for pass, or error message string
  validators: Array<(scope: TFoormFnScope) => boolean | string>

  // ATScript @expect constraints (for HTML attributes like maxlength)
  maxLength?: number
  minLength?: number
  min?: number
  max?: number
}

/**
 * Submit button configuration.
 */
export interface TFoormSubmit {
  text: TComputed<string>
  disabled?: TComputed<boolean>
}

/**
 * Complete form model — produced by createFoorm() in @foormjs/atscript.
 */
export interface TFoormModel {
  title?: TComputed<string>
  submit: TFoormSubmit
  fields: TFoormField[]
}
