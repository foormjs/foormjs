import type { TFoormField, TFoormFieldEvaluated, TFoormFnScope, TFoormModel } from './types'
import { evalComputed } from './utils'

/**
 * Runs validators for a single field. Returns on first failure.
 */
export function validate(
  validators: TFoormField['validators'],
  scope: TFoormFnScope
): { passed: true } | { passed: false; error: string } {
  for (const validator of validators) {
    const result = validator(scope)
    if (result !== true) {
      return {
        passed: false,
        error: typeof result === 'string' ? result : 'Invalid value',
      }
    }
  }
  return { passed: true }
}

/** Field types that are UI-only elements, excluded from form data and validation. */
const NON_DATA_TYPES = new Set(['action', 'paragraph'])

/**
 * Creates initial form data from field default values.
 * Skips non-data field types (action, paragraph).
 * Evaluates computed default values with empty scope.
 */
export function createFormData<T = Record<string, unknown>>(fields: TFoormField[]): T {
  const data = {} as Record<string, unknown>
  for (const f of fields) {
    if (!NON_DATA_TYPES.has(f.type)) {
      // Evaluate default value with minimal scope (data will be populated as we go)
      const scope: TFoormFnScope = {
        v: undefined,
        data,
        context: {},
        entry: {
          field: f.field,
          type: f.type,
          component: f.component,
          name: f.name || f.field,
        },
      }
      data[f.field] = evalComputed(f.value, scope) ?? undefined
    }
  }
  return data as T
}

/**
 * Returns a validator function for the whole form.
 * Evaluates disabled/hidden/optional per field, skips disabled/hidden,
 * enforces required, then runs custom validators.
 */
export function getFormValidator(
  model: TFoormModel,
  context?: unknown
): (data: Record<string, unknown>) => { passed: boolean; errors: Record<string, string> } {
  return (data: Record<string, unknown>) => {
    let passed = true
    const errors: Record<string, string> = {}

    for (const f of model.fields) {
      if (NON_DATA_TYPES.has(f.type)) {
        continue
      }

      const entry: TFoormFieldEvaluated = {
        field: f.field,
        type: f.type,
        component: f.component,
        name: f.name || f.field,
      }

      const scope: TFoormFnScope = {
        v: data[f.field],
        data,
        context: (context ?? {}) as Record<string, unknown>,
        entry,
      }

      // Resolve computed constraints
      entry.disabled = evalComputed(f.disabled, scope)
      entry.optional = evalComputed(f.optional, scope)
      entry.hidden = evalComputed(f.hidden, scope)
      entry.readonly = evalComputed(f.readonly, scope)
      entry.options = evalComputed(f.options, scope)

      // Skip disabled and hidden fields
      if (entry.disabled || entry.hidden) {
        continue
      }

      // Required check
      if (!entry.optional && !data[f.field]) {
        errors[f.field] = 'Required'
        passed = false
        continue
      }

      // Custom validators
      const result = validate(f.validators, scope)
      if (!result.passed) {
        errors[f.field] = result.error
        passed = false
      }
    }

    return { passed, errors }
  }
}

/**
 * Checks if any field in the model declares the given altAction.
 */
export function supportsAltAction(model: TFoormModel, altAction: string): boolean {
  return model.fields.some(f => f.altAction === altAction)
}
