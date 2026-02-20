import { defineAnnotatedType } from '@atscript/typescript/utils'
import type { TAtscriptAnnotatedType, TAtscriptTypeObject } from '@atscript/typescript/utils'
import { createFoormDef, buildUnionVariants } from './runtime/create-foorm'
import { createItemData, detectUnionVariant, createFormData } from './runtime/utils'
import { isArrayField, isObjectField, isUnionField } from './runtime/types'
import type { FoormArrayFieldDef, FoormObjectFieldDef, FoormUnionFieldDef } from './runtime/types'

// ── Helpers ────────────────────────────────────────────────────

/** Build a simple annotated type with object kind and props. */
function makeObjectType(
  props: Record<
    string,
    {
      designType?: string
      metadata?: Record<string, unknown>
      optional?: boolean
      tags?: string[]
      kind?: 'array' | 'object'
      of?: ReturnType<typeof defineAnnotatedType>
      nestedProps?: Record<
        string,
        { designType?: string; metadata?: Record<string, unknown>; optional?: boolean }
      >
    }
  >,
  metadata?: Record<string, unknown>
): TAtscriptAnnotatedType<TAtscriptTypeObject> {
  const root = defineAnnotatedType('object')

  if (metadata) {
    for (const [key, value] of Object.entries(metadata)) {
      root.annotate(key as never, value)
    }
  }

  for (const [name, propDef] of Object.entries(props)) {
    let prop: ReturnType<typeof defineAnnotatedType>

    if (propDef.kind === 'array' && propDef.of) {
      prop = defineAnnotatedType('array')
      prop.of(propDef.of.$type)
    } else if (propDef.kind === 'object' && propDef.nestedProps) {
      prop = defineAnnotatedType('object')
      for (const [nestedName, nestedDef] of Object.entries(propDef.nestedProps)) {
        const nestedProp = defineAnnotatedType()
        if (nestedDef.designType) nestedProp.designType(nestedDef.designType as never)
        if (nestedDef.optional) nestedProp.optional()
        if (nestedDef.metadata) {
          for (const [k, v] of Object.entries(nestedDef.metadata)) {
            nestedProp.annotate(k as never, v)
          }
        }
        prop.prop(nestedName, nestedProp.$type)
      }
    } else {
      prop = defineAnnotatedType()
      if (propDef.designType) prop.designType(propDef.designType as never)
      if (propDef.tags) prop.tags(...propDef.tags)
    }

    if (propDef.optional) prop.optional()
    if (propDef.metadata) {
      for (const [k, v] of Object.entries(propDef.metadata)) {
        prop.annotate(k as never, v)
      }
    }

    root.prop(name, prop.$type)
  }

  return root.$type as TAtscriptAnnotatedType<TAtscriptTypeObject>
}

// ── createFoormDef: array detection ─────────────────────────

