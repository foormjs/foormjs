import type {
  TAtscriptAnnotatedType,
  TAtscriptTypeArray,
  TAtscriptTypeComplex,
  TAtscriptTypeObject,
} from '@atscript/typescript/utils'
import { flattenAnnotatedType } from '@atscript/typescript/utils'
import type {
  FoormArrayFieldDef,
  FoormDef,
  FoormFieldDef,
  FoormObjectFieldDef,
  FoormTupleFieldDef,
  FoormUnionFieldDef,
  FoormUnionVariant,
} from './types'
import { getFieldMeta, hasComputedAnnotations } from './utils'

/** Known foorm primitive extension tags that map directly to field types. */
const FOORM_TAGS = new Set(['action', 'paragraph', 'select', 'radio', 'checkbox'])

/**
 * Converts an ATScript annotated type into a FoormDef.
 *
 * Accepts any annotated type:
 * - **Object types** (`kind === 'object'`): produces an object root with nested fields
 *   by flattening the prop map and delegating per-field resolution to `createFieldDef`.
 *   Flat objects (no `@foorm.title`/`@foorm.component`) are skipped — children render inline.
 *   Nested arrays of arrays without `@foorm.component` are unsupported and skipped.
 * - **Non-object types** (primitive, array, union, etc.): produces a single leaf root field
 *   with `path: ''` — form data is wrapped in `{ value: ... }`, getByPath/setByPath handle root access
 *
 * @param type - ATScript annotated type describing the form schema
 * @returns A FoormDef with ordered fields, the source type, and a flatMap of all paths
 */
export function createFoormDef(type: TAtscriptAnnotatedType): FoormDef {
  // Non-object types: single leaf field
  if (type.type.kind !== 'object') {
    const rootField = createFieldDef('', type)
    return { type, rootField, fields: [rootField], flatMap: new Map() }
  }

  // Object types: flatten and iterate props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objectType = type as TAtscriptAnnotatedType<TAtscriptTypeObject<any, any>>
  const flatMap = flattenAnnotatedType(objectType, { excludePhantomTypes: false })

  const fields: FoormFieldDef[] = []
  // Paths that are structured (array or object) — their children are excluded from top-level fields
  const structuredPrefixes = new Set<string>()

  for (const [path, prop] of flatMap.entries()) {
    if (path === '') continue
    if (isChildOfStructured(path, structuredPrefixes)) continue

    // flattenAnnotatedType may create synthetic entries that lose prop-level flags
    // (e.g. optional). Always resolve the original prop from the type hierarchy.
    const originalProp = resolveOriginalProp(objectType, path) ?? prop
    const kind = originalProp.type.kind

    // Flat objects (no title/component): skip, children render inline
    if (kind === 'object') {
      const hasTitle =
        getFieldMeta(originalProp, 'foorm.title') !== undefined ||
        getFieldMeta(originalProp, 'foorm.fn.title') !== undefined
      const hasComponent = getFieldMeta(originalProp, 'foorm.component') !== undefined
      if (!hasTitle && !hasComponent) continue
    }

    // Nested arrays without component: unsupported
    if (kind === 'array') {
      const arrayType = originalProp.type as TAtscriptTypeArray
      if (arrayType.of.type.kind === 'array' && !getFieldMeta(originalProp, 'foorm.component'))
        continue
    }

    // Mark structured prefixes (arrays, objects, unions, tuples — their children are handled by sub-forms)
    if (kind === 'array' || kind === 'object' || kind === 'union' || kind === 'tuple') {
      structuredPrefixes.add(path)
    }

    fields.push(createFieldDef(path, originalProp))
  }

  // Schwartzian transform: pre-compute order values (O(N)) to avoid
  // repeated getFieldMeta calls inside the comparator (O(N log N)).
  const decorated = fields.map(f => ({
    f,
    order: getFieldMeta(f.prop, 'foorm.order') ?? Infinity,
  }))
  decorated.sort((a, b) => a.order - b.order)
  fields.length = 0
  for (const { f } of decorated) fields.push(f)

  const def: FoormDef = { type, rootField: undefined!, fields, flatMap }
  def.rootField = {
    path: '',
    prop: type,
    type: 'object',
    phantom: false,
    name: '',
    allStatic: false,
    objectDef: def,
  } as FoormObjectFieldDef
  return def
}

// ── Unified field def creation ───────────────────────────────

/**
 * Creates a FoormFieldDef from any ATScript annotated type.
 * Single source of truth for mapping type kinds to field types.
 */
