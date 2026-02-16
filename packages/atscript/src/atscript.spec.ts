import { compileFieldFn, compileTopFn, compileValidatorFn } from './fn-compiler'
import { createFoorm } from './create-foorm'

// ── fn-compiler ─────────────────────────────────────────────

describe('compileFieldFn', () => {
  it('compiles and evaluates field-level fn string', () => {
    const fn = compileFieldFn<boolean>('(v, data) => v === data.expected')
    expect(fn({ v: 'hello', data: { expected: 'hello' }, context: {}, entry: { field: 'x', type: 'text', name: 'x' } })).toBe(true)
    expect(fn({ v: 'hello', data: { expected: 'world' }, context: {}, entry: { field: 'x', type: 'text', name: 'x' } })).toBe(false)
  })

  it('has access to entry in scope', () => {
    const fn = compileFieldFn<string>('(v, data, ctx, entry) => entry.field')
    expect(
      fn({ v: undefined, data: {}, context: {}, entry: { field: 'email', type: 'text', name: 'email' } })
    ).toBe('email')
  })
})

describe('compileTopFn', () => {
  it('compiles and evaluates form-level fn string', () => {
    const fn = compileTopFn<string>('(data) => "Hello " + data.name')
    expect(fn({ data: { name: 'World' }, context: {} })).toBe('Hello World')
  })

  it('has access to context', () => {
    const fn = compileTopFn<string>('(data, ctx) => ctx.locale')
    expect(fn({ data: {}, context: { locale: 'en' } })).toBe('en')
  })
})

describe('compileValidatorFn', () => {
  it('returns true on pass', () => {
    const fn = compileValidatorFn('(v) => v.length >= 2 || "Too short"')
    expect(fn({ v: 'ab', data: {}, context: {} })).toBe(true)
  })

  it('returns error message on fail', () => {
    const fn = compileValidatorFn('(v) => v.length >= 2 || "Too short"')
    expect(fn({ v: 'a', data: {}, context: {} })).toBe('Too short')
  })
})

// ── createFoorm ─────────────────────────────────────────────

function makeMeta(entries: Record<string, unknown>): { get(k: string): unknown } {
  const map = new Map(Object.entries(entries))
  return { get: (k: string) => map.get(k) }
}

function makeType(opts: {
  metadata?: Record<string, unknown>
  props: Record<string, {
    metadata?: Record<string, unknown>
    optional?: boolean
    tags?: string[]
    designType?: string
  }>
}) {
  const propsMap = new Map<string, any>()
  for (const [name, prop] of Object.entries(opts.props)) {
    propsMap.set(name, {
      type: { kind: '', tags: prop.tags ? new Set(prop.tags) : undefined, designType: prop.designType },
      metadata: makeMeta(prop.metadata ?? {}),
      optional: prop.optional,
    })
  }
  return {
    type: { kind: 'object', props: propsMap },
    metadata: makeMeta(opts.metadata ?? {}),
  } as unknown as Parameters<typeof createFoorm>[0]
}

