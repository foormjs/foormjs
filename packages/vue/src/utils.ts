import type { TFoormFnScope } from 'foorm'
import { evalParameter } from 'foorm'

export function evalFnObj<T>(value: T, scope: TFoormFnScope) {
  if (typeof value === 'object' && value !== null) {
    const obj: Record<string, T> = {}
    for (const [key, val] of Object.entries(value)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      obj[key] = evalParameter(val, scope, true) as T
    }
    return obj
  }
  return evalParameter(value, scope, true) as T
}
