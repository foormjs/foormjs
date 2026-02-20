import type { TAtscriptAnnotatedType, TValidatorOptions } from '@atscript/typescript/utils'
import { Validator } from '@atscript/typescript/utils'
import type { FoormDef } from './types'
import { getFieldMeta } from './utils'
import { foormValidatorPlugin } from './validator-plugin'

const _foormPlugin = foormValidatorPlugin()

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
  const validator = new Validator(def.type, {
    plugins: [_foormPlugin],
    unknwonProps: 'ignore',
    ...opts,
  })

  // OoForm passes domain data directly (unwrapped from { value: ... } wrapper)
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

// ── Field-level validator ────────────────────────────────────

/** Options for createFieldValidator. */
export interface TFieldValidatorOptions {
  /** Only report errors at the root path (for structure/array container validation). */
  rootOnly?: boolean
}

/**
 * Creates a cached validator function for a single ATScript prop.
 *
 * The `Validator` instance is created lazily on first call and reused on
 * every subsequent call. Returns `true` when valid, or the first error
 * message string when invalid.
 *
 * @param prop - ATScript annotated type for the field
 * @param opts - Optional validator options (rootOnly)
 * @returns A validate function `(value, externalCtx?) => true | string`
 */
export function createFieldValidator(
  prop: TAtscriptAnnotatedType,
  opts?: TFieldValidatorOptions
): (value: unknown, externalCtx?: { data: unknown; context: unknown }) => true | string {
  let cached: InstanceType<typeof Validator> | undefined

  return (value: unknown, externalCtx?: { data: unknown; context: unknown }): true | string => {
    cached ??= new Validator(prop, { plugins: [_foormPlugin] })
    const isValid = cached.validate(value, true, externalCtx)
    if (!isValid) {
      if (opts?.rootOnly) {
        const rootError = cached.errors?.find(e => e.path === '')
        if (rootError) return rootError.message
        return true
      }
      return cached.errors?.[0]?.message || 'Invalid value'
    }
    return true
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
  return def.fields.some(f => getFieldMeta(f.prop, 'foorm.altAction')?.id === altAction)
}