describe('createFoorm', () => {
  it('creates a basic form model from annotated type', () => {
    const type = makeType({
      metadata: { 'foorm.title': 'My Form', 'foorm.submit.text': 'Go' },
      props: {
        name: { metadata: { 'meta.label': 'Name' } },
      },
    })

    const model = createFoorm(type)
    expect(model.title).toBe('My Form')
    expect(model.submit.text).toBe('Go')
    expect(model.fields).toHaveLength(1)
    expect(model.fields[0].field).toBe('name')
    expect(model.fields[0].label).toBe('Name')
    expect(model.fields[0].type).toBe('text')
    expect(model.fields[0].optional).toBe(false)
    expect(model.fields[0].disabled).toBe(false)
    expect(model.fields[0].hidden).toBe(false)
  })

  it('resolves computed title from fn annotation', () => {
    const type = makeType({
      metadata: { 'foorm.fn.title': '(data) => "Hi " + data.user' },
      props: {},
    })

    const model = createFoorm(type)
    expect(typeof model.title).toBe('function')
    const result = (model.title as Function)({ data: { user: 'Test' }, context: {} })
    expect(result).toBe('Hi Test')
  })

  it('detects field type from foorm.type annotation', () => {
    const type = makeType({
      props: {
        age: { metadata: { 'foorm.type': 'number' } },
      },
    })

    const model = createFoorm(type)
    expect(model.fields[0].type).toBe('number')
  })

  it('detects action type from phantom primitive tag', () => {
    const type = makeType({
      props: {
        save: { metadata: {}, tags: ['action'], designType: 'phantom' },
      },
    })

    const model = createFoorm(type)
    expect(model.fields[0].type).toBe('action')
  })

  it('detects paragraph type from phantom primitive tag', () => {
    const type = makeType({
      props: {
        info: { metadata: {}, tags: ['paragraph'], designType: 'phantom' },
      },
    })

    const model = createFoorm(type)
    expect(model.fields[0].type).toBe('paragraph')
  })

  it('reads optional from prop.optional', () => {
    const type = makeType({
      props: {
        bio: { metadata: {}, optional: true },
      },
    })

    const model = createFoorm(type)
    expect(model.fields[0].optional).toBe(true)
  })

  it('reads disabled from foorm.disabled annotation', () => {
    const type = makeType({
      props: {
        locked: { metadata: { 'foorm.disabled': true } },
      },
    })

    const model = createFoorm(type)
    expect(model.fields[0].disabled).toBe(true)
  })

  it('reads hidden from foorm.hidden annotation', () => {
    const type = makeType({
      props: {
        secret: { metadata: { 'foorm.hidden': true } },
      },
    })

    const model = createFoorm(type)
    expect(model.fields[0].hidden).toBe(true)
  })

  it('compiles foorm.validate into validators', () => {
    const type = makeType({
      props: {
        email: { metadata: { 'foorm.validate': ['(v) => v.includes("@") || "Invalid"'] } },
      },
    })

    const model = createFoorm(type)
    expect(model.fields[0].validators).toHaveLength(1)
    const result = model.fields[0].validators[0]({ v: 'test', data: {}, context: {} })
    expect(result).toBe('Invalid')
    const pass = model.fields[0].validators[0]({ v: 'a@b', data: {}, context: {} })
    expect(pass).toBe(true)
  })

  it('reads @expect constraints', () => {
    const type = makeType({
      props: {
        name: {
          metadata: {
            'expect.maxLength': 50,
            'expect.minLength': 2,
          },
        },
      },
    })

    const model = createFoorm(type)
    expect(model.fields[0].maxLength).toBe(50)
    expect(model.fields[0].minLength).toBe(2)
  })

  it('sorts fields by foorm.order', () => {
    const type = makeType({
      props: {
        second: { metadata: { 'foorm.order': 2 } },
        first: { metadata: { 'foorm.order': 1 } },
        unordered: { metadata: {} },
      },
    })

    const model = createFoorm(type)
    expect(model.fields.map(f => f.field)).toEqual(['first', 'second', 'unordered'])
  })

  it('compiles computed disabled from foorm.fn.disabled', () => {
    const type = makeType({
      props: {
        email: { metadata: { 'foorm.fn.disabled': '(v, data) => !data.name' } },
      },
    })

    const model = createFoorm(type)
    expect(typeof model.fields[0].disabled).toBe('function')
    const fn = model.fields[0].disabled as Function
    expect(fn({ v: undefined, data: { name: '' }, context: {}, entry: { field: 'email', type: 'text', name: 'email' } })).toBe(true)
    expect(fn({ v: undefined, data: { name: 'John' }, context: {}, entry: { field: 'email', type: 'text', name: 'email' } })).toBe(false)
  })

  it('defaults submit text to "Submit"', () => {
    const type = makeType({ props: {} })
    const model = createFoorm(type)
    expect(model.submit.text).toBe('Submit')
  })
})