function createFieldDef(path: string, prop: TAtscriptAnnotatedType): FoormFieldDef {
  const kind = prop.type.kind
  const name = path.slice(path.lastIndexOf('.') + 1)
  const allStatic = !hasComputedAnnotations(prop)
  const foormType = getFieldMeta(prop, 'foorm.type')
  const base = { path, prop, phantom: false, name, allStatic }

  // Array
  if (kind === 'array') {
    const arrayType = prop.type as TAtscriptTypeArray
    return {
      ...base,
      type: 'array',
      itemType: arrayType.of,
      itemField: createFieldDef('', arrayType.of),
    } as FoormArrayFieldDef
  }

  // Object
  if (kind === 'object') {
    return {
      ...base,
      type: 'object',
      objectDef: createFoormDef(prop as TAtscriptAnnotatedType<TAtscriptTypeObject>),
    } as FoormObjectFieldDef
  }

  // Union → union (multi) or unwrap (single)
  if (kind === 'union') {
    const unionVariants = buildUnionVariants(prop)
    if (unionVariants.length > 1) {
      return { ...base, type: 'union', unionVariants } as FoormUnionFieldDef
    }
    // Single variant → use its type directly
    const v = unionVariants[0]
    if (v?.itemField) return { ...v.itemField, path, name, allStatic }
    if (v?.def) {
      return { ...base, type: 'object', objectDef: v.def } as FoormObjectFieldDef
    }
  }

  // Tuple → fixed-length array with typed positions
  if (kind === 'tuple') {
    const tupleType = prop.type as TAtscriptTypeComplex
    return {
      ...base,
      type: 'tuple',
      itemFields: tupleType.items.map((item, i) => ({
        ...createFieldDef(String(i), item),
        name: '',
      })),
    } as FoormTupleFieldDef
  }

  // Primitive / intersection / fallback
  const tags = kind === '' ? prop.type.tags : undefined
  let foormTag: string | undefined
  if (tags) {
    for (const t of tags) {
      if (FOORM_TAGS.has(t)) {
        foormTag = t
        break
      }
    }
  }
  const dt = kind === '' ? prop.type.designType : undefined
  return {
    ...base,
    type:
      foormType ??
      foormTag ??
      (dt === 'number' ? 'number' : dt === 'boolean' ? 'checkbox' : 'text'),
    phantom: kind === '' && dt === 'phantom',
  }
}

// ── Helpers ─────────────────────────────────────────────────

/** Resolves the original annotated type from the type hierarchy by path. */
function resolveOriginalProp(
  type: TAtscriptAnnotatedType<TAtscriptTypeObject>,
  path: string
): TAtscriptAnnotatedType | undefined {
  const parts = path.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: TAtscriptTypeObject<any, any> = type.type
  for (let i = 0; i < parts.length - 1; i++) {
    const prop = current.props.get(parts[i])
    if (!prop || prop.type.kind !== 'object') return undefined
    current = prop.type as TAtscriptTypeObject
  }
  return current.props.get(parts[parts.length - 1])
}

/** Check if a path is a child of any structured prefix. */
function isChildOfStructured(path: string, prefixes: Set<string>): boolean {
  for (const prefix of prefixes) {
    if (path.startsWith(`${prefix}.`)) return true
  }
  return false
}

/**
 * Builds union variant definitions from a union/tuple annotated type.
 * Iterates top-level items directly — one variant per item.
 */
export function buildUnionVariants(typeDef: TAtscriptAnnotatedType): FoormUnionVariant[] {
  const complex = typeDef.type as TAtscriptTypeComplex
  const items = complex.items ?? [typeDef]
  const variants: FoormUnionVariant[] = []

  for (const item of items) {
    const v = createVariant(item)
    variants.push({
      ...v,
      label: items.length > 1 ? `${variants.length + 1}. ${v.label}` : v.label,
    })
  }

  return variants
}

/** Creates a single union variant from an annotated type item. */
function createVariant(def: TAtscriptAnnotatedType): FoormUnionVariant {
  const kind = def.type.kind

  if (kind === 'object') {
    const label = getFieldMeta(def, 'meta.label') ?? getFieldMeta(def, 'foorm.title') ?? 'Object'
    const hasComponent = getFieldMeta(def, 'foorm.component') !== undefined
    return {
      label, // variant label
      type: def,
      def: createFoormDef(def as TAtscriptAnnotatedType<TAtscriptTypeObject>),
      itemField: hasComponent ? createFieldDef('', def) : undefined,
    }
  }

  // Primitive (final or phantom)
  if (kind === '') {
    const dt = def.type.designType as string
    return {
      label: capitalize(dt === 'phantom' ? 'item' : dt), // variant label
      type: def,
      itemField: createFieldDef('', def),
      designType: dt,
    }
  }

  // Complex types (array, tuple, intersection) — delegate to createFieldDef
  return {
    label: capitalize(kind), // variant label
    type: def,
    itemField: createFieldDef('', def),
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
