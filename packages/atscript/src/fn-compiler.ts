import type { TFoormFnScope } from 'foorm'
import { FNPool } from '@prostojs/deserialize-fn'

const pool = new FNPool()

/**
 * Compiles a field-level function string from a @foorm.fn.* annotation
 * into a callable function. Uses FNPool for caching.
 *
 * The function string should be an arrow or regular function expression:
 *   "(v, data, ctx, entry) => !data.firstName"
 *
 * The compiled function receives a single TFoormFnScope object:
 *   { v, data, context, entry }
 */
export function compileFieldFn<R = unknown>(fnStr: string): (scope: TFoormFnScope) => R {
  const code = `return (${fnStr})(v, data, context, entry)`
  return pool.getFn(code) as (scope: TFoormFnScope) => R
}

/**
 * Compiles a form-level function string from a @foorm.fn.title,
 * @foorm.fn.submit.text, or @foorm.fn.submit.disabled annotation.
 *
 * The function string should be:
 *   "(data, ctx) => someExpression"
 *
 * The compiled function receives a single TFoormFnScope object:
 *   { data, context }
 */
export function compileTopFn<R = unknown>(fnStr: string): (scope: TFoormFnScope) => R {
  const code = `return (${fnStr})(data, context)`
  return pool.getFn(code) as (scope: TFoormFnScope) => R
}

/**
 * Compiles a validator function string from a @foorm.validate annotation.
 *
 * The function string should be:
 *   "(v, data, ctx, entry) => boolean | string"
 *
 * The compiled function receives a single TFoormFnScope object:
 *   { v, data, context, entry }
 */
export function compileValidatorFn(fnStr: string): (scope: TFoormFnScope) => boolean | string {
  const code = `return (${fnStr})(v, data, context, entry)`
  return pool.getFn(code) as (scope: TFoormFnScope) => boolean | string
}
