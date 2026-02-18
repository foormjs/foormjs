import type {
  TAtscriptAnnotatedType,
  TAtscriptTypeArray,
  TAtscriptTypeComplex,
  TAtscriptTypeObject,
} from '@atscript/typescript/utils'
import { flattenAnnotatedType, forAnnotatedType } from '@atscript/typescript/utils'
import type {
  FoormArrayFieldDef,
  FoormArrayVariant,
  FoormDef,
  FoormFieldDef,
  FoormGroupFieldDef,
} from './types'
import { getFieldMeta, hasComputedAnnotations } from './utils'

/** Known foorm primitive extension tags that map directly to field types. */
const FOORM_TAGS = new Set(['action', 'paragraph', 'select', 'radio', 'checkbox'])

/**
 * Converts an ATScript annotated type into a FoormDef.
 *
 * Produces a thin field list — each FoormFieldDef is a pointer to its
 * ATScript prop. No metadata is copied; resolve on demand via utilities.
 *
 * Handles three kinds of structured fields:
 * - **Array fields** (`kind === 'array'`): always included as `type: 'array'` with pre-built variants
 * - **Object groups** (`kind === 'object'` with `@foorm.title`/`@foorm.component`): included as `type: 'group'`
 * - **Flat objects** (`kind === 'object'` without title/component): skipped, children rendered flat (backwards-compatible)
 *
 * @param type - ATScript annotated object type describing the form schema
 * @returns A FoormDef with ordered fields, the source type, and a flatMap of all paths
 */
export function createFoormDef(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: TAtscriptAnnotatedType<TAtscriptTypeObject<any, any>>
): FoormDef {
  const flatMap = flattenAnnotatedType(type, { excludePhantomTypes: false })

  const fields: FoormFieldDef[] = []
  // Paths that are structured (array or group) — their children are excluded from top-level fields
  const structuredPrefixes = new Set<string>()

  for (const [path, prop] of flatMap.entries()) {
    // flattenAnnotatedType includes root ('') in the map — skip it
    if (path === '') continue

    // Skip children of structured fields (they're rendered by sub-forms)
    if (isChildOfStructured(path, structuredPrefixes)) continue

    const kind = prop.type.kind

    // ── Array field ──────────────────────────────────────────
    if (kind === 'array') {
      const arrayType = prop.type as TAtscriptTypeArray
      const itemType = arrayType.of
      const hasComponent = getFieldMeta<string>(prop, 'foorm.component') !== undefined

      // Nested arrays (array of arrays) are unsupported unless @foorm.component is set
      if (itemType.type.kind === 'array' && !hasComponent) continue

      structuredPrefixes.add(path)

      const arrayField: FoormArrayFieldDef = {
        path,
        prop,
        type: 'array',
        phantom: false,
        name: path.split('.').pop() ?? path,
        allStatic: !hasComputedAnnotations(prop),
        itemType,
        variants: buildVariants(itemType),
      }
      fields.push(arrayField)
      continue
    }

    // ── Object field (potential group) ───────────────────────
    if (kind === 'object') {
      const hasTitle =
        getFieldMeta(prop, 'foorm.title') !== undefined ||
        getFieldMeta(prop, 'foorm.fn.title') !== undefined
      const hasComponent = getFieldMeta<string>(prop, 'foorm.component') !== undefined

      if (hasTitle || hasComponent) {
        structuredPrefixes.add(path)

        const groupField: FoormGroupFieldDef = {
          path,
          prop,
          type: 'group',
          phantom: false,
          name: path.split('.').pop() ?? path,
          allStatic: !hasComputedAnnotations(prop),
          groupDef: createFoormDef(prop as TAtscriptAnnotatedType<TAtscriptTypeObject>),
        }
        fields.push(groupField)
      }
      // Objects without title/component are skipped — their children render flat
      continue
    }

    // ── Regular leaf field ───────────────────────────────────
    const tags = kind === '' ? prop.type.tags : undefined
    const foormType = getFieldMeta<string>(prop, 'foorm.type')
    const foormTag = tags ? [...tags].find(t => FOORM_TAGS.has(t)) : undefined

    fields.push({
      path,
      prop,
      type: foormType ?? foormTag ?? 'text',
      phantom: kind === '' && prop.type.designType === 'phantom',
      name: path.split('.').pop() ?? path,
      allStatic: !hasComputedAnnotations(prop),
    })
  }

  fields.sort((a, b) => {
    const orderA = getFieldMeta<number>(a.prop, 'foorm.order') ?? Infinity
    const orderB = getFieldMeta<number>(b.prop, 'foorm.order') ?? Infinity
    return orderA - orderB
  })

  return { type, fields, flatMap }
}

