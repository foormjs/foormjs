import type { TFoormEntryUI } from 'foorm'

export type TFeProps = Omit<TFoormEntryUI, 'bind' | 'component'> & {
    placeholder?: string,
    hint?: string,
    inputs: Record<string, unknown>,
    length?: number
    error?: string
}
