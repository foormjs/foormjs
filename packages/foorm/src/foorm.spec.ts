import { Foorm } from './foorm'
import { ftring } from './utils'

const foorm = new Foorm({
  title: ftring`"My Title"`,
  entries: [
    {
      field: 'input',
      classes: 'class-a class-b',
      styles: 'max-width: 255px',
      label: 'Input Label',
      disabled: false,
      optional: true,
      validators: [ftring`v.length > 10`, ({ v }) => Number(v?.length) > 10],
    },
    {
      field: 'field-2',
      type: 'type-2',
      classes: ftring`"class-a class-b"`,
      styles: { 'max-width': ftring`"255px"`, 'min-height': '100px' },
      label: ftring`"Field Label" + v`,
      disabled: ftring`!!data.input`,
      optional: ftring`data.input.length < 2`,
    },
  ],
  submit: {
    text: ftring`"Submit"`,
  },
})

describe('foorm', () => {
  it('must prepare transferable object', () => {
    expect(foorm.transportable()).toMatchSnapshot()
  })
  it('must prepare executable object', () => {
    expect(foorm.executable()).toMatchSnapshot()
  })
  it('must prepare validator', () => {
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
  })
})
