import type { TAtscriptAnnotatedType } from '@atscript/typescript/utils'
import { Validator } from '@atscript/typescript/utils'
import { foormValidatorPlugin } from '@foormjs/atscript'

const validatorOpts = { plugins: [foormValidatorPlugin()] }

interface UseFoormValidatorOptions {
  /** Only report errors at the root path (for group/array container validation). */
  rootOnly?: boolean
}

/**
 * Cached ATScript validator for a single prop.
 * Creates a `Validator` lazily on first call, reuses it on every subsequent call.
 */
export function useFoormValidator(prop: TAtscriptAnnotatedType, opts?: UseFoormValidatorOptions) {
  let cached: InstanceType<typeof Validator> | undefined

  function validate(
    value: unknown,
    externalCtx?: { data: unknown; context: unknown }
  ): true | string {
    cached ??= new Validator(prop, validatorOpts)
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

  return { validate }
}
