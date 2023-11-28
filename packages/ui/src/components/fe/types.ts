import type { TFoormEntryUI } from 'foorm'

export type TFeProps = Omit<TFoormEntryUI, 'bind' | 'component'> & {
    inputs: Record<string, unknown>,
    error?: string
}
