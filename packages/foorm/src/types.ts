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
    placeholder?: string,
    hint?: string,
    length?: number    
    bind?: Record<string, unknown>
}

export type TDynamicFnCtx = { v?: unknown, inputs?: Record<string, unknown>, entry?: TFoormEntry | TFoormEntryUI, action?: TFoormAction | TFoormActionUI }
export type TDynamicFn<R = boolean | string> = ((ctx: TDynamicFnCtx) => R)
export type TFoormEntryUI = TFoormEntry<TDynamicFn> & { id: string, autoFocus?: boolean, next?: TFoormEntryUI }

export type TFoormAction<FN = string> = {
    type: 'submit' | 'link'
    isDefault?: boolean
    text: string
    disabled?: FN
    classes?: FN | Record<string, FN>
    action?: string
}

export type TFoormActionUI = TFoormAction<TDynamicFn>

export type TFoormUiMetadata = {
    title?: string
    validate?: 'always' | 'on-action-only' | 'after-action-attempt' | 'never'
    actions: TFoormActionUI[]
    entries: TFoormEntryUI[]
}