describe('createFoormDef with arrays', () => {
  it('creates FoormArrayFieldDef for simple string array', () => {
    const stringItem = defineAnnotatedType().designType('string')
    const type = makeObjectType({
      name: { designType: 'string' },
      tags: { kind: 'array', of: stringItem },
    })

    const def = createFoormDef(type)
    expect(def.fields).toHaveLength(2)

    const nameField = def.fields.find(f => f.path === 'name')
    expect(nameField).toBeDefined()
    expect(nameField?.type).toBe('text')

    const tagsField = def.fields.find(f => f.path === 'tags')
    expect(tagsField).toBeDefined()
    expect(tagsField?.type).toBe('array')
    expect(isArrayField(tagsField as FoormArrayFieldDef)).toBe(true)

    const arrayDef = tagsField as FoormArrayFieldDef
    expect(arrayDef.itemField).toBeDefined()
    expect(arrayDef.itemField.type).toBe('text')
  })

  it('creates FoormArrayFieldDef for object array with itemField', () => {
    const itemType = defineAnnotatedType('object')
    itemType.prop('street', defineAnnotatedType().designType('string').$type)
    itemType.prop('city', defineAnnotatedType().designType('string').$type)

    const type = makeObjectType({
      addresses: { kind: 'array', of: itemType },
    })

    const def = createFoormDef(type)
    expect(def.fields).toHaveLength(1)

    const arrayField = def.fields[0] as FoormArrayFieldDef
    expect(arrayField.type).toBe('array')
    expect(arrayField.itemField).toBeDefined()
    expect(isObjectField(arrayField.itemField)).toBe(true)
    const objField = arrayField.itemField as FoormObjectFieldDef
    expect(objField.objectDef.fields).toHaveLength(2)
    expect(objField.objectDef.fields.map(f => f.path).sort()).toEqual(['city', 'street'])
  })

  it('skips child paths of array fields', () => {
    const itemType = defineAnnotatedType('object')
    itemType.prop('street', defineAnnotatedType().designType('string').$type)

    const type = makeObjectType({
      name: { designType: 'string' },
      addresses: { kind: 'array', of: itemType },
    })

    const def = createFoormDef(type)
    // Should have 'name' (leaf) + 'addresses' (array), but NOT 'addresses.street'
    const paths = def.fields.map(f => f.path)
    expect(paths).toContain('name')
    expect(paths).toContain('addresses')
    expect(paths).not.toContain('addresses.street')
  })

  it('creates union itemField for union array', () => {
    const stringItem = defineAnnotatedType().designType('string')
    const numberItem = defineAnnotatedType().designType('number')
    const union = defineAnnotatedType('union')
    union.item(stringItem.$type)
    union.item(numberItem.$type)

    const arrayOf = defineAnnotatedType('array')
    arrayOf.of(union.$type)

    const root = defineAnnotatedType('object')
    root.prop('items', arrayOf.$type)
    const type = root.$type as TAtscriptAnnotatedType<TAtscriptTypeObject>

    const def = createFoormDef(type)
    expect(def.fields).toHaveLength(1)

    const arrayField = def.fields[0] as FoormArrayFieldDef
    expect(isUnionField(arrayField.itemField)).toBe(true)
    const unionField = arrayField.itemField as FoormUnionFieldDef
    expect(unionField.unionVariants).toHaveLength(2)
    expect(unionField.unionVariants[0].designType).toBe('string')
    expect(unionField.unionVariants[1].designType).toBe('number')
    // Labels should be prefixed with index for union
    expect(unionField.unionVariants[0].label).toMatch(/1\..*String/)
    expect(unionField.unionVariants[1].label).toMatch(/2\..*Number/)
  })

  it('skips nested arrays (array of array) without @foorm.component', () => {
    const innerArray = defineAnnotatedType('array')
    innerArray.of(defineAnnotatedType().designType('number').$type)

    const type = makeObjectType({
      matrix: { kind: 'array', of: innerArray },
    })

    const def = createFoormDef(type)
    expect(def.fields).toHaveLength(0)
  })

  it('includes nested arrays with @foorm.component', () => {
    const innerArray = defineAnnotatedType('array')
    innerArray.of(defineAnnotatedType().designType('number').$type)

    const outerArray = defineAnnotatedType('array')
    outerArray.of(innerArray.$type)
    outerArray.annotate('foorm.component' as never, 'MatrixEditor')

    const root = defineAnnotatedType('object')
    root.prop('matrix', outerArray.$type)
    const type = root.$type as TAtscriptAnnotatedType<TAtscriptTypeObject>

    const def = createFoormDef(type)
    expect(def.fields).toHaveLength(1)
    expect(def.fields[0].type).toBe('array')
  })
})

// ── createFoormDef: object detection ─────────────────────────

describe('createFoormDef with objects', () => {
  it('creates FoormObjectFieldDef for object with @foorm.title', () => {
    const type = makeObjectType({
      address: {
        kind: 'object',
        metadata: { 'foorm.title': 'Address' },
        nestedProps: {
          street: { designType: 'string' },
          city: { designType: 'string' },
        },
      },
    })

    const def = createFoormDef(type)
    // Should have 1 object field, not 2 flat fields
    expect(def.fields).toHaveLength(1)
    const group = def.fields[0] as FoormObjectFieldDef
    expect(group.type).toBe('object')
    expect(isObjectField(group)).toBe(true)
    expect(group.objectDef.fields).toHaveLength(2)
  })

  it('flattens objects without @foorm.title (backwards compatible)', () => {
    const type = makeObjectType({
      address: {
        kind: 'object',
        nestedProps: {
          street: { designType: 'string' },
          city: { designType: 'string' },
        },
      },
    })

    const def = createFoormDef(type)
    // Should have 2 flat fields (address.street, address.city)
    expect(def.fields).toHaveLength(2)
    expect(def.fields.map(f => f.path).sort()).toEqual(['address.city', 'address.street'])
  })

  it('creates object for object with @foorm.component', () => {
    const type = makeObjectType({
      address: {
        kind: 'object',
        metadata: { 'foorm.component': 'AddressWidget' },
        nestedProps: {
          street: { designType: 'string' },
        },
      },
    })

    const def = createFoormDef(type)
    expect(def.fields).toHaveLength(1)
    expect(def.fields[0].type).toBe('object')
  })
})

