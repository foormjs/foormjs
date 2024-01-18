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
            validators: [
                ftring`v.length > 10`,
                ({ v }) => Number(v?.length) > 10,
            ],
        },
        {
            field: 'field-2',
            type: 'type-2',
            classes: ftring`"class-a class-b"`,
            styles: {'max-width': ftring`"255px"`, 'min-height': '100px'},
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
        expect(foorm.transportable()).toMatchInlineSnapshot(`
{
  "context": {},
  "entries": [
    {
      "classes": "class-a class-b",
      "disabled": false,
      "field": "input",
      "label": "Input Label",
      "name": "input",
      "optional": true,
      "styles": "max-width: 255px",
      "type": "text",
      "validators": [
        {
          "__is_ftring__": true,
          "__type__": undefined,
          "v": "v.length > 10",
        },
      ],
    },
    {
      "classes": {
        "__is_ftring__": true,
        "__type__": undefined,
        "v": ""class-a class-b"",
      },
      "disabled": {
        "__is_ftring__": true,
        "__type__": undefined,
        "v": "!!data.input",
      },
      "field": "field-2",
      "label": {
        "__is_ftring__": true,
        "__type__": undefined,
        "v": ""Field Label" + v",
      },
      "name": "field-2",
      "optional": {
        "__is_ftring__": true,
        "__type__": undefined,
        "v": "data.input.length < 2",
      },
      "styles": {
        "max-width": {
          "__is_ftring__": true,
          "__type__": undefined,
          "v": ""255px"",
        },
        "min-height": "100px",
      },
      "type": "type-2",
      "validators": [],
    },
  ],
  "submit": {
    "text": {
      "__is_ftring__": true,
      "__type__": undefined,
      "v": ""Submit"",
    },
  },
  "title": {
    "__is_ftring__": true,
    "__type__": undefined,
    "v": ""My Title"",
  },
}
`)
    })
    it('must prepare executable object', () => {
        expect(foorm.executable()).toMatchInlineSnapshot(`
{
  "context": {},
  "entries": [
    {
      "classes": "class-a class-b",
      "description": undefined,
      "disabled": false,
      "field": "input",
      "hidden": undefined,
      "hint": undefined,
      "label": "Input Label",
      "name": "input",
      "optional": true,
      "placeholder": undefined,
      "styles": "max-width: 255px",
      "type": "text",
      "validators": [
        [Function],
        [Function],
        [Function],
      ],
    },
    {
      "classes": [Function],
      "description": undefined,
      "disabled": [Function],
      "field": "field-2",
      "hidden": undefined,
      "hint": undefined,
      "label": [Function],
      "name": "field-2",
      "optional": [Function],
      "placeholder": undefined,
      "styles": {
        "max-width": [Function],
        "min-height": "100px",
      },
      "type": "type-2",
      "validators": [
        [Function],
      ],
    },
  ],
  "submit": {
    "disabled": undefined,
    "text": [Function],
  },
  "title": [Function],
}
`)
    })
    it('must prepare validator', () => {
        expect(
            foorm.getFormValidator()({
                input: 't',
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
                input: 'test 123456789',
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
