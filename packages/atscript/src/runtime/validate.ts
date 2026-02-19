import { Validator } from '@atscript/typescript/utils'
import type { TValidatorOptions } from '@atscript/typescript/utils'
import type { FoormDef } from './types'
import { getFieldMeta } from './utils'
import { foormValidatorPlugin } from './validator-plugin'

/** Per-call options for the form validator function. */
export interface TFormValidatorCallOptions {
  data: Record<string, unknown>
  context?: Record<string, unknown>
}

/**
 * Returns a reusable validator function for a whole FoormDef.
 *
 * Plugin and Validator are created once and reused on every call.
 * Per-call data/context is passed via ATScript's external context mechanism.
 *
 * The foormValidatorPlugin handles custom @foorm.validate validators.
 * ATScript's @expect.* validation runs for remaining fields.
 *
 * @param def - The FoormDef produced by createFoormDef
 * @param opts - Optional ATScript validator options
 * @returns A function that validates form data and returns `Record<string, string>` (empty = passed)
 */
export function getFormValidator(
  def: FoormDef,
  opts?: Partial<TValidatorOptions>
): (callOpts: TFormValidatorCallOptions) => Record<string, string> {
  const plugin = foormValidatorPlugin()
  const validator = new Validator(def.type, {
    plugins: [plugin],
    unknwonProps: 'ignore',
    ...opts,
  })

  return (callOpts: TFormValidatorCallOptions) => {
    const isValid = validator.validate(callOpts.data, true, {
      data: callOpts.data,
      context: callOpts.context ?? {},
    })
    if (isValid) return {}

    const errors: Record<string, string> = {}
    for (const err of validator.errors) {
      errors[err.path] = err.message
    }
    return errors
  }
}

/**
 * Checks if any field in the form supports a given alternate action.
 *
 * @param def - The FoormDef to search
 * @param altAction - The alternate action name to look for (e.g., `'skip'`)
 * @returns `true` if at least one field has a matching `@foorm.altAction` annotation
 */
export function supportsAltAction(def: FoormDef, altAction: string): boolean {
  return def.fields.some(
    f => getFieldMeta<{ id: string }>(f.prop, 'foorm.altAction')?.id === altAction
  )
}
