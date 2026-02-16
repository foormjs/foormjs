import { compileValidatorFn, compileFieldFn } from './fn-compiler'
import { type TFoormFieldEvaluated, type TFoormEntryOptions } from 'foorm'

/**
 * ATScript validator plugin that processes @foorm.validate annotations.
 *
 * Reads the `foorm.validate` annotation value(s) from the metadata,
 * compiles each function string, and executes it with the current value
 * and form data/context from validator options.
 *
 * Evaluates computed constraints (disabled, optional, hidden, readonly) and
 * options (static or computed) to build an entry object passed to validators.
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

    // Build entry object with field metadata
    const entry: TFoormFieldEvaluated = {
      field: def.name,
      type: def.metadata?.get('foorm.type') || 'text',
      component: def.metadata?.get('foorm.component'),
      name: def.name,
    }

    // Base scope for evaluating constraints
    const baseScope = { v: value, data, context, entry: undefined }

    // Evaluate computed constraints
    entry.disabled = evalConstraint(def.metadata, 'foorm.disabled', 'foorm.fn.disabled', baseScope)
    entry.optional = evalConstraint(def.metadata, 'foorm.optional', 'foorm.fn.optional', baseScope)
    entry.hidden = evalConstraint(def.metadata, 'foorm.hidden', 'foorm.fn.hidden', baseScope)
    entry.readonly = evalConstraint(def.metadata, 'foorm.readonly', 'foorm.fn.readonly', baseScope)

    // Full scope with evaluated entry
    const scope = { v: value, data, context, entry }

    // Evaluate options (static or computed)
    entry.options = evalOptions(def.metadata, scope)

    // Run custom validators with full scope
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

    return undefined
  }
}

/** Helper to evaluate a boolean constraint (static or computed) */
function evalConstraint(
  metadata: any,
  staticKey: string,
  fnKey: string,
  scope: any
): boolean | undefined {
  const fnStr = metadata?.get(fnKey)
  if (typeof fnStr === 'string') {
    return compileFieldFn<boolean>(fnStr)(scope)
  }
  const staticVal = metadata?.get(staticKey)
  return staticVal !== undefined ? true : undefined
}

/** Helper to evaluate options (static or computed) */
function evalOptions(metadata: any, scope: any): TFoormEntryOptions[] | undefined {
  const fnStr = metadata?.get('foorm.fn.options')
  if (typeof fnStr === 'string') {
    return compileFieldFn<TFoormEntryOptions[]>(fnStr)(scope)
  }

  const staticOpts = metadata?.get('foorm.options')
  if (staticOpts) {
    const items = Array.isArray(staticOpts) ? staticOpts : [staticOpts]
    return items.map(item => {
      if (typeof item === 'object' && item !== null && 'label' in item) {
        const { label, value } = item as { label: string; value?: string }
        return value !== undefined ? { key: value, label } : label
      }
      return String(item)
    })
  }

  return undefined
}