// ── buildUnionVariants ──────────────────────────────────────

describe('buildUnionVariants', () => {
  it('builds single variant for primitive', () => {
    const stringType = defineAnnotatedType().designType('string').$type
    const variants = buildUnionVariants(stringType)
    expect(variants).toHaveLength(1)
    expect(variants[0].designType).toBe('string')
    expect(variants[0].label).toBe('String')
    expect(variants[0].def).toBeUndefined()
  })

  it('builds single variant for object', () => {
    const objType = defineAnnotatedType('object')
    objType.prop('name', defineAnnotatedType().designType('string').$type)
    const variants = buildUnionVariants(objType.$type)
    expect(variants).toHaveLength(1)
    expect(variants[0].def).toBeDefined()
    expect(variants[0].def?.fields).toHaveLength(1)
  })

  it('builds variants for union', () => {
    const union = defineAnnotatedType('union')
    union.item(defineAnnotatedType().designType('string').$type)
    union.item(defineAnnotatedType().designType('boolean').$type)
    const variants = buildUnionVariants(union.$type)
    expect(variants).toHaveLength(2)
    expect(variants[0].designType).toBe('string')
    expect(variants[1].designType).toBe('boolean')
  })

  it('uses @meta.label for object variant label', () => {
    const obj = defineAnnotatedType('object')
    obj.annotate('meta.label' as never, 'Product')
    obj.prop('name', defineAnnotatedType().designType('string').$type)
    const variants = buildUnionVariants(obj.$type)
    expect(variants[0].label).toBe('Product')
  })
})

// ── createItemData ──────────────────────────────────────────

describe('createItemData', () => {
  it('returns empty string for string variant', () => {
    expect(
      createItemData({
        label: 'String',
        type: defineAnnotatedType().designType('string').$type,
        designType: 'string',
      })
    ).toBe('')
  })

  it('returns 0 for number variant', () => {
    expect(
      createItemData({
        label: 'Number',
        type: defineAnnotatedType().designType('number').$type,
        designType: 'number',
      })
    ).toBe(0)
  })

  it('returns false for boolean variant', () => {
    expect(
      createItemData({
        label: 'Boolean',
        type: defineAnnotatedType().designType('boolean').$type,
        designType: 'boolean',
      })
    ).toBe(false)
  })

  it('returns object with defaults for object variant', () => {
    const obj = defineAnnotatedType('object')
    obj.prop('name', defineAnnotatedType().designType('string').$type)
    obj.prop('active', defineAnnotatedType().designType('boolean').$type)
    const variant = buildUnionVariants(obj.$type)[0]

    const data = createItemData(variant) as Record<string, unknown>
    expect(data).toEqual({ name: '', active: false })
  })
})

// ── detectUnionVariant ──────────────────────────────────────

describe('detectUnionVariant', () => {
  it('returns 0 for single variant', () => {
    const variants = buildUnionVariants(defineAnnotatedType().designType('string').$type)
    expect(detectUnionVariant('hello', variants)).toBe(0)
  })

  it('detects primitive variant by typeof', () => {
    const union = defineAnnotatedType('union')
    union.item(defineAnnotatedType().designType('string').$type)
    union.item(defineAnnotatedType().designType('number').$type)
    const variants = buildUnionVariants(union.$type)

    expect(detectUnionVariant('hello', variants)).toBe(0)
    expect(detectUnionVariant(42, variants)).toBe(1)
  })

  it('falls back to 0 for unknown type', () => {
    const union = defineAnnotatedType('union')
    union.item(defineAnnotatedType().designType('string').$type)
    union.item(defineAnnotatedType().designType('number').$type)
    const variants = buildUnionVariants(union.$type)

    expect(detectUnionVariant(null, variants)).toBe(0)
  })
})

// ── createFormData with arrays ──────────────────────────────

describe('createFormData with arrays', () => {
  it('initializes array fields to empty array', () => {
    const stringItem = defineAnnotatedType().designType('string')
    const type = makeObjectType({
      name: { designType: 'string' },
      tags: { kind: 'array', of: stringItem },
    })

    const def = createFoormDef(type)
    const data = createFormData(type, def.fields)
    expect(data).toEqual({ value: { name: '', tags: [] } })
  })
})

