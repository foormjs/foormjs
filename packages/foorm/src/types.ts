/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */

export type TFoormFnTop<OF, D, C> = (data: D, ctx: C) => OF
export type TFoormFnField<OF, V, D, C> = (v: V, data: D, ctx: C, entry: TFoormEntryEvaluated) => OF
export interface TFoormFnSerializedTop<OF, D, C> {
  (ctx: TFoormFnScope<undefined, D, C>): OF
  __deserialized?: boolean
}
export interface TFoormFnSerializedField<OF, V, D, C> {
  (ctx: TFoormFnScope<V, D, C>): OF
  __deserialized?: boolean
}

export type TComputed<OF, D, C> = OF | TFoormFnTop<OF, D, C> | TFoormFnSerializedTop<OF, D, C>
export type TComputedWithVal<OF, V, D, C> =
  | OF
  | TFoormFnField<OF, V, D, C>
  | TFoormFnSerializedField<OF, V, D, C>

export interface TFoormFnScope<
  V = string,
  D = Record<string, unknown>,
  C = Record<string, unknown>,
> {
  v?: V
  data: D
  context: C
  entry?: TFoormEntryEvaluated
  action?: string
}
export type TFoormValidatorFn<V, D, C> = Exclude<
  Exclude<TComputedWithVal<boolean | string, V, D, C>, boolean>,
  string
>

export type TFoormEntryOptions = { key: string; label: string } | string
export interface TFoormEntry<V, D, C, O extends TFoormEntryOptions> {
  field: string
  altAction?: string

  // description
  label?: TComputedWithVal<string, V, D, C>
  description?: TComputedWithVal<string, V, D, C>
  hint?: TComputedWithVal<string, V, D, C>
  placeholder?: TComputedWithVal<string, V, D, C>

  // appearence
  classes?: TComputedWithVal<string, V, D, C> | Record<string, TComputedWithVal<boolean, V, D, C>>
  styles?: TComputedWithVal<string, V, D, C> | Record<string, TComputedWithVal<string, V, D, C>>

  // behavior
  type?: string
  component?: string
  autocomplete?: string

  // field mapping
  name?: string
  value?: V

  // data options
  options?: O[] | TComputedWithVal<O[], V, D, C>

  // additional attributes
  attrs?: Record<string, TComputedWithVal<any, V, D, C>>

  // constraits
  optional?: TComputedWithVal<boolean, V, D, C>
  disabled?: TComputedWithVal<boolean, V, D, C>
  hidden?: TComputedWithVal<boolean, V, D, C>
  length?: number
  validators?: Array<TFoormValidatorFn<V, D, C>>
}

export interface TFoormMetaExecutable<D, C> {
  title: TComputed<string, D, C>
  submit: {
    text: TComputed<string, D, C>
    disabled?: TComputed<boolean, D, C>
  }
  context: C
  entries: Array<TFoormEntry<any, D, C, TFoormEntryOptions>>
}

export interface TSerializedFn {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __fn__: string
}

export interface TFoormSerialized<V = any, O = any> {
  title?: string | TSerializedFn
  submit: {
    text: string | TSerializedFn
    disabled: boolean | TSerializedFn
  }
  context: any
  entries: Array<{
    field: string
    altAction?: string

    // description
    label?: string | TSerializedFn
    description?: string | TSerializedFn
    hint?: string | TSerializedFn
    placeholder?: string | TSerializedFn

    // appearence
    classes?: string | TSerializedFn | Record<string, TSerializedFn>
    styles?: string | TSerializedFn | Record<string, string | TSerializedFn>

    // behavior
    type?: string
    component?: string
    autocomplete?: string

    // field mapping
    name?: string
    value?: V

    // data options
    options?: O[] | TSerializedFn

    // additional attributes
    attrs?: Record<string, string | TSerializedFn>

    // constraits
    optional?: TSerializedFn
    disabled?: TSerializedFn
    hidden?: TSerializedFn
    length?: number
    validators?: TSerializedFn[]
  }>
}

export interface TFoormEntryEvaluated {
  field: string
  type: string
  component?: string
  name: string
  length?: number
  disabled?: boolean
  optional?: boolean
  hidden?: boolean
}
