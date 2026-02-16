import { compileValidatorFn } from './fn-compiler'

/**
 * ATScript validator plugin that processes @foorm.validate annotations.
 *
 * Reads the `foorm.validate` annotation value(s) from the metadata,
 * compiles each function string, and executes it with the current value
 * and form data/context from validator options.
 *
 * Usage:
 *   import { foormValidatorPlugin } from '@foormjs/atscript'
 *
 *   const validator = MyForm.validator({
 *     plugins: [foormValidatorPlugin()],
 *   })
 *
 * Pass form data and context via validator options:
 *   validator.validate(fieldValue, true) // safe mode
 *
 * For whole-form validation, iterate props and validate each field.
 */

export interface TFoormValidatorContext {
  data?: Record<string, unknown>
  context?: Record<string, unknown>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TValidatorPlugin = (ctx: any, def: any, value: unknown) => boolean | undefined

export function foormValidatorPlugin(foormCtx?: TFoormValidatorContext): TValidatorPlugin {
  return (ctx, def, value) => {
    const validators = def.metadata?.get('foorm.validate')
    if (!validators) {
      return undefined
    }

    const fns = Array.isArray(validators) ? validators : [validators]
    const data = foormCtx?.data ?? {}
    const context = foormCtx?.context ?? {}

    for (const fnStr of fns) {
      if (typeof fnStr !== 'string') {
        continue
      }

      const fn = compileValidatorFn(fnStr)
      const result = fn({ v: value, data, context })

      if (result !== true) {
        ctx.error(typeof result === 'string' ? result : 'Validation failed')
        return false
      }
    }

    return undefined
  }
}
