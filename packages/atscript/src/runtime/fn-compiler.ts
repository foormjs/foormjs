import type { TFoormFnScope } from './types'
import { FNPool } from '@prostojs/deserialize-fn'

const pool = new FNPool()

/**
 * Compiles a field-level function string from a `@foorm.fn.*` annotation
 * into a callable function. Uses FNPool for caching.
 *
 * The function string should be an arrow or regular function expression:
 *   `"(v, data, ctx, entry) => !data.firstName"`
 *
 * The compiled function receives a single TFoormFnScope object:
 *   `{ v, data, context, entry }`
 *
 * @param fnStr - The function string from a `@foorm.fn.*` metadata annotation
 * @returns A compiled function that takes a TFoormFnScope and returns the result
 */
export function compileFieldFn<R = unknown>(fnStr: string): (scope: TFoormFnScope) => R {
  const code = `return (${fnStr})(v, data, context, entry)`
  return pool.getFn(code) as (scope: TFoormFnScope) => R
}

/**
 * Compiles a form-level function string from a `@foorm.fn.title`,
 * `@foorm.fn.submit.text`, or `@foorm.fn.submit.disabled` annotation.
 *
 * The function string should be:
 *   `"(data, ctx) => someExpression"`
 *
 * The compiled function receives a single TFoormFnScope object:
 *   `{ data, context }`
 *
 * @param fnStr - The function string from a form-level `@foorm.fn.*` metadata annotation
 * @returns A compiled function that takes a TFoormFnScope and returns the result
 */
export function compileTopFn<R = unknown>(fnStr: string): (scope: TFoormFnScope) => R {
  const code = `return (${fnStr})(data, context)`
  return pool.getFn(code) as (scope: TFoormFnScope) => R
}

/**
 * Compiles a validator function string from a `@foorm.validate` annotation.
 * Delegates to `compileFieldFn` with a narrowed return type.
 *
 * The function string should be:
 *   `"(v, data, ctx, entry) => boolean | string"`
 *
 * Returns `true` for valid, or a string error message for invalid.
 *
 * @param fnStr - The function string from a `@foorm.validate` metadata annotation
 * @returns A compiled validator function that takes a TFoormFnScope and returns `true` or an error string
 */
export function compileValidatorFn(fnStr: string) {
  return compileFieldFn<boolean | string>(fnStr)
}
