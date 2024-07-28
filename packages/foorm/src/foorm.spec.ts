/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { deserializeForm } from './deserialize'
import { Foorm } from './foorm'
import { serializeForm } from './serialize'

interface TData {
  input: string
}
interface TContext {
  val: number
}

const foorm = new Foorm<TData, TContext>({
  title: () => 'My Title',
  entries: [
    {
      field: 'input',
      classes: 'class-a class-b',
      styles: 'max-width: 255px',
      label: 'Input Label',
      disabled: false,
      optional: true,
      validators: [(v: string) => v.length > 10, (v?: string) => Number(v?.length) > 10],
    },
    {
      field: 'field-2',
      type: 'type-2',
      classes: (_, _d, ctx) => `class-a class-b ${ctx.val}`,
      styles: { 'max-width': () => '255px', 'min-height': '100px' },
      label: (v: string) => `Field Label${v}`,
      disabled: (v, data) => !!data.input,
      optional: (v, data, ctx) => data.input.length < ctx.val,
    },
  ],
  submit: {
    text: () => 'Submit',
  },
})

describe('foorm', () => {
  it('must serialize into transferable object', () => {
    expect(serializeForm(foorm)).toMatchSnapshot()
  })
  it('must deserialize form', () => {
    const s = serializeForm(foorm)
    const newForm = deserializeForm(s)
    const def = newForm.getDefinition()
    expect((def.title as Function)({ v: '', data: {}, context: {} })).toEqual('My Title')
  })
})
it('must prepare validator', () => {
  foorm.setContext({ val: 2 })
  expect(
    foorm.getFormValidator()({
      'input': 't',
      'field-2': '',
    })
  ).toMatchInlineSnapshot(`
  {
    "errors": {
      "input": "Wrong value",
    },
    "passed": false,
  }
  `)
  expect(
    foorm.getFormValidator()({
      'input': 'test 123456789',
      'field-2': '',
    })
  ).toMatchInlineSnapshot(`
  {
    "errors": {
      "field-2": "Required",
    },
    "passed": false,
  }
  `)
  //   })
})
