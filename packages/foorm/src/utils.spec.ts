/* eslint-disable @typescript-eslint/naming-convention */
import type { TFtring } from './types'
import { ftring } from './utils'

describe('foorm utils', () => {
  describe('ftring tagged template literal', () => {
    it('must create TFtring obj', () => {
      expect(ftring`v + 1`).toEqual({
        __is_ftring__: true,
        v: 'v + 1',
      } as TFtring)
      expect(ftring`v + 1${'boolean'}`).toEqual({
        __is_ftring__: true,
        v: 'v + 1',
        __type__: 'boolean',
      } as TFtring)
    })
  })
})
