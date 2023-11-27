export type TFeComponentName = 'fe-input' | 'fe-button' | 'fe-checkbox' | 'fe-pin' | 'fe-select'

export type TFoormEntry<FN = string> = {
    component: string
    label?: string
    type?: string
    validators?: FN[]
    disabled?: FN
    classes?: FN | Record<string, FN>
    optional?: boolean
    field?: string
    value?: unknown
    focusable?: boolean
    nextFocusable?: boolean
    action?: string
    validateBeforeAction?: boolean
    bind?: Record<string, unknown>
}

export type TDynamicFnCtx = { v: unknown, inputs?: Record<string, unknown>, entry?: TFoormEntry | TFoormEntryUI }
export type TDynamicFn<R = boolean | string> = ((ctx: TDynamicFnCtx) => R)
export type TFoormEntryUI = TFoormEntry<TDynamicFn> & { id: string, autoFocus?: boolean, next?: TFoormEntryUI }
