import type { TFoormActionUI, TFoormEntryUI } from 'foorm'

export interface TFeProps extends TFoormEntryUI {
    inputs: Record<string, unknown>
    error?: string
    enableValidation?: boolean
    // bind: never
    // component: never
}

export interface TFeActionProps extends TFoormActionUI {
    inputs: Record<string, unknown>
}
