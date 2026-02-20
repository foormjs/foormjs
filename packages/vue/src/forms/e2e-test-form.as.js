// prettier-ignore-start
/* eslint-disable */
/* oxlint-disable */
import { defineAnnotatedType as $, annotate as $a } from '@atscript/typescript/utils'

export class E2eTestForm {
  static __is_atscript_annotated_type = true
  static type = {}
  static metadata = new Map()
  static toJsonSchema() {
    throw new Error(
      "JSON Schema support is disabled. To enable, set `jsonSchema: 'lazy'` or `jsonSchema: 'bundle'` in tsPlugin options, or add @emit.jsonSchema annotation to individual interfaces."
    )
  }
}

$('object', E2eTestForm)
  .prop(
    'info',
    $()
      .designType('phantom')
      .tags('paragraph', 'foorm')
      .annotate('meta.label', 'Welcome')
      .annotate('foorm.value', 'Please fill out this form')
      .annotate('foorm.order', 0).$type
  )
  .prop(
    'firstName',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'First Name')
      .annotate('meta.description', 'Your given name')
      .annotate('meta.placeholder', 'John')
      .annotate('foorm.type', 'text')
      .annotate('foorm.autocomplete', 'given-name')
      .annotate('meta.required', { message: 'First name is required' })
      .annotate('foorm.order', 1).$type
  )
  .prop(
    'lastName',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'Last Name')
      .annotate('meta.hint', 'Real last name please')
      .annotate(
        'foorm.fn.placeholder',
        '(v, data) => data.firstName ? "Same as " + data.firstName + "?" : "Doe"'
      )
      .annotate('foorm.type', 'text')
      .annotate('meta.required', { message: 'Last name is required' })
      .annotate('foorm.order', 2).$type
  )
  .prop(
    'age',
    $()
      .designType('number')
      .tags('number')
      .annotate('meta.label', 'Age')
      .annotate('foorm.type', 'number')
      .annotate('foorm.value', '25')
      .annotate('foorm.order', 3)
      .annotate('foorm.validate', '(v) => !!v || "Age is required"', true)
      .annotate('expect.min', { minValue: 18, message: 'Must be 18 or older' }).$type
  )
  .prop(
    'email',
    $()
      .designType('string')
      .tags('email', 'string')
      .annotate(
        'foorm.fn.label',
        '(v, data) => data.firstName ? data.firstName + "s Email" : "Email"'
      )
      .annotate(
        'foorm.fn.description',
        '(v, data) => data.firstName ? "We will contact " + data.firstName + " here" : "Your email address"'
      )
      .annotate('foorm.type', 'text')
      .annotate('foorm.autocomplete', 'email')
      .annotate('foorm.order', 4)
      .annotate(
        'expect.pattern',
        { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', flags: '', message: 'Invalid email format.' },
        true
      )
      .optional().$type
  )
  .prop(
    'nickname',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'Nickname')
      .annotate(
        'foorm.fn.hint',
        '(v, data) => v ? "Nice nickname, " + (data.firstName || "stranger") + "!" : "Choose a cool nickname"'
      )
      .annotate('foorm.type', 'text')
      .annotate('foorm.order', 5)
      .optional().$type
  )
  .prop(
    'password',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'Password')
      .annotate('meta.placeholder', 'Enter password')
      .annotate('foorm.type', 'password')
      .annotate('foorm.fn.disabled', '(v, data) => !data.firstName || !data.lastName')
      .annotate('meta.required', { message: 'Password is required' })
      .annotate('foorm.order', 6).$type
  )
  .prop(
    'secretCode',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'Secret Code')
      .annotate('foorm.type', 'text')
      .annotate('foorm.fn.hidden', '(v, data) => !data.password')
      .annotate('foorm.order', 7)
      .optional().$type
  )
  .prop(
    'hiddenField',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'Hidden Field')
      .annotate('foorm.type', 'text')
      .annotate('foorm.hidden', true)
      .annotate('foorm.order', 8)
      .optional().$type
  )
  .prop(
    'disabledField',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'Disabled Field')
      .annotate('foorm.type', 'text')
      .annotate('foorm.disabled', true)
      .annotate('foorm.value', 'cannot edit')
      .annotate('foorm.order', 9)
      .optional().$type
  )
  .prop(
    'styledField',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'Styled Field')
      .annotate('foorm.type', 'text')
      .annotate('foorm.fn.classes', '(v) => v ? "has-value" : "empty-value"')
      .annotate('foorm.order', 10)
      .optional().$type
  )
  .prop(
    'country',
    $()
      .designType('string')
      .tags('select', 'foorm')
      .annotate('meta.label', 'Country')
      .annotate('meta.placeholder', 'Select a country')
      .annotate('foorm.options', { label: 'United States', value: 'us' }, true)
      .annotate('foorm.options', { label: 'Canada', value: 'ca' }, true)
      .annotate('foorm.options', { label: 'United Kingdom', value: 'uk' }, true)
      .annotate('foorm.order', 11)
      .optional().$type
  )
  .prop(
    'gender',
    $()
      .designType('string')
      .tags('radio', 'foorm')
      .annotate('meta.label', 'Gender')
      .annotate('foorm.options', { label: 'Male', value: 'male' }, true)
      .annotate('foorm.options', { label: 'Female', value: 'female' }, true)
      .annotate('foorm.options', { label: 'Other', value: 'other' }, true)
      .annotate('foorm.order', 12)
      .optional().$type
  )
  .prop(
    'agreeToTerms',
    $()
      .designType('boolean')
      .tags('checkbox', 'foorm')
      .annotate('meta.label', 'I agree to terms and conditions')
      .annotate('foorm.order', 13).$type
  )
  .prop(
    'city',
    $()
      .designType('string')
      .tags('select', 'foorm')
      .annotate('meta.label', 'City')
      .annotate('meta.placeholder', 'Select a city')
      .annotate('foorm.fn.options', '(v, data, context) => context.cityOptions || []')
      .annotate('foorm.order', 14)
      .optional().$type
  )
  .prop(
    'resetAction',
    $()
      .designType('phantom')
      .tags('action', 'foorm')
      .annotate('meta.label', 'Reset Password')
      .annotate('foorm.altAction', { id: 'reset-password' })
      .annotate('foorm.order', 15).$type
  )
  .prop(
    'username',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'Username')
      .annotate('meta.placeholder', 'Enter username')
      .annotate('foorm.type', 'text')
      .annotate('foorm.attr', { name: 'data-testid', value: 'username-input' }, true)
      .annotate('foorm.attr', { name: 'data-field-type', value: 'username' }, true)
      .annotate('foorm.order', 16)
      .optional().$type
  )
  .prop(
    'phone',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'Phone Number')
      .annotate('meta.placeholder', '+1 (555) 123-4567')
      .annotate('foorm.type', 'text')
      .annotate(
        'foorm.fn.attr',
        { name: 'data-valid', fn: '(v) => v && v.length >= 10 ? "true" : "false"' },
        true
      )
      .annotate(
        'foorm.fn.attr',
        { name: 'data-length', fn: '(v) => v ? String(v.length) : "0"' },
        true
      )
      .annotate('foorm.order', 17)
      .optional().$type
  )
  .prop(
    'membershipLevel',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'Membership Level')
      .annotate('foorm.type', 'text')
      .annotate('foorm.attr', { name: 'data-tier', value: 'basic' }, true)
      .annotate(
        'foorm.fn.attr',
        { name: 'data-tier', fn: '(v, data) => data.agreeToTerms ? "premium" : "basic"' },
        true
      )
      .annotate('foorm.attr', { name: 'data-static', value: 'always-present' }, true)
      .annotate('foorm.order', 18)
      .annotate('foorm.readonly', true)
      .annotate('foorm.fn.value', '(v, data) => data.agreeToTerms ? "premium" : "basic"')
      .optional().$type
  )
  .prop(
    'contextDrivenField',
    $()
      .designType('string')
      .tags('string')
      .annotate('foorm.fn.label', '(v, data, ctx) => ctx.labels?.contextLabel || "Fallback Label"')
      .annotate(
        'foorm.fn.description',
        '(v, data, ctx) => ctx.descriptions?.contextDescription || "Fallback description"'
      )
      .annotate('foorm.type', 'text')
      .annotate('foorm.order', 19)
      .optional().$type
  )
  .prop(
    'favoriteStar',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'Favorite Star')
      .annotate('meta.description', 'This field uses a custom component with star prefix')
      .annotate('meta.placeholder', 'Enter your favorite star')
      .annotate('foorm.type', 'text')
      .annotate('foorm.component', 'CustomInput')
      .annotate(
        'foorm.validate',
        '(v) => !v || v.length >= 3 || "Must be at least 3 characters"',
        true
      )
      .annotate('foorm.order', 20)
      .optional().$type
  )
  .prop(
    'summary',
    $()
      .designType('phantom')
      .tags('paragraph', 'foorm')
      .annotate('meta.label', 'Summary')
      .annotate(
        'foorm.fn.value',
        '(v, data) => data.firstName && data.lastName ? "Hello, " + data.firstName + " " + data.lastName + "! You are " + (data.age || "?") + " years old." : "Fill out your info above to see a summary."'
      )
      .annotate('foorm.order', 21).$type
  )
  .annotate('foorm.fn.title', '(data) => "User " + (data.firstName || "<unknown>")')
  .annotate('foorm.submit.text', 'Register')
  .annotate('foorm.fn.submit.disabled', '(data) => !data.firstName || !data.lastName')

// prettier-ignore-end
