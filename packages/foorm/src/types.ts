export type TFtring = { __is_ftring__: true; v: string, __type__?: 'boolean' | 'string' | 'number' }
export type StringOrFtring = string | TFtring
export type ObjSOF = Record<string, StringOrFtring>

export type TFoormFnScope<T = string> = {
    v?: T
    data: Record<string, unknown>
    context: Record<string, unknown>
    entry?: Pick<TFoormEntry<T, unknown, string, boolean>, TRelevantFields> & { optional?: boolean; disabled?: boolean; hidden?: boolean }
    action?: string
}
export type TFoormValidatorFn<T = string> = (ctx: TFoormFnScope<T>) => string | boolean
export type TFoormFn<T = string, R = string | boolean> = (
    ctx: TFoormFnScope<T>
) => R

type TRelevantFields = 'field' |
'type' |
'component' |
'name' |
'attrs' |
'length'

export interface TFoormEntry<
    T = string,
    O = string,
    SFTR = TFtring,
    BFTR = TFtring,
    FNFTR = TFtring
> {
    field: string
    altAction?: string

    // description
    label?: string | SFTR
    description?: string | SFTR
    hint?: string | SFTR
    placeholder?: string | SFTR

    // appearence
    classes?: (string | SFTR) | Record<string, boolean | BFTR>
    styles?: (string | SFTR) | Record<string, string | SFTR>

    // behavior
    type?: string
    component?: string
    autocomplete?: string

    // field mapping
    name?: string
    value?: T

    // data options
    options?: O[]

    // additional attributes
    attrs?: Record<string, unknown>

    // constraits
    optional?: boolean | BFTR
    disabled?: boolean | BFTR
    hidden?: boolean | BFTR
    length?: number
    validators?: (FNFTR | TFoormValidatorFn<T>)[]
}

export type TFoormEntryExecutable<T = unknown, O = string> = TFoormEntry<
    T,
    O,
    TFoormFn<T, string>,
    TFoormFn<T, boolean>,
    TFoormValidatorFn<T>
> & { name: string; label: string | TFoormFn<T, string>; type: string }

export type TFoormMetaExecutable = {
    title: string | TFoormFn<undefined, string>
    submit: {
        text: string | TFoormFn<undefined, string>
        disabled: boolean | TFoormFn<undefined, boolean>
    }
    context: Record<string, unknown>
    entries: TFoormEntryExecutable[]
}
