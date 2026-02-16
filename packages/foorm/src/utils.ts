import type { TComputed, TFoormFnScope } from './types'

/**
 * Resolves a TComputed value: if it's a function, calls it with
 * the scope. Otherwise returns the static value as-is.
 */
export function evalComputed<T>(value: TComputed<T>, scope: TFoormFnScope): T
export function evalComputed<T>(value: TComputed<T> | undefined, scope: TFoormFnScope): T | undefined
export function evalComputed<T>(value: TComputed<T> | undefined, scope: TFoormFnScope): T | undefined {
  if (typeof value === 'function') {
    return (value as (scope: TFoormFnScope) => T)(scope)
  }
  return value
}