// ── Helpers ─────────────────────────────────────────────────

/** Check if a path is a child of any structured prefix. */
function isChildOfStructured(path: string, prefixes: Set<string>): boolean {
  for (const prefix of prefixes) {
    if (path.startsWith(`${prefix}.`)) return true
  }
  return false
}

/**
 * Builds variant definitions for an array's item type.
 * Dispatches on the item type's kind to determine variant count and labels.
 */
export function buildVariants(itemType: TAtscriptAnnotatedType): FoormArrayVariant[] {
  return forAnnotatedType<FoormArrayVariant[]>(itemType, {
    final(def) {
      const dt = def.type.designType
      return [
        {
          label: capitalize(dt === 'phantom' ? 'item' : dt),
          type: def,
          itemField: {
            path: undefined,
            prop: def,
            type: dt === 'number' ? 'number' : dt === 'boolean' ? 'checkbox' : 'text',
            phantom: false,
            name: 'value',
            allStatic: !hasComputedAnnotations(def),
          },
          designType: dt,
        },
      ]
    },

    phantom(def) {
      return [
        {
          label: 'Item',
          type: def,
          itemField: {
            path: undefined,
            prop: def,
            type: 'text',
            phantom: true,
            name: 'value',
            allStatic: !hasComputedAnnotations(def),
          },
          designType: 'phantom',
        },
      ]
    },

    object(def) {
      const label =
        getFieldMeta<string>(def, 'meta.label') ??
        getFieldMeta<string>(def, 'foorm.title') ??
        'Structure'
      const hasComponent = getFieldMeta<string>(def, 'foorm.component') !== undefined
      return [
        {
          label,
          type: def,
          def: createFoormDef(def as TAtscriptAnnotatedType<TAtscriptTypeObject>),
          itemField: hasComponent
            ? {
                path: undefined,
                prop: def,
                type: 'group',
                phantom: false,
                name: 'value',
                allStatic: !hasComputedAnnotations(def),
              }
            : undefined,
        },
      ]
    },

    array(def) {
      // Nested arrays — single unsupported variant
      return [
        {
          label: 'Array',
          type: def,
          designType: 'array',
        },
      ]
    },

    union(def) {
      return buildComplexVariants(def)
    },

    intersection(def) {
      // Intersections merge into a single object — treat as a single variant
      const label = getFieldMeta<string>(def, 'meta.label') ?? 'Structure'
      return [
        {
          label,
          type: def,
          // For intersections we cannot create a sub-FoormDef (not an object kind),
          // but the validator handles intersections natively. Render as custom component territory.
        },
      ]
    },

    tuple(def) {
      return buildComplexVariants(def)
    },
  })
}

/** Build variants for union/tuple types — one variant per item. */
function buildComplexVariants(
  def: TAtscriptAnnotatedType<TAtscriptTypeComplex>
): FoormArrayVariant[] {
  const variants: FoormArrayVariant[] = []
  const items = def.type.items

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const innerVariants = buildVariants(item)
    // Each inner variant gets an indexed label prefix for union disambiguation
    for (const v of innerVariants) {
      variants.push({
        ...v,
        label: items.length > 1 ? `${variants.length + 1}. ${v.label}` : v.label,
      })
    }
  }

  return variants
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
