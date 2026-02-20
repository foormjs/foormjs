import type { TValidatorPlugin } from '@atscript/typescript/utils'
import type { TFoormFieldEvaluated } from './types'
import { compileValidatorFn } from './fn-compiler'
import { resolveFieldProp, resolveOptions, getFieldMeta, asArray } from './utils'

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

    // Field name from the validator's current path
    const fieldName = ctx.path.split('.').pop() || ''

    // Base scope for evaluating constraints (no entry yet)
    const baseScope = { v: value, data, context, entry: undefined }

    // Resolve constraints for the entry snapshot
    const optional =
      resolveFieldProp<boolean>(def, 'foorm.fn.optional', 'foorm.optional', baseScope, {
        staticAsBoolean: true,
      }) ?? def.optional

    // Build entry object with field metadata
    const entry: TFoormFieldEvaluated = {
      field: ctx.path,
      type: getFieldMeta(def, 'foorm.type') || 'text',
      component: getFieldMeta(def, 'foorm.component'),
      name: fieldName,
      optional,
      disabled: resolveFieldProp<boolean>(def, 'foorm.fn.disabled', 'foorm.disabled', baseScope, {
        staticAsBoolean: true,
      }),
      hidden: resolveFieldProp<boolean>(def, 'foorm.fn.hidden', 'foorm.hidden', baseScope, {
        staticAsBoolean: true,
      }),
      readonly: resolveFieldProp<boolean>(def, 'foorm.fn.readonly', 'foorm.readonly', baseScope, {
        staticAsBoolean: true,
      }),
    }

    // Full scope with evaluated entry
    const scope = { v: value, data, context, entry }

    // Evaluate options (static or computed)
    entry.options = resolveOptions(def, scope)

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
