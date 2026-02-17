import type { TAtscriptAnnotatedType, TAtscriptTypeObject } from '@atscript/typescript/utils'
import { flattenAnnotatedType } from '@atscript/typescript/utils'
import type { FoormDef, FoormFieldDef } from './types'
import { getFieldMeta, hasComputedAnnotations } from './utils'

/** Known foorm primitive extension tags that map directly to field types. */
const FOORM_TAGS = new Set(['action', 'paragraph', 'select', 'radio', 'checkbox'])

/**
 * Converts an ATScript annotated type into a FoormDef.
 *
 * Produces a thin field list — each FoormFieldDef is a pointer to its
 * ATScript prop. No metadata is copied; resolve on demand via utilities.
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

  for (const [path, prop] of flatMap.entries()) {
    // flattenAnnotatedType includes root ('') and intermediate objects in the map
    if (path === '' || prop.type.kind === 'object') {
      continue
    }

    const tags = prop.type.kind === '' ? prop.type.tags : undefined
    const foormType = getFieldMeta<string>(prop, 'foorm.type')
    const foormTag = tags ? [...tags].find(t => FOORM_TAGS.has(t)) : undefined

    fields.push({
      path,
      prop,
      type: foormType ?? foormTag ?? 'text',
      phantom: prop.type.kind === '' && prop.type.designType === 'phantom',
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
