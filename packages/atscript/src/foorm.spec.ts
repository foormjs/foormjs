import { defineAnnotatedType } from '@atscript/typescript/utils'
import type { TAtscriptAnnotatedType, TAtscriptTypeObject } from '@atscript/typescript/utils'
import { compileFieldFn, compileTopFn, compileValidatorFn } from './runtime/fn-compiler'
import { createFoormDef } from './runtime/create-foorm'
import {
  getByPath,
  setByPath,
  createFormData,
  resolveFieldProp,
  resolveFormProp,
  resolveOptions,
  resolveAttrs,
  getFieldMeta,
  hasComputedAnnotations,
} from './runtime/utils'
import { getFormValidator, supportsAltAction } from './runtime/validate'
import type { TFoormFnScope } from './runtime/types'

// ── Helpers ────────────────────────────────────────────────────

function makeType(opts: {
  metadata?: Record<string, unknown>
  props?: Record<
    string,
    {
      metadata?: Record<string, unknown>
      optional?: boolean
      tags?: string[]
      designType?: string
      value?: string | number | boolean
      kind?: 'object'
      nestedProps?: Record<
        string,
        {
          metadata?: Record<string, unknown>
          optional?: boolean
          tags?: string[]
          designType?: string
          value?: string | number | boolean
        }
      >
    }
  >
}) {
  const root = defineAnnotatedType('object')

  if (opts.metadata) {
    for (const [key, value] of Object.entries(opts.metadata)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          root.annotate(key as any, v, true)
        }
      } else {
        root.annotate(key as any, value)
      }
    }
  }

  if (opts.props) {
    for (const [name, propDef] of Object.entries(opts.props)) {
      let prop: ReturnType<typeof defineAnnotatedType>

      if (propDef.kind === 'object' && propDef.nestedProps) {
        prop = defineAnnotatedType('object')
        for (const [nestedName, nestedDef] of Object.entries(propDef.nestedProps)) {
          const nestedProp = defineAnnotatedType()
          if (nestedDef.designType) {
            nestedProp.designType(nestedDef.designType as any)
          }
          if (nestedDef.value !== undefined) {
            nestedProp.value(nestedDef.value)
          }
          if (nestedDef.tags) {
            nestedProp.tags(...nestedDef.tags)
          }
          if (nestedDef.optional) {
            nestedProp.optional()
          }
          if (nestedDef.metadata) {
            for (const [k, v] of Object.entries(nestedDef.metadata)) {
              if (Array.isArray(v)) {
                for (const item of v) {
                  nestedProp.annotate(k as any, item, true)
                }
              } else {
                nestedProp.annotate(k as any, v)
              }
            }
          }
          prop.prop(nestedName, nestedProp.$type)
        }
      } else {
        prop = defineAnnotatedType()
        if (propDef.designType) {
          prop.designType(propDef.designType as any)
        }
        if (propDef.value !== undefined) {
          prop.value(propDef.value)
        }
        if (propDef.tags) {
          prop.tags(...propDef.tags)
        }
      }

      if (propDef.optional) {
        prop.optional()
      }

      if (propDef.metadata) {
        for (const [k, v] of Object.entries(propDef.metadata)) {
          if (Array.isArray(v)) {
            for (const item of v) {
              prop.annotate(k as any, item, true)
            }
          } else {
            prop.annotate(k as any, v)
          }
        }
      }

      root.prop(name, prop.$type)
    }
  }

  return root.$type as TAtscriptAnnotatedType<TAtscriptTypeObject>
}

const emptyScope: TFoormFnScope = { v: undefined, data: {}, context: {}, entry: undefined }

// ── fn-compiler ─────────────────────────────────────────────

