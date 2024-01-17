import { TFtring } from './types'

export function isFtring(input: unknown): input is TFtring {
    return (
        typeof input === 'object' &&
        (<TFtring>input)?.__is_ftring__ === true &&
        typeof (<TFtring>input)?.v === 'string'
    )
}

export function ftring(
    strings: TemplateStringsArray,
    __type__?: TFtring['__type__']
): TFtring {
    return {
        __is_ftring__: true,
        v: strings.join(''),
        __type__,
    }
}
