/* eslint-disable @typescript-eslint/naming-convention */
import { FNPool } from '@prostojs/deserialize-fn'

import { Foorm } from './foorm'
import type {
  TFoormEntryOptions,
  TFoormMetaExecutable,
  TFoormSerialized,
  TFoormValidatorFn,
  TSerializedFn,
} from './types'

const pool = new FNPool()

export function deserializeForm<D = unknown, C = unknown>(form: TFoormSerialized): Foorm<D, C> {
  return new Foorm({
    title: deserializeComputedFn(form.title) as string,
    context: form.context as C,
    submit: deserializeComputedFn(form.submit, true) as TFoormMetaExecutable<D, C>['submit'],
    entries: form.entries.map(e => ({
      ...e,
      // strings
      label: deserializeComputedFn(e.label) as string,
      description: deserializeComputedFn(e.description) as string,
      hint: deserializeComputedFn(e.hint) as string,
      placeholder: deserializeComputedFn(e.placeholder) as string,
      // strings || objects
      classes: deserializeComputedFn(e.classes, true) as string,
      styles: deserializeComputedFn(e.styles, true) as string,
      // booleans
      optional: deserializeComputedFn<boolean, unknown, unknown>(e.optional) as boolean,
      disabled: deserializeComputedFn<boolean, unknown, unknown>(e.disabled) as boolean,
      hidden: deserializeComputedFn<boolean, unknown, unknown>(e.hidden) as boolean,
      // options
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      options: deserializeComputedFn(e.options) as TFoormEntryOptions[],
      // attrs
      attrs: deserializeComputedFn(e.attrs, true) as Record<string, any>,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      value: e.value,
      validators: (e.validators || []).map(fn => deserializeComputedFn(fn)) as unknown as Array<
        TFoormValidatorFn<any, D, C>
      >,
    })),
  })
}

function deserializeComputedFn<T, D, C>(
  v?: TSerializedFn | T,
  asObj?: boolean
): T | ((__ctx__: unknown) => T) {
  if (typeof v === 'object' && typeof (v as TSerializedFn).__fn__ === 'string') {
    const fn = pool.getFn((v as TSerializedFn).__fn__) as {
      (__ctx__: unknown): unknown
      __deserialized: boolean
    }
    fn.__deserialized = true
    return fn as T
  }
  if (typeof v === 'object' && asObj) {
    const o = {} as Record<string, T>
    for (const [key, val] of Object.entries(v as Record<string, TSerializedFn | T>)) {
      o[key] = deserializeComputedFn(val) as T
    }
    return o as T
  }
  return v as T
}
