/* eslint-disable @typescript-eslint/naming-convention */
import { isCleanFn, serializeFn } from '@prostojs/serialize-fn'

import type { Foorm } from './foorm'
import type { TComputed, TComputedWithVal, TFoormSerialized, TSerializedFn } from './types'

export function serializeForm<D, C>(
  form: Foorm<D, C>,
  opts?: {
    replaceContext?: C
    replaceValues?: Record<string, unknown>
  }
): TFoormSerialized {
  const def = form.getDefinition()
  return {
    title: serializeComputedFn(def.title),
    submit: {
      text: serializeComputedFn(def.submit.text || 'Submit'),
      disabled: serializeComputedFn(def.submit.disabled) as boolean,
    },
    context: opts?.replaceContext || def.context,
    entries: def.entries.map(e => ({
      ...e,
      // strings
      label: serializeComputedFnWithVal(e.label) as string,
      description: serializeComputedFnWithVal(e.description) as string,
      hint: serializeComputedFnWithVal(e.hint) as string,
      placeholder: serializeComputedFnWithVal(e.placeholder) as string,
      // strings || objects
      classes: serializeComputedFnWithVal(
        e.classes as TComputedWithVal<string, any, D, C>,
        true
      ) as string,
      styles: serializeComputedFnWithVal(e.styles, true) as string,
      // booleans
      optional: serializeComputedFnWithVal(e.optional) as TSerializedFn,
      disabled: serializeComputedFnWithVal(e.disabled) as TSerializedFn,
      hidden: serializeComputedFnWithVal(e.hidden) as TSerializedFn,
      // options
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      options: serializeComputedFnWithVal(e.options) as any,
      // attrs
      attrs: serializeComputedFnWithVal(e.attrs, true) as Record<string, TSerializedFn>,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      value: opts?.replaceValues ? opts.replaceValues[e.field] : e.value,
      validators: (e.validators || [])
        .filter(v => isCleanFn(v))
        .map(fn => serializeComputedFnWithVal(fn)) as TSerializedFn[],
    })),
  }
}

function serializeComputedFn<OF, D, C>(fn?: TComputed<OF, D, C>): OF | TSerializedFn {
  if (typeof fn === 'function') {
    return { __fn__: serializeFn(fn as () => any, 'data', 'context') }
  }
  return fn as OF
}

function serializeComputedFnWithVal<OF, V, D, C>(
  fn?: TComputedWithVal<OF, V, D, C> | Record<string, TComputedWithVal<OF, V, D, C>>,
  inObj?: boolean
): Record<string, TSerializedFn> | OF | TSerializedFn {
  if (inObj && typeof fn === 'object') {
    const o = {} as Record<string, TSerializedFn>
    for (const [key, val] of Object.entries(fn as Record<string, TComputedWithVal<OF, V, D, C>>)) {
      o[key] = serializeComputedFnWithVal(val) as TSerializedFn
    }
    return o as OF | TSerializedFn
  }
  if (typeof fn === 'function') {
    return { __fn__: serializeFn(fn as () => any, 'v', 'data', 'context', 'entry') }
  }
  return fn as OF
}
