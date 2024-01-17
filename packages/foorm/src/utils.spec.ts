import { TFtring } from './types'
import { ftring } from './utils'

describe('foorm utils', () => {
    describe('ftring tagged template literal', () => {
        it('must create TFtring obj', () => {
            expect(ftring`v + 1`).toEqual(<TFtring>{
                __is_ftring__: true,
                v: 'v + 1',
            })
            expect(ftring`v + 1${'boolean'}`).toEqual(<TFtring>{
                __is_ftring__: true,
                v: 'v + 1',
                __type__: 'boolean',
            })
        })
    })  
})
