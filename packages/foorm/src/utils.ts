/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  TComputed,
  TComputedWithVal,
  TFoormFnScope,
  TFoormFnSerializedField,
  TFoormFnTop,
} from './types'

export function evalParameter<OF>(
  fn: TComputed<OF, any, any> | TComputedWithVal<OF, any, any, any>,
  scope: TFoormFnScope<any, any, any>,
  forField?: boolean
): OF | undefined {
  if (typeof fn === 'function') {
    if ((fn as TFoormFnSerializedField<boolean, any, any, any>).__deserialized) {
      return (fn as TFoormFnSerializedField<boolean, any, any, any>)(scope) as OF
    } else {
      const args = (forField
        ? [scope.v, scope.data, scope.context, scope.entry!]
        : [scope.data, scope.context, scope.entry!]) as unknown as [any, any]
      return (fn as TFoormFnTop<OF, any, any>)(...args)
    }
  }
  return fn
}
