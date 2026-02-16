import { createFormData, getFormValidator, validate } from './foorm'
import type { TFoormField, TFoormFnScope, TFoormModel } from './types'
import { evalComputed } from './utils'

describe('evalComputed', () => {
  const scope: TFoormFnScope = {
    v: 'test',
    data: { name: 'Alice' },
    context: { locale: 'en' },
  }

  it('must return static values as-is', () => {
    expect(evalComputed('hello', scope)).toBe('hello')
    expect(evalComputed(42, scope)).toBe(42)
    expect(evalComputed(true, scope)).toBe(true)
    expect(evalComputed(undefined, scope)).toBeUndefined()
  })

  it('must call functions with scope', () => {
    const fn = (s: TFoormFnScope) => `${(s.data as { name: string }).name}-computed`
    expect(evalComputed(fn, scope)).toBe('Alice-computed')
  })
})

describe('validate', () => {
  it('must pass with no validators', () => {
    const scope: TFoormFnScope = { v: 'x', data: {}, context: {} }
    expect(validate([], scope)).toEqual({ passed: true })
  })

  it('must pass when all validators return true', () => {
    const scope: TFoormFnScope = { v: 'hello world', data: {}, context: {} }
    const validators = [
      (s: TFoormFnScope) => (typeof s.v === 'string' && s.v.length > 5) || 'Too short',
    ]
    expect(validate(validators, scope)).toEqual({ passed: true })
  })

  it('must fail and return error message', () => {
    const scope: TFoormFnScope = { v: 'hi', data: {}, context: {} }
    const validators = [
      (s: TFoormFnScope) => (typeof s.v === 'string' && s.v.length > 5) || 'Too short',
    ]
    expect(validate(validators, scope)).toEqual({ passed: false, error: 'Too short' })
  })

  it('must stop at first failure', () => {
    const scope: TFoormFnScope = { v: '', data: {}, context: {} }
    const validators = [
      (s: TFoormFnScope) => !!s.v || 'Empty',
      (s: TFoormFnScope) => (typeof s.v === 'string' && s.v.length > 5) || 'Too short',
    ]
    expect(validate(validators, scope)).toEqual({ passed: false, error: 'Empty' })
  })
})

describe('createFormData', () => {
  it('must create data from field defaults', () => {
    const fields: TFoormField[] = [
      {
        field: 'name',
        type: 'text',
        label: 'Name',
        value: 'Alice',
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        validators: [],
      },
      {
        field: 'age',
        type: 'number',
        label: 'Age',
        value: 30,
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        validators: [],
      },
    ]
    expect(createFormData(fields)).toEqual({ name: 'Alice', age: 30 })
  })

  it('must skip action fields', () => {
    const fields: TFoormField[] = [
      {
        field: 'name',
        type: 'text',
        label: 'Name',
        value: 'Alice',
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        validators: [],
      },
      {
        field: 'submit',
        type: 'action',
        label: 'Submit',
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        validators: [],
      },
    ]
    expect(createFormData(fields)).toEqual({ name: 'Alice' })
  })

  it('must set undefined for fields without default value', () => {
    const fields: TFoormField[] = [
      {
        field: 'email',
        type: 'text',
        label: 'Email',
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        validators: [],
      },
    ]
    expect(createFormData(fields)).toEqual({ email: undefined })
  })

  it('must evaluate computed default values (fn.value)', () => {
    const fields: TFoormField[] = [
      {
        field: 'isPremium',
        type: 'checkbox',
        label: 'Premium',
        value: true,
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        validators: [],
      },
      {
        field: 'tier',
        type: 'text',
        label: 'Tier',
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        // Computed value: depends on isPremium field (defined above)
        value: (scope: TFoormFnScope) =>
          (scope.data as Record<string, unknown>).isPremium ? 'premium' : 'basic',
        validators: [],
      },
    ]
    const data = createFormData(fields)
    // tier should be computed based on isPremium = true
    expect(data).toEqual({ isPremium: true, tier: 'premium' })
  })

  it('must evaluate computed values with access to partially-built data', () => {
    const fields: TFoormField[] = [
      {
        field: 'firstName',
        type: 'text',
        label: 'First',
        value: 'John',
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        validators: [],
      },
      {
        field: 'fullName',
        type: 'text',
        label: 'Full',
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        // Computed value: depends on firstName (evaluated earlier)
        value: (scope: TFoormFnScope) =>
          `${(scope.data as Record<string, unknown>).firstName || 'Unknown'} Doe`,
        validators: [],
      },
    ]
    const data = createFormData(fields)
    expect(data).toEqual({ firstName: 'John', fullName: 'John Doe' })
  })
})

