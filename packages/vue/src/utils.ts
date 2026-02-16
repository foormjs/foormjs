import type { TComputed, TFoormFnScope } from 'foorm'
import { evalComputed } from 'foorm'

export function evalAttrs(
  attrs: Record<string, TComputed<unknown>> | undefined,
  scope: TFoormFnScope
): Record<string, unknown> | undefined {
  if (!attrs) {return undefined}
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(attrs)) {
    result[key] = evalComputed(val, scope)
  }
  return result
}