describe('compileFieldFn', () => {
  it('compiles and evaluates field-level fn string', () => {
    const fn = compileFieldFn<boolean>('(v, data) => v === data.expected')
    expect(fn({ v: 'hello', data: { expected: 'hello' }, context: {}, entry: undefined })).toBe(
      true
    )
    expect(fn({ v: 'hello', data: { expected: 'world' }, context: {}, entry: undefined })).toBe(
      false
    )
  })

  it('has access to entry in scope', () => {
    const fn = compileFieldFn<string>('(v, data, ctx, entry) => entry.field')
    expect(
      fn({
        v: undefined,
        data: {},
        context: {},
        entry: { field: 'email', type: 'text', name: 'email' },
      })
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
    expect(fn({ v: 'ab', data: {}, context: {}, entry: undefined })).toBe(true)
  })

  it('returns error message on fail', () => {
    const fn = compileValidatorFn('(v) => v.length >= 2 || "Too short"')
    expect(fn({ v: 'a', data: {}, context: {}, entry: undefined })).toBe('Too short')
  })
})

// ── getByPath / setByPath ───────────────────────────────────

describe('getByPath', () => {
  it('gets top-level properties via .value dereference', () => {
    expect(getByPath({ value: { name: 'Alice' } }, 'name')).toBe('Alice')
  })

  it('gets nested properties', () => {
    expect(getByPath({ value: { address: { city: 'NYC', zip: '10001' } } }, 'address.city')).toBe(
      'NYC'
    )
  })

  it('gets deeply nested properties', () => {
    expect(getByPath({ value: { a: { b: { c: { d: 'deep' } } } } }, 'a.b.c.d')).toBe('deep')
  })

  it('returns root value when path is empty', () => {
    expect(getByPath({ value: { name: 'Alice' } }, '')).toEqual({ name: 'Alice' })
    expect(getByPath({ value: 'hello' }, '')).toBe('hello')
    expect(getByPath({ value: 42 }, '')).toBe(42)
  })

  it('returns undefined for missing paths', () => {
    expect(getByPath({ value: { a: 1 } }, 'b')).toBeUndefined()
    expect(getByPath({ value: { a: { b: 1 } } }, 'a.c')).toBeUndefined()
    expect(getByPath({ value: { a: 1 } }, 'a.b.c')).toBeUndefined()
  })

  it('returns undefined when traversing through null', () => {
    expect(getByPath({ value: { a: null } } as any, 'a.b')).toBeUndefined()
  })
})

describe('setByPath', () => {
  it('sets top-level properties via .value dereference', () => {
    const obj: Record<string, unknown> = { value: {} }
    setByPath(obj, 'name', 'Alice')
    expect((obj.value as any).name).toBe('Alice')
  })

  it('sets nested properties', () => {
    const obj: Record<string, unknown> = { value: { address: {} } }
    setByPath(obj, 'address.city', 'NYC')
    expect((obj.value as any).address.city).toBe('NYC')
  })

  it('creates intermediate objects', () => {
    const obj: Record<string, unknown> = { value: {} }
    setByPath(obj, 'a.b.c', 'deep')
    expect((obj.value as any).a.b.c).toBe('deep')
  })

  it('overwrites existing values', () => {
    const obj: Record<string, unknown> = { value: { name: 'Alice' } }
    setByPath(obj, 'name', 'Bob')
    expect((obj.value as any).name).toBe('Bob')
  })

  it('sets root value when path is empty', () => {
    const obj: Record<string, unknown> = { value: 'old' }
    setByPath(obj, '', 'new')
    expect(obj.value).toBe('new')
  })

  it('replaces root object when path is empty', () => {
    const obj: Record<string, unknown> = { value: { a: 1 } }
    setByPath(obj, '', { b: 2 })
    expect(obj.value).toEqual({ b: 2 })
  })
})

// ── getFieldMeta ────────────────────────────────────────────

describe('getFieldMeta', () => {
  it('reads static metadata from prop', () => {
    const type = makeType({
      props: { email: { metadata: { 'foorm.autocomplete': 'email' }, designType: 'string' } },
    })
    const def = createFoormDef(type)
    expect(getFieldMeta(def.fields[0].prop, 'foorm.autocomplete')).toBe('email')
  })

  it('returns undefined for missing metadata', () => {
    const type = makeType({
      props: { name: { metadata: {}, designType: 'string' } },
    })
    const def = createFoormDef(type)
    expect(getFieldMeta(def.fields[0].prop, 'foorm.autocomplete')).toBeUndefined()
  })
})

// ── resolveFieldProp ────────────────────────────────────────

describe('resolveFieldProp', () => {
  it('returns static metadata value', () => {
    const type = makeType({
      props: { name: { metadata: { 'meta.label': 'Full Name' }, designType: 'string' } },
    })
    const def = createFoormDef(type)
    expect(
      resolveFieldProp<string>(def.fields[0].prop, 'foorm.fn.label', 'meta.label', emptyScope)
    ).toBe('Full Name')
  })

  it('compiles and calls fn string', () => {
    const type = makeType({
      props: {
        email: {
          metadata: { 'foorm.fn.disabled': '(v, data) => !data.name' },
          designType: 'string',
        },
      },
    })
    const def = createFoormDef(type)
    const prop = def.fields[0].prop
    expect(
      resolveFieldProp<boolean>(prop, 'foorm.fn.disabled', 'foorm.disabled', {
        ...emptyScope,
        data: { name: '' },
      })
    ).toBe(true)
    expect(
      resolveFieldProp<boolean>(prop, 'foorm.fn.disabled', 'foorm.disabled', {
        ...emptyScope,
        data: { name: 'John' },
      })
    ).toBe(false)
  })

  it('fn takes precedence over static', () => {
    const type = makeType({
      props: {
        status: {
          metadata: { 'foorm.value': 'static', 'foorm.fn.value': '() => "computed"' },
          designType: 'string',
        },
      },
    })
    const def = createFoormDef(type)
    expect(
      resolveFieldProp<string>(def.fields[0].prop, 'foorm.fn.value', 'foorm.value', emptyScope)
    ).toBe('computed')
  })

  it('returns undefined when neither fn nor static exists', () => {
    const type = makeType({
      props: { name: { metadata: {}, designType: 'string' } },
    })
    const def = createFoormDef(type)
    expect(
      resolveFieldProp<string>(def.fields[0].prop, 'foorm.fn.label', 'meta.label', emptyScope)
    ).toBeUndefined()
  })

  it('staticAsBoolean returns true for any non-undefined static value', () => {
    const type = makeType({
      props: { locked: { metadata: { 'foorm.disabled': true }, designType: 'string' } },
    })
    const def = createFoormDef(type)
    expect(
      resolveFieldProp<boolean>(
        def.fields[0].prop,
        'foorm.fn.disabled',
        'foorm.disabled',
        emptyScope,
        { staticAsBoolean: true }
      )
    ).toBe(true)
  })

  it('transform applies to static value', () => {
    const type = makeType({
      props: {
        country: {
          metadata: { 'foorm.options': [{ label: 'US', value: 'us' }] },
          tags: ['select'],
        },
      },
    })
    const def = createFoormDef(type)
    const result = resolveFieldProp<any[]>(
      def.fields[0].prop,
      'foorm.fn.options',
      'foorm.options',
      emptyScope,
      { transform: (raw: unknown) => (Array.isArray(raw) ? raw.map((r: any) => r.label) : []) }
    )
    expect(result).toEqual(['US'])
  })
})

// ── resolveFormProp ─────────────────────────────────────────

describe('resolveFormProp', () => {
  it('returns static form-level metadata', () => {
    const type = makeType({
      metadata: { 'foorm.title': 'My Form' },
      props: {},
    })
    expect(resolveFormProp<string>(type, 'foorm.fn.title', 'foorm.title', emptyScope)).toBe(
      'My Form'
    )
  })

  it('compiles and calls form-level fn string', () => {
    const type = makeType({
      metadata: { 'foorm.fn.title': '(data) => "Hi " + data.user' },
      props: {},
    })
    expect(
      resolveFormProp<string>(type, 'foorm.fn.title', 'foorm.title', {
        ...emptyScope,
        data: { user: 'Test' },
      })
    ).toBe('Hi Test')
  })

  it('returns static submit text', () => {
    const type = makeType({
      metadata: { 'foorm.submit.text': 'Go' },
      props: {},
    })
    expect(
      resolveFormProp<string>(type, 'foorm.fn.submit.text', 'foorm.submit.text', emptyScope)
    ).toBe('Go')
  })

  it('returns undefined when no metadata', () => {
    const type = makeType({ props: {} })
    expect(
      resolveFormProp<string>(type, 'foorm.fn.title', 'foorm.title', emptyScope)
    ).toBeUndefined()
  })
})

// ── resolveOptions ──────────────────────────────────────────

describe('resolveOptions', () => {
  it('resolves static options with key/label', () => {
    const type = makeType({
      props: {
        country: {
          metadata: {
            'foorm.options': [
              { label: 'United States', value: 'us' },
              { label: 'Canada', value: 'ca' },
            ],
          },
          tags: ['select'],
        },
      },
    })
    const def = createFoormDef(type)
    expect(resolveOptions(def.fields[0].prop, emptyScope)).toEqual([
      { key: 'us', label: 'United States' },
      { key: 'ca', label: 'Canada' },
    ])
  })

  it('uses label as key when value is omitted', () => {
    const type = makeType({
      props: {
        color: {
          metadata: { 'foorm.options': [{ label: 'Red' }, { label: 'Blue' }] },
          tags: ['select'],
        },
      },
    })
    const def = createFoormDef(type)
    expect(resolveOptions(def.fields[0].prop, emptyScope)).toEqual(['Red', 'Blue'])
  })

  it('resolves computed options from fn', () => {
    const type = makeType({
      props: {
        city: {
          metadata: { 'foorm.fn.options': '(v, data, context) => context.cities || []' },
          tags: ['select'],
        },
      },
    })
    const def = createFoormDef(type)
    const scope: TFoormFnScope = {
      ...emptyScope,
      context: { cities: [{ key: 'nyc', label: 'NYC' }] },
    }
    expect(resolveOptions(def.fields[0].prop, scope)).toEqual([{ key: 'nyc', label: 'NYC' }])
  })

  it('fn.options takes precedence over static options', () => {
    const type = makeType({
      props: {
        city: {
          metadata: {
            'foorm.fn.options': '() => ["dynamic"]',
            'foorm.options': [{ label: 'Fallback', value: 'fb' }],
          },
          tags: ['select'],
        },
      },
    })
    const def = createFoormDef(type)
    expect(resolveOptions(def.fields[0].prop, emptyScope)).toEqual(['dynamic'])
  })

  it('returns undefined when no options metadata', () => {
    const type = makeType({
      props: { name: { metadata: {}, designType: 'string' } },
    })
    const def = createFoormDef(type)
    expect(resolveOptions(def.fields[0].prop, emptyScope)).toBeUndefined()
  })
})

// ── resolveAttrs ────────────────────────────────────────────

describe('resolveAttrs', () => {
  it('resolves static attrs', () => {
    const type = makeType({
      props: {
        email: {
          metadata: {
            'foorm.attr': [
              { name: 'data-testid', value: 'email-input' },
              { name: 'aria-label', value: 'Email' },
            ],
          },
          designType: 'string',
        },
      },
    })
    const def = createFoormDef(type)
    expect(resolveAttrs(def.fields[0].prop, emptyScope)).toEqual({
      'data-testid': 'email-input',
      'aria-label': 'Email',
    })
  })

  it('resolves computed attrs from fn', () => {
    const type = makeType({
      props: {
        password: {
          metadata: {
            'foorm.fn.attr': [
              { name: 'data-strength', fn: '(v) => v && v.length > 8 ? "strong" : "weak"' },
            ],
          },
          designType: 'string',
        },
      },
    })
    const def = createFoormDef(type)
    expect(resolveAttrs(def.fields[0].prop, { ...emptyScope, v: 'short' })).toEqual({
      'data-strength': 'weak',
    })
    expect(resolveAttrs(def.fields[0].prop, { ...emptyScope, v: 'very-long-password' })).toEqual({
      'data-strength': 'strong',
    })
  })

  it('fn.attr overrides static attr with same name', () => {
    const type = makeType({
      props: {
        username: {
          metadata: {
            'foorm.attr': [{ name: 'variant', value: 'default' }],
            'foorm.fn.attr': [
              { name: 'variant', fn: '(v, data) => data.premium ? "premium" : "basic"' },
            ],
          },
          designType: 'string',
        },
      },
    })
    const def = createFoormDef(type)
    expect(resolveAttrs(def.fields[0].prop, { ...emptyScope, data: { premium: true } })).toEqual({
      variant: 'premium',
    })
    expect(resolveAttrs(def.fields[0].prop, { ...emptyScope, data: { premium: false } })).toEqual({
      variant: 'basic',
    })
  })

  it('returns undefined when no attr annotations', () => {
    const type = makeType({
      props: { name: { metadata: {}, designType: 'string' } },
    })
    const def = createFoormDef(type)
    expect(resolveAttrs(def.fields[0].prop, emptyScope)).toBeUndefined()
  })
})

// ── hasComputedAnnotations ──────────────────────────────────

describe('hasComputedAnnotations', () => {
  it('returns false for static-only fields', () => {
    const type = makeType({
      props: {
        name: { metadata: { 'meta.label': 'Name', 'foorm.disabled': true }, designType: 'string' },
      },
    })
    const def = createFoormDef(type)
    expect(hasComputedAnnotations(def.fields[0].prop)).toBe(false)
    expect(def.fields[0].allStatic).toBe(true)
  })

  it('returns true when foorm.fn.disabled exists', () => {
    const type = makeType({
      props: { name: { metadata: { 'foorm.fn.disabled': '() => true' }, designType: 'string' } },
    })
    const def = createFoormDef(type)
    expect(hasComputedAnnotations(def.fields[0].prop)).toBe(true)
    expect(def.fields[0].allStatic).toBe(false)
  })

  it('returns true when foorm.fn.attr exists', () => {
    const type = makeType({
      props: {
        name: {
          metadata: { 'foorm.fn.attr': [{ name: 'x', fn: '() => 1' }] },
          designType: 'string',
        },
      },
    })
    expect(hasComputedAnnotations(createFoormDef(type).fields[0].prop)).toBe(true)
  })

  it('returns true when foorm.validate exists (needs scope for validators)', () => {
    const type = makeType({
      props: {
        name: { metadata: { 'foorm.validate': '(v) => !!v || "Required"' }, designType: 'string' },
      },
    })
    const def = createFoormDef(type)
    expect(hasComputedAnnotations(def.fields[0].prop)).toBe(true)
    expect(def.fields[0].allStatic).toBe(false)
  })
})

// ── createFoormDef ──────────────────────────────────────────

describe('createFoormDef', () => {
  it('creates a thin FoormFieldDef with path, prop, type, phantom, name, allStatic', () => {
    const type = makeType({
      props: { name: { metadata: { 'meta.label': 'Name' }, designType: 'string' } },
    })
    const def = createFoormDef(type)
    expect(def.fields).toHaveLength(1)
    const f = def.fields[0]
    expect(f.path).toBe('name')
    expect(f.prop).toBeDefined()
    expect(f.type).toBe('text')
    expect(f.phantom).toBe(false)
    expect(f.name).toBe('name')
    expect(f.allStatic).toBe(true)
    // No mapped properties on the field
    expect('label' in f).toBe(false)
    expect('disabled' in f).toBe(false)
    expect('options' in f).toBe(false)
  })

  it('metadata is accessible from prop', () => {
    const type = makeType({
      props: {
        name: {
          metadata: { 'meta.label': 'Full Name', 'foorm.autocomplete': 'name' },
          designType: 'string',
        },
      },
    })
    const def = createFoormDef(type)
    expect(getFieldMeta(def.fields[0].prop, 'meta.label')).toBe('Full Name')
    expect(getFieldMeta(def.fields[0].prop, 'foorm.autocomplete')).toBe('name')
  })

  it('detects field type from foorm.type annotation', () => {
    const type = makeType({
      props: { age: { metadata: { 'foorm.type': 'number' }, designType: 'number' } },
    })
    expect(createFoormDef(type).fields[0].type).toBe('number')
  })

  it('detects action type from phantom primitive tag', () => {
    const type = makeType({
      props: { save: { metadata: {}, tags: ['action'], designType: 'phantom' } },
    })
    const f = createFoormDef(type).fields[0]
    expect(f.type).toBe('action')
    expect(f.phantom).toBe(true)
  })

  it('detects paragraph type from phantom primitive tag', () => {
    const type = makeType({
      props: { info: { metadata: {}, tags: ['paragraph'], designType: 'phantom' } },
    })
    const f = createFoormDef(type).fields[0]
    expect(f.type).toBe('paragraph')
    expect(f.phantom).toBe(true)
  })

  it('detects select type from foorm primitive tag', () => {
    const type = makeType({ props: { country: { metadata: {}, tags: ['select'] } } })
    expect(createFoormDef(type).fields[0].type).toBe('select')
  })

  it('detects radio type from foorm primitive tag', () => {
    const type = makeType({ props: { gender: { metadata: {}, tags: ['radio'] } } })
    expect(createFoormDef(type).fields[0].type).toBe('radio')
  })

  it('detects checkbox type from foorm primitive tag', () => {
    const type = makeType({ props: { agree: { metadata: {}, tags: ['checkbox'] } } })
    expect(createFoormDef(type).fields[0].type).toBe('checkbox')
  })

  it('sorts fields by foorm.order from metadata', () => {
    const type = makeType({
      props: {
        second: { metadata: { 'foorm.order': 2 }, designType: 'string' },
        first: { metadata: { 'foorm.order': 1 }, designType: 'string' },
        unordered: { metadata: {}, designType: 'string' },
      },
    })
    expect(createFoormDef(type).fields.map(f => f.path)).toEqual(['first', 'second', 'unordered'])
  })

  it('uses last path segment as name', () => {
    const type = makeType({ props: { email: { metadata: {}, designType: 'string' } } })
    expect(createFoormDef(type).fields[0].name).toBe('email')
  })

  it('provides flatMap with all paths', () => {
    const type = makeType({
      props: {
        name: { metadata: {}, designType: 'string' },
        age: { metadata: {}, designType: 'number' },
      },
    })
    const def = createFoormDef(type)
    expect(def.flatMap).toBeInstanceOf(Map)
    expect(def.flatMap.has('name')).toBe(true)
    expect(def.flatMap.has('age')).toBe(true)
    expect(def.flatMap.has('')).toBe(true)
  })

  it('handles nested object types', () => {
    const type = makeType({
      props: {
        address: {
          kind: 'object',
          metadata: {},
          nestedProps: {
            street: { metadata: { 'meta.label': 'Street' }, designType: 'string' },
            city: { metadata: { 'meta.label': 'City' }, designType: 'string' },
          },
        },
      },
    })
    const def = createFoormDef(type)
    expect(def.fields).toHaveLength(2)
    expect(def.fields.map(f => f.path).sort()).toEqual(['address.city', 'address.street'])

    const street = def.fields.find(f => f.path === 'address.street')
    expect(street?.name).toBe('street')
    expect(getFieldMeta(street?.prop as any, 'meta.label')).toBe('Street')
  })

  it('stores type reference', () => {
    const type = makeType({ props: {} })
    expect(createFoormDef(type).type).toBe(type)
  })

  it('does not have title or submit on def', () => {
    const type = makeType({
      metadata: { 'foorm.title': 'My Form', 'foorm.submit.text': 'Go' },
      props: {},
    })
    const def = createFoormDef(type)
    expect('title' in def).toBe(false)
    expect('submit' in def).toBe(false)
  })
})

// ── createFormData ──────────────────────────────────────────

describe('createFormData', () => {
  it('wraps object data in { value: ... }', () => {
    const type = makeType({
      props: {
        name: { metadata: {}, designType: 'string' },
        active: { metadata: {}, designType: 'boolean' },
      },
    })
    const def = createFoormDef(type)
    expect(createFormData(type, def.fields)).toEqual({ value: { name: '', active: false } })
  })

  it('applies static default values from metadata', () => {
    const type = makeType({
      props: { status: { metadata: { 'foorm.value': 'pending' }, designType: 'string' } },
    })
    const def = createFoormDef(type)
    expect(createFormData(type, def.fields)).toEqual({ value: { status: 'pending' } })
  })

  it('creates nested data for object types', () => {
    const type = makeType({
      props: {
        address: {
          kind: 'object',
          metadata: {},
          nestedProps: {
            city: { metadata: {}, designType: 'string' },
            zip: { metadata: {}, designType: 'string' },
          },
        },
      },
    })
    const def = createFoormDef(type)
    expect(createFormData(type, def.fields)).toEqual({
      value: { address: { city: '', zip: '' } },
    })
  })

  it('uses literal string value as default', () => {
    const type = makeType({
      props: {
        kind: { metadata: {}, designType: 'string', value: 'address' },
        name: { metadata: {}, designType: 'string' },
      },
    })
    const def = createFoormDef(type)
    expect(createFormData(type, def.fields)).toEqual({
      value: { kind: 'address', name: '' },
    })
  })

  it('uses literal number value as default', () => {
    const type = makeType({
      props: { version: { metadata: {}, designType: 'number', value: 42 } },
    })
    const def = createFoormDef(type)
    expect(createFormData(type, def.fields)).toEqual({ value: { version: 42 } })
  })

  it('uses literal boolean value as default', () => {
    const type = makeType({
      props: { locked: { metadata: {}, designType: 'boolean', value: true } },
    })
    const def = createFoormDef(type)
    expect(createFormData(type, def.fields)).toEqual({ value: { locked: true } })
  })

  it('foorm.value overrides literal value', () => {
    const type = makeType({
      props: {
        kind: { metadata: { 'foorm.value': 'custom' }, designType: 'string', value: 'address' },
      },
    })
    const def = createFoormDef(type)
    expect(createFormData(type, def.fields)).toEqual({ value: { kind: 'custom' } })
  })

  it('uses literal value in nested object types', () => {
    const type = makeType({
      props: {
        address: {
          kind: 'object',
          metadata: {},
          nestedProps: {
            type: { metadata: {}, designType: 'string', value: 'home' },
            city: { metadata: {}, designType: 'string' },
          },
        },
      },
    })
    const def = createFoormDef(type)
    expect(createFormData(type, def.fields)).toEqual({
      value: { address: { type: 'home', city: '' } },
    })
  })

  it('skips phantom types in data', () => {
    const type = makeType({
      props: {
        name: { metadata: {}, designType: 'string' },
        save: { metadata: {}, tags: ['action'], designType: 'phantom' },
      },
    })
    const def = createFoormDef(type)
    const data = createFormData(type, def.fields)
    expect(data).toEqual({ value: { name: '' } })
    expect('save' in data.value).toBe(false)
  })
})

// ── getFormValidator ────────────────────────────────────────

describe('getFormValidator', () => {
  it('passes validation for valid data', () => {
    const type = makeType({
      props: { name: { metadata: {}, designType: 'string' } },
    })
    const errors = getFormValidator(createFoormDef(type))({ data: { name: 'Alice' } })
    expect(errors).toEqual({})
  })

  it('accepts empty string as valid (type-level validation only)', () => {
    const type = makeType({
      props: { name: { metadata: {}, designType: 'string' } },
    })
    const errors = getFormValidator(createFoormDef(type))({ data: { name: '' } })
    expect(errors).toEqual({})
  })

  it('fails validation with @foorm.validate custom rule', () => {
    const type = makeType({
      props: {
        name: {
          metadata: { 'foorm.validate': '(v) => !!v || "Name is required"' },
          designType: 'string',
        },
      },
    })
    const errors = getFormValidator(createFoormDef(type))({ data: { name: '' } })
    expect(errors.name).toBe('Name is required')
  })

  it('skips optional fields when empty', () => {
    const type = makeType({
      props: { bio: { metadata: {}, optional: true, designType: 'string' } },
    })
    expect(getFormValidator(createFoormDef(type))({ data: { bio: '' } })).toEqual({})
  })

  it('validates disabled fields normally', () => {
    const type = makeType({
      props: {
        locked: {
          metadata: {
            'foorm.disabled': true,
            'foorm.validate': '(v) => !!v || "Required"',
          },
          designType: 'string',
        },
      },
    })
    const errors = getFormValidator(createFoormDef(type))({ data: { locked: '' } })
    expect(errors.locked).toBe('Required')
  })

  it('validates hidden fields normally', () => {
    const type = makeType({
      props: {
        secret: {
          metadata: {
            'foorm.hidden': true,
            'foorm.validate': '(v) => !!v || "Required"',
          },
          designType: 'string',
        },
      },
    })
    const errors = getFormValidator(createFoormDef(type))({ data: { secret: '' } })
    expect(errors.secret).toBe('Required')
  })

  it('skips non-data types (action, paragraph)', () => {
    const type = makeType({
      props: {
        save: { metadata: {}, tags: ['action'], designType: 'phantom' },
        info: { metadata: {}, tags: ['paragraph'], designType: 'phantom' },
      },
    })
    expect(getFormValidator(createFoormDef(type))({ data: {} })).toEqual({})
  })

  it('validates with @expect constraints', () => {
    const type = makeType({
      props: { name: { metadata: { 'expect.minLength': 3 }, designType: 'string' } },
    })
    const validate = getFormValidator(createFoormDef(type))
    expect(validate({ data: { name: 'Alice' } })).toEqual({})
    expect(Object.keys(validate({ data: { name: 'Al' } })).length).toBeGreaterThan(0)
  })

  it('validates nested field paths with @expect', () => {
    const type = makeType({
      props: {
        address: {
          kind: 'object',
          metadata: {},
          nestedProps: {
            city: { metadata: { 'expect.minLength': 1 }, designType: 'string' },
          },
        },
      },
    })
    const validate = getFormValidator(createFoormDef(type))
    expect(validate({ data: { address: { city: 'NYC' } } })).toEqual({})
    const errors = validate({ data: { address: { city: '' } } })
    expect(errors['address.city']).toBeDefined()
  })

  it('accepts 0 and false as valid values', () => {
    const type = makeType({
      props: {
        count: { metadata: {}, designType: 'number' },
        flag: { metadata: {}, designType: 'boolean' },
      },
    })
    expect(getFormValidator(createFoormDef(type))({ data: { count: 0, flag: false } })).toEqual({})
  })

  it('passes context to @foorm.validate functions', () => {
    const type = makeType({
      props: {
        code: {
          metadata: { 'foorm.validate': '(v, data, context) => v === context.expected || "Wrong"' },
          designType: 'string',
        },
      },
    })
    const validate = getFormValidator(createFoormDef(type))
    expect(validate({ data: { code: 'abc' }, context: { expected: 'abc' } })).toEqual({})
    expect(validate({ data: { code: 'xyz' }, context: { expected: 'abc' } }).code).toBe('Wrong')
  })
})

// ── supportsAltAction ───────────────────────────────────────

describe('supportsAltAction', () => {
  it('returns true when a field has the given altAction', () => {
    const type = makeType({
      props: {
        save: {
          metadata: { 'foorm.altAction': { id: 'save-draft' } },
          tags: ['action'],
          designType: 'phantom',
        },
      },
    })
    expect(supportsAltAction(createFoormDef(type), 'save-draft')).toBe(true)
  })

  it('returns false when no field has the given altAction', () => {
    const type = makeType({
      props: { name: { metadata: {}, designType: 'string' } },
    })
    expect(supportsAltAction(createFoormDef(type), 'save-draft')).toBe(false)
  })
})