// ── createFoormDef with single-type (leaf) forms ────────────

describe('createFoormDef with single-type forms', () => {
  it('creates leaf FoormDef for a string type', () => {
    const type = defineAnnotatedType().designType('string').$type
    const def = createFoormDef(type)

    expect(def.rootField.type).toBe('text')
    expect(def.rootField.path).toBe('')
    expect(def.rootField.name).toBe('')
    expect(def.fields).toHaveLength(1)
    expect(def.fields[0]).toBe(def.rootField)
    expect(def.flatMap.size).toBe(0)
  })

  it('creates leaf FoormDef for a number type', () => {
    const type = defineAnnotatedType().designType('number').$type
    const def = createFoormDef(type)

    expect(def.rootField.type).toBe('number')
    expect(def.rootField.path).toBe('')
  })

  it('creates leaf FoormDef for a boolean type', () => {
    const type = defineAnnotatedType().designType('boolean').$type
    const def = createFoormDef(type)

    expect(def.rootField.type).toBe('checkbox')
    expect(def.rootField.path).toBe('')
  })

  it('respects @foorm.type override on leaf form', () => {
    const type = defineAnnotatedType().designType('string')
    type.annotate('foorm.type' as never, 'textarea')
    const def = createFoormDef(type.$type)

    expect(def.rootField.type).toBe('textarea')
    expect(def.rootField.path).toBe('')
  })

  it('creates array FoormDef for array type', () => {
    const itemType = defineAnnotatedType().designType('string')
    const type = defineAnnotatedType('array')
    type.of(itemType.$type)
    const def = createFoormDef(type.$type)

    expect(def.rootField.type).toBe('array')
    expect(def.rootField.path).toBe('')
    expect(isArrayField(def.rootField)).toBe(true)
    const arrayField = def.rootField as FoormArrayFieldDef
    expect(arrayField.itemField).toBeDefined()
    expect(arrayField.itemField.type).toBe('text')
  })

  it('still creates object FoormDef normally', () => {
    const type = makeObjectType({
      name: { designType: 'string' },
      age: { designType: 'number' },
    })
    const def = createFoormDef(type)

    expect(def.rootField.type).toBe('object')
    expect(def.fields).toHaveLength(2)
  })
})

// ── createFormData with single-type forms ───────────────────

describe('createFormData with single-type forms', () => {
  it('wraps string type in { value: "" }', () => {
    const type = defineAnnotatedType().designType('string').$type
    const def = createFoormDef(type)
    const data = createFormData(type, def.fields)
    expect(data).toEqual({ value: '' })
  })

  it('wraps number type in { value: 0 }', () => {
    const type = defineAnnotatedType().designType('number').$type
    const def = createFoormDef(type)
    const data = createFormData(type, def.fields)
    expect(data).toEqual({ value: 0 })
  })

  it('wraps boolean type in { value: false }', () => {
    const type = defineAnnotatedType().designType('boolean').$type
    const def = createFoormDef(type)
    const data = createFormData(type, def.fields)
    expect(data).toEqual({ value: false })
  })

  it('wraps array type in { value: [] }', () => {
    const itemType = defineAnnotatedType().designType('string')
    const type = defineAnnotatedType('array')
    type.of(itemType.$type)
    const def = createFoormDef(type.$type)
    const data = createFormData(type.$type, def.fields)
    expect(data).toEqual({ value: [] })
  })

  it('creates undefined for optional array prop', () => {
    const stringItem = defineAnnotatedType().designType('string')
    const type = makeObjectType({
      tags: { kind: 'array', of: stringItem, optional: true },
    })
    const def = createFoormDef(type)
    const data = createFormData(type, def.fields)
    expect(data.value.tags).toBeUndefined()
  })

  it('preserves optional flag on array field def prop', () => {
    const stringItem = defineAnnotatedType().designType('string')
    const type = makeObjectType({
      tags: { kind: 'array', of: stringItem, optional: true },
    })
    const def = createFoormDef(type)
    const tagsField = def.fields.find(f => f.path === 'tags')
    expect(tagsField).toBeDefined()
    expect(tagsField!.prop.optional).toBe(true)
  })

  it('creates [] for non-optional array prop', () => {
    const stringItem = defineAnnotatedType().designType('string')
    const type = makeObjectType({
      tags: { kind: 'array', of: stringItem },
    })
    const def = createFoormDef(type)
    const data = createFormData(type, def.fields)
    expect(data.value.tags).toEqual([])
  })
})
