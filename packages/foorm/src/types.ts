export type TFtring = { __is_ftring__: true; v: string, __type__?: 'boolean' | 'string' | 'number' }
export type StringOrFtring = string | TFtring
export type ObjSOF = Record<string, StringOrFtring>

export type TFoormFnCtx<T = string> = {
    v?: T
    data: Record<string, unknown>
    entry?: TFoormEntry<T>
    action?: string
}
export type TFoormValidatorFn<T = string> = (ctx: TFoormFnCtx<T>) => string | boolean
export type TFoormFn<T = string, R = string | boolean> = (
    ctx: TFoormFnCtx<T>
) => R

export interface TFoormEntry<
    T = string,
    O = string,
    SFTR = TFtring,
    BFTR = TFtring,
    FNFTR = TFtring
> {
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

    // field mapping
    name?: string
    field: string
    value?: T

    // data options
    options?: O[]

    // additional binding attributes
    attrs?: Record<string, unknown>

    // constraits
    optional?: boolean | BFTR
    disabled?: boolean | BFTR
    hidden?: boolean | BFTR
    length?: number
    validators?: (FNFTR | TFoormValidatorFn<T>)[]
}
