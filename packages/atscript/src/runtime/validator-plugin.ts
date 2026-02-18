import type { TFoormFieldEvaluated, TFoormEntryOptions } from './types'
import { compileValidatorFn, compileFieldFn } from './fn-compiler'

/**
 * ATScript validator plugin that processes @foorm.validate annotations
 * and optionally handles form-level concerns (disabled/hidden skip, required check).
 *
 * Uses ATScript 0.1.10 external context: data/context are passed per-call
 * via `validator.validate(value, safe, context)` and read from `ctx.context`.
 *
 * Usage:
 *   // Per-field validation (foorm rule) — only @foorm.validate
 *   const plugin = foormValidatorPlugin()
 *   const validator = new Validator(field.prop, { plugins: [plugin] })
 *   validator.validate(value, true, { data: formData, context })
 *
 *   // Whole-form validation — skip + required + @foorm.validate + @expect.*
 *   const plugin = foormValidatorPlugin({ skipDisabledHidden: true, checkRequired: true })
 *   const validator = new Validator(type, { plugins: [plugin], unknwonProps: 'ignore' })
 *   validator.validate(formData, true, { data, context })
 */

/** Static plugin configuration — set once at plugin creation time. */
export interface TFoormPluginOptions {
  /** When true, return `true` (accept/skip) for disabled or hidden fields. */
  skipDisabledHidden?: boolean
  /** When true, check foorm-style required (empty string/undefined/null → 'Required' error). */
  checkRequired?: boolean
}

/** Per-call context passed via `validator.validate(value, safe, context)`. */
export interface TFoormValidatorContext {
  data: Record<string, unknown>
  context: Record<string, unknown>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TValidatorPlugin = (ctx: any, def: any, value: unknown) => boolean | undefined

/**
 * Creates an ATScript validator plugin that processes `@foorm.validate` annotations
 * and optionally handles form-level concerns (disabled/hidden skip, required check).
 *
 * @param opts - Plugin configuration: skipDisabledHidden, checkRequired
 * @returns An ATScript validator plugin function
 */
export function foormValidatorPlugin(opts?: TFoormPluginOptions): TValidatorPlugin {
  return (ctx, def, value) => {
    const foormCtx = ctx.context as TFoormValidatorContext | undefined
    const data = foormCtx?.data ?? {}
    const context = foormCtx?.context ?? {}

    const hasValidators = def.metadata?.get('foorm.validate')
    const needsProcessing = hasValidators || opts?.skipDisabledHidden || opts?.checkRequired
    if (!needsProcessing) return undefined

    // Base scope for evaluating constraints
    const baseScope = { v: value, data, context, entry: undefined }

    // Resolve constraints
    const disabled = evalConstraint(def.metadata, 'foorm.disabled', 'foorm.fn.disabled', baseScope)
    const hidden = evalConstraint(def.metadata, 'foorm.hidden', 'foorm.fn.hidden', baseScope)

    // Skip disabled/hidden fields (form-level validation)
    if (opts?.skipDisabledHidden && (disabled || hidden)) return true

    const optional =
      evalConstraint(def.metadata, 'foorm.optional', 'foorm.fn.optional', baseScope) ?? def.optional

    // Foorm-level required check (empty string, undefined, null = missing)
    if (opts?.checkRequired && !optional && !value && value !== 0 && value !== false) {
      ctx.error('Required')
      return false
    }

    // @foorm.validate custom validators
    if (hasValidators) {
      const fns = Array.isArray(hasValidators) ? hasValidators : [hasValidators]

      // Build entry object with field metadata
      const entry: TFoormFieldEvaluated = {
        field: def.name || '',
        type: (def.metadata?.get('foorm.type') as string) || 'text',
        component: def.metadata?.get('foorm.component') as string | undefined,
        name: def.name || '',
        disabled,
        optional,
        hidden,
        readonly: evalConstraint(def.metadata, 'foorm.readonly', 'foorm.fn.readonly', baseScope),
      }

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
    }

    return undefined // fall through to @expect.* validation
  }
}

/** Helper to evaluate a boolean constraint (static or computed) */
function evalConstraint(
  metadata: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  staticKey: string,
  fnKey: string,
  scope: any // eslint-disable-line @typescript-eslint/no-explicit-any
): boolean | undefined {
  const fnStr = metadata?.get(fnKey)
  if (typeof fnStr === 'string') {
    return compileFieldFn<boolean>(fnStr)(scope)
  }
  const staticVal = metadata?.get(staticKey)
  return staticVal !== undefined ? true : undefined
}

/** Helper to evaluate options (static or computed) */
function evalOptions(
  metadata: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  scope: any // eslint-disable-line @typescript-eslint/no-explicit-any
): TFoormEntryOptions[] | undefined {
  const fnStr = metadata?.get('foorm.fn.options')
  if (typeof fnStr === 'string') {
    return compileFieldFn<TFoormEntryOptions[]>(fnStr)(scope)
  }

  const staticOpts = metadata?.get('foorm.options')
  if (staticOpts) {
    const items = Array.isArray(staticOpts) ? staticOpts : [staticOpts]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return items.map((item: any) => {
      if (typeof item === 'object' && item !== null && 'label' in item) {
        const { label, value } = item as { label: string; value?: string }
        return value !== undefined ? { key: value, label } : label
      }
      return String(item)
    })
  }

  return undefined
}
