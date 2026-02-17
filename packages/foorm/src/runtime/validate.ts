import { Validator } from '@atscript/typescript/utils'
import type { TValidatorOptions } from '@atscript/typescript/utils'
import type { FoormDef } from './types'
import { getFieldMeta } from './utils'
import { foormValidatorPlugin } from './validator-plugin'

/**
 * Returns a reusable validator function for a whole FoormDef.
 *
 * Plugin and Validator are created once and reused on every call.
 * Per-call data/context is passed via ATScript's external context mechanism.
 *
 * The foormValidatorPlugin handles:
 * - Skipping disabled/hidden fields (skipDisabledHidden)
 * - Foorm-style required check (checkRequired)
 * - Custom @foorm.validate validators
 * ATScript's @expect.* validation runs for remaining fields.
 *
 * @param def - The FoormDef produced by createFoormDef
 * @param opts - Optional configuration: external context object and ATScript validator options
 * @returns A function that validates form data and returns `{ passed, errors }`
 */
export function getFormValidator(
  def: FoormDef,
  opts?: {
    context?: unknown
    validatorOptions?: Partial<TValidatorOptions>
  }
): (data: Record<string, unknown>) => { passed: boolean; errors: Record<string, string> } {
  const plugin = foormValidatorPlugin({ skipDisabledHidden: true, checkRequired: true })
  const validator = new Validator(def.type, {
    plugins: [plugin],
    unknwonProps: 'ignore',
    ...opts?.validatorOptions,
  })

  return (data: Record<string, unknown>) => {
    const isValid = validator.validate(data, true, {
      data,
      context: (opts?.context ?? {}) as Record<string, unknown>,
    })
    if (isValid) return { passed: true, errors: {} as Record<string, string> }

    const errors: Record<string, string> = {}
    for (const err of validator.errors) {
      errors[err.path] = err.message
    }
    return { passed: false, errors }
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
  return def.fields.some(f => getFieldMeta<string>(f.prop, 'foorm.altAction') === altAction)
}
