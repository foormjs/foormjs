import type { TValidatorPlugin } from '@atscript/typescript/utils'
import { compileValidatorFn } from './fn-compiler'
import { buildFieldEntry, getFieldMeta, asArray } from './utils'

/**
 * ATScript validator plugin that processes @foorm.validate annotations.
 *
 * Uses ATScript 0.1.10 external context: data/context are passed per-call
 * via `validator.validate(value, safe, context)` and read from `ctx.context`.
 *
 * Usage:
 *   const plugin = foormValidatorPlugin()
 *   const validator = new Validator(field.prop, { plugins: [plugin] })
 *   validator.validate(value, true, { data: formData, context })
 */

/** Per-call context passed via `validator.validate(value, safe, context)`. */
export interface TFoormValidatorContext {
  data: Record<string, unknown>
  context: Record<string, unknown>
}

/**
 * Creates an ATScript validator plugin that processes `@foorm.validate` annotations.
 *
 * @returns An ATScript validator plugin function
 */
export function foormValidatorPlugin(): TValidatorPlugin {
  return (ctx, def, value) => {
    const hasValidators = getFieldMeta(def, 'foorm.validate')
    if (!hasValidators) return undefined

    const foormCtx = ctx.context as TFoormValidatorContext | undefined
    const data = foormCtx?.data ?? {}
    const context = foormCtx?.context ?? {}

    // Build entry + full scope via shared dual-scope utility
    const baseScope = { v: value, data, context, entry: undefined }
    const scope = buildFieldEntry(def, baseScope, ctx.path)

    // Run custom validators with full scope
    const fns = asArray(hasValidators)
    for (const fnStr of fns) {
      if (typeof fnStr !== 'string') {
        continue
      }

      const fn = compileValidatorFn(fnStr)
      const result = fn(scope)

      if (result !== true) {
        ctx.error(typeof result === 'string' ? result : 'Validation failed')
        return false
      }
    }

    return undefined // fall through to @expect.* validation
  }
}