describe('getFormValidator', () => {
  function makeModel(fields: TFoormField[]): TFoormModel {
    return { title: 'Test', submit: { text: 'Submit' }, fields }
  }

  it('must pass when all required fields are filled', () => {
    const model = makeModel([
      {
        field: 'name',
        type: 'text',
        label: 'Name',
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        validators: [],
      },
    ])
    const validator = getFormValidator(model)
    expect(validator({ name: 'Alice' })).toEqual({ passed: true, errors: {} })
  })

  it('must fail for empty required fields', () => {
    const model = makeModel([
      {
        field: 'name',
        type: 'text',
        label: 'Name',
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        validators: [],
      },
      {
        field: 'email',
        type: 'text',
        label: 'Email',
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        validators: [],
      },
    ])
    const validator = getFormValidator(model)
    expect(validator({ name: 'Alice', email: '' })).toEqual({
      passed: false,
      errors: { email: 'Required' },
    })
  })

  it('must skip optional empty fields', () => {
    const model = makeModel([
      {
        field: 'name',
        type: 'text',
        label: 'Name',
        optional: true,
        disabled: false,
        hidden: false,
        readonly: false,
        validators: [],
      },
    ])
    const validator = getFormValidator(model)
    expect(validator({ name: '' })).toEqual({ passed: true, errors: {} })
  })

  it('must skip disabled fields', () => {
    const model = makeModel([
      {
        field: 'name',
        type: 'text',
        label: 'Name',
        optional: false,
        disabled: true,
        hidden: false,
        readonly: false,
        validators: [],
      },
    ])
    const validator = getFormValidator(model)
    expect(validator({ name: '' })).toEqual({ passed: true, errors: {} })
  })

  it('must skip hidden fields', () => {
    const model = makeModel([
      {
        field: 'name',
        type: 'text',
        label: 'Name',
        optional: false,
        disabled: false,
        hidden: true,
        readonly: false,
        validators: [],
      },
    ])
    const validator = getFormValidator(model)
    expect(validator({ name: '' })).toEqual({ passed: true, errors: {} })
  })

  it('must evaluate computed disabled', () => {
    const model = makeModel([
      {
        field: 'email',
        type: 'text',
        label: 'Email',
        optional: false,
        disabled: (scope: TFoormFnScope) => !(scope.data as Record<string, unknown>).name,
        hidden: false,
        readonly: false,
        validators: [],
      },
    ])
    const validator = getFormValidator(model)
    // name is empty → disabled → skip validation
    expect(validator({ name: '', email: '' })).toEqual({ passed: true, errors: {} })
    // name is filled → not disabled → email required
    expect(validator({ name: 'Alice', email: '' })).toEqual({
      passed: false,
      errors: { email: 'Required' },
    })
  })

  it('must run custom validators', () => {
    const model = makeModel([
      {
        field: 'input',
        type: 'text',
        label: 'Input',
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        validators: [
          (s: TFoormFnScope) => (typeof s.v === 'string' && s.v.length > 3) || 'Too short',
        ],
      },
    ])
    const validator = getFormValidator(model)
    expect(validator({ input: 'hi' })).toEqual({
      passed: false,
      errors: { input: 'Too short' },
    })
    expect(validator({ input: 'hello' })).toEqual({ passed: true, errors: {} })
  })

  it('must skip action fields', () => {
    const model = makeModel([
      {
        field: 'save',
        type: 'action',
        label: 'Save',
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        validators: [],
      },
    ])
    const validator = getFormValidator(model)
    expect(validator({})).toEqual({ passed: true, errors: {} })
  })

  it('must pass context to validators', () => {
    const model = makeModel([
      {
        field: 'code',
        type: 'text',
        label: 'Code',
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        validators: [
          (s: TFoormFnScope) =>
            s.v === (s.context as { expected: string }).expected || 'Wrong code',
        ],
      },
    ])
    const validator = getFormValidator(model, { expected: 'abc' })
    expect(validator({ code: 'xyz' })).toEqual({
      passed: false,
      errors: { code: 'Wrong code' },
    })
    expect(validator({ code: 'abc' })).toEqual({ passed: true, errors: {} })
  })

  it('must evaluate options and pass to validators via entry', () => {
    const model = makeModel([
      {
        field: 'country',
        type: 'select',
        label: 'Country',
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        options: [
          { key: 'us', label: 'United States' },
          { key: 'ca', label: 'Canada' },
          { key: 'uk', label: 'United Kingdom' },
        ],
        validators: [
          (s: TFoormFnScope) => {
            const opts = s.entry?.options || []
            const validKeys = opts.map(o => (typeof o === 'string' ? o : o.key))
            return validKeys.includes(s.v as string) || 'Invalid country code'
          },
        ],
      },
    ])
    const validator = getFormValidator(model)
    expect(validator({ country: 'us' })).toEqual({ passed: true, errors: {} })
    expect(validator({ country: 'fr' })).toEqual({
      passed: false,
      errors: { country: 'Invalid country code' },
    })
  })

  it('must evaluate computed options for validators', () => {
    const model = makeModel([
      {
        field: 'city',
        type: 'select',
        label: 'City',
        optional: false,
        disabled: false,
        hidden: false,
        readonly: false,
        options: (s: TFoormFnScope) => (s.context as { cities: string[] }).cities || [],
        validators: [
          (s: TFoormFnScope) => {
            const opts = s.entry?.options || []
            return opts.includes(s.v as string) || 'Invalid city'
          },
        ],
      },
    ])
    const validator = getFormValidator(model, { cities: ['NYC', 'LA', 'Chicago'] })
    expect(validator({ city: 'NYC' })).toEqual({ passed: true, errors: {} })
    expect(validator({ city: 'Miami' })).toEqual({
      passed: false,
      errors: { city: 'Invalid city' },
    })
  })
})
