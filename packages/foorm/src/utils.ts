import type { TFtring } from './types'

export function isFtring(input: unknown): input is TFtring {
  return (
    typeof input === 'object' &&
    (input as TFtring).__is_ftring__ &&
    typeof (input as TFtring).v === 'string'
  )
}

export function ftring(strings: TemplateStringsArray, __type__?: TFtring['__type__']): TFtring {
  return {
    __is_ftring__: true,
    v: strings.join(''),
    __type__,
  }
}
