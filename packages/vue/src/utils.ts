import type { TFoormFn, TFoormFnScope } from 'foorm'

export function evalFn<T>(value: T | TFoormFn<unknown, T> | undefined, scope: TFoormFnScope) {
  return (isFn(value) ? value(scope) : value) as T
}

export function evalFnObj<T>(value: T, scope: TFoormFnScope) {
  if (typeof value === 'object' && value !== null) {
    const obj: Record<string, T> = {}
    for (const [key, val] of Object.entries(value)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      obj[key] = evalFn<T>(val, scope)
    }
    return obj
  }
  return (isFn(value) ? value(scope) : value) as T
}

function isFn(a: unknown): a is TFoormFn {
  return typeof a === 'function'
}
