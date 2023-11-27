import { flagsMeta } from './meta'

describe('flags', () => {
    it('must cover all the flags', () => {
        expect(Object.keys(flagsMeta).length).toBe(249)
    })
})
