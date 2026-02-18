import type {
  TComputed,
  TFoormFnScope,
  TFoormEntryOptions,
  FoormFieldDef,
  FoormArrayVariant,
} from './types'
import type { TAtscriptAnnotatedType, TAtscriptTypeObject } from '@atscript/typescript/utils'
import { isPhantomType } from '@atscript/typescript/utils'
import { compileFieldFn, compileTopFn } from './fn-compiler'

// ── Metadata access ─────────────────────────────────────────

/** Loose metadata accessor for internal use. */
type TMetadataAccessor = { get(key: string): unknown }

/**
 * Reads a static metadata value from an ATScript prop.
 *
 * @param prop - ATScript annotated type for the field
 * @param key - Metadata key to read (e.g., `'foorm.autocomplete'`)
 * @returns The metadata value cast to `T`, or `undefined` if not present
 */
export function getFieldMeta<T>(prop: TAtscriptAnnotatedType, key: string): T | undefined {
  return (prop.metadata as unknown as TMetadataAccessor).get(key) as T | undefined
}

// ── Resolve on demand ───────────────────────────────────────

/** Options for field and form property resolution. */
export interface TResolveOptions<T> {
  /** When true, any non-undefined static value is returned as `true` (for boolean flags like foorm.disabled). */
  staticAsBoolean?: boolean
  /** Transform the raw static value before returning. */
  transform?: (raw: unknown) => T
}

/**
 * Core field-level resolver. Reads metadata on demand:
 * 1. Check fnKey — if found, compile and call with scope
 * 2. Check staticKey — if found, return static value (optionally transformed)
 * 3. Return undefined
 *
 * FNPool caching makes repeated calls for the same fn string essentially free.
 *
 * @param prop - ATScript annotated type for the field
 * @param fnKey - Metadata key for the computed function string (e.g., `'foorm.fn.label'`)
 * @param staticKey - Metadata key for the static value (e.g., `'meta.label'`), or `undefined` to skip
 * @param scope - Current form scope with value, data, context, and entry
 * @param opts - Optional resolve options (staticAsBoolean, transform)
 * @returns The resolved value, or `undefined` if neither fn nor static metadata exists
 */
export function resolveFieldProp<T>(
  prop: TAtscriptAnnotatedType,
  fnKey: string,
  staticKey: string | undefined,
  scope: TFoormFnScope,
  opts?: TResolveOptions<T>
): T | undefined {
  const metadata = prop.metadata as unknown as TMetadataAccessor

  const fnStr = metadata.get(fnKey)
  if (typeof fnStr === 'string') {
    return compileFieldFn<T>(fnStr)(scope)
  }

  if (staticKey !== undefined) {
    const staticVal = metadata.get(staticKey)
    if (staticVal !== undefined) {
      if (opts?.staticAsBoolean) return true as T
      if (opts?.transform) return opts.transform(staticVal)
      return staticVal as T
    }
  }

  return undefined
}

/**
 * Form-level resolver. Same as resolveFieldProp but uses compileTopFn
 * (scope has `data` and `context`, no `v` or `entry`).
 *
 * @param type - ATScript annotated type for the form (root interface)
 * @param fnKey - Metadata key for the computed function string
 * @param staticKey - Metadata key for the static value, or `undefined` to skip
 * @param scope - Current form scope with data and context
 * @param opts - Optional resolve options
 * @returns The resolved value, or `undefined`
 */
export function resolveFormProp<T>(
  type: TAtscriptAnnotatedType,
  fnKey: string,
  staticKey: string | undefined,
  scope: TFoormFnScope,
  opts?: TResolveOptions<T>
): T | undefined {
  const metadata = type.metadata as unknown as TMetadataAccessor

  const fnStr = metadata.get(fnKey)
  if (typeof fnStr === 'string') {
    return compileTopFn<T>(fnStr)(scope)
  }

  if (staticKey !== undefined) {
    const staticVal = metadata.get(staticKey)
    if (staticVal !== undefined) {
      if (opts?.staticAsBoolean) return true as T
      if (opts?.transform) return opts.transform(staticVal)
      return staticVal as T
    }
  }

  return undefined
}

// ── Specialized resolvers ───────────────────────────────────

/**
 * Converts raw `@foorm.options` annotation value to a normalized array.
 *
 * @param raw - Raw metadata value (single item or array of `{ label, value? }` objects or strings)
 * @returns Normalized array of TFoormEntryOptions
 */
export function parseStaticOptions(raw: unknown): TFoormEntryOptions[] {
  const items = Array.isArray(raw) ? raw : [raw]
  return items.map(item => {
    if (typeof item === 'object' && item !== null && 'label' in item) {
      const { label, value } = item as { label: string; value?: string }
      return value !== undefined ? { key: value, label } : label
    }
    return String(item)
  })
}

/**
 * Resolves `foorm.fn.options` / `foorm.options` from metadata on demand.
 *
 * @param prop - ATScript annotated type for the field
 * @param scope - Current form scope
 * @returns Resolved options array, or `undefined` if no options metadata exists
 */
export function resolveOptions(
  prop: TAtscriptAnnotatedType,
  scope: TFoormFnScope
): TFoormEntryOptions[] | undefined {
  return resolveFieldProp<TFoormEntryOptions[]>(prop, 'foorm.fn.options', 'foorm.options', scope, {
    transform: parseStaticOptions,
  })
}

/**
 * Resolves `foorm.attr` + `foorm.fn.attr` from metadata on demand.
 * Static attrs are returned as-is, fn attrs are compiled and called with scope.
 *
 * @param prop - ATScript annotated type for the field
 * @param scope - Current form scope
 * @returns Merged attribute record, or `undefined` if no attr annotations exist
 */
export function resolveAttrs(
  prop: TAtscriptAnnotatedType,
  scope: TFoormFnScope
): Record<string, unknown> | undefined {
  const metadata = prop.metadata as unknown as TMetadataAccessor
  const staticAttrs = metadata.get('foorm.attr')
  const fnAttrs = metadata.get('foorm.fn.attr')

  if (!staticAttrs && !fnAttrs) return undefined

  const result: Record<string, unknown> = {}

  if (staticAttrs) {
    const items = Array.isArray(staticAttrs) ? staticAttrs : [staticAttrs]
    for (const item of items) {
      if (typeof item === 'object' && item !== null && 'name' in item && 'value' in item) {
        const { name, value } = item as { name: string; value: string }
        result[name] = value
      }
    }
  }

  if (fnAttrs) {
    const items = Array.isArray(fnAttrs) ? fnAttrs : [fnAttrs]
    for (const item of items) {
      if (typeof item === 'object' && item !== null && 'name' in item && 'fn' in item) {
        const { name, fn } = item as { name: string; fn: string }
        result[name] = compileFieldFn<unknown>(fn)(scope)
      }
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

// ── allStatic detection ─────────────────────────────────────

/**
 * Returns true if the prop has any `foorm.fn.*` or `foorm.validate` metadata —
 * meaning some properties are dynamic and Vue needs scope/computeds.
 *
 * @param prop - ATScript annotated type for the field
 * @returns `true` if dynamic annotations are present
 */
export function hasComputedAnnotations(prop: TAtscriptAnnotatedType): boolean {
  const metadata = prop.metadata as unknown as Map<string, unknown>
  if (metadata.get('foorm.validate' as never) !== undefined) return true
  for (const key of metadata.keys()) {
    if (String(key).startsWith('foorm.fn.')) return true
  }
  return false
}

// ── evalComputed (kept for TComputed<T> usage) ──────────────

/**
 * Resolves a TComputed value: if it is a function, calls it with
 * the scope. Otherwise returns the static value as-is.
 *
 * @param value - A static value or a function of TFoormFnScope
 * @param scope - Current form scope
 * @returns The resolved value
 */
export function evalComputed<T>(value: TComputed<T>, scope: TFoormFnScope): T
export function evalComputed<T>(
  value: TComputed<T> | undefined,
  scope: TFoormFnScope
): T | undefined
export function evalComputed<T>(
  value: TComputed<T> | undefined,
  scope: TFoormFnScope
): T | undefined {
  if (typeof value === 'function') {
    return (value as (scope: TFoormFnScope) => T)(scope)
  }
  return value
}

// ── Path utilities ──────────────────────────────────────────

/**
 * Gets a nested value by dot-separated path.
 *
 * @param obj - The root object to traverse
 * @param path - Dot-separated path (e.g., `'address.city'`)
 * @returns The value at the path, or `undefined` if any segment is missing
 */
export function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

/**
 * Sets a nested value by dot-separated path.
 * Creates intermediate objects if they do not exist.
 *
 * @param obj - The root object to mutate
 * @param path - Dot-separated path (e.g., `'address.city'`)
 * @param value - The value to set
 */
export function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  const last = keys.pop()
  if (last === undefined) return
  let current: Record<string, unknown> = obj
  for (const key of keys) {
    if (current[key] === null || current[key] === undefined || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  current[last] = value
}

// ── createFormData ──────────────────────────────────────────

const NON_DATA_TYPES = new Set(['action', 'paragraph'])

/**
 * Creates nested form data from an ATScript type with default values.
 * Skips phantom types and non-data fields (action, paragraph).
 * Resolves `@foorm.value` / `@foorm.fn.value` defaults from metadata.
 *
 * @param type - ATScript annotated object type describing the form
 * @param fields - The FoormFieldDef array produced by createFoormDef
 * @returns A data object matching the form schema with defaults applied
 */
export function createFormData<T = Record<string, unknown>>(
  type: TAtscriptAnnotatedType<TAtscriptTypeObject>,
  fields: FoormFieldDef[]
): T {
  const fieldsByPath = new Map<string, FoormFieldDef>()
  for (const f of fields) {
    if (f.path !== undefined) fieldsByPath.set(f.path, f)
  }
  return buildNestedData(type, fieldsByPath, '') as T
}

function buildNestedData(
  typeDef: TAtscriptAnnotatedType<TAtscriptTypeObject>,
  fieldsByPath: Map<string, FoormFieldDef>,
  prefix: string
): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  for (const [key, prop] of typeDef.type.props.entries()) {
    if (isPhantomType(prop)) continue

    const fullPath = prefix ? `${prefix}.${key}` : key

    if (prop.type.kind === 'object') {
      data[key] = buildNestedData(
        prop as TAtscriptAnnotatedType<TAtscriptTypeObject>,
        fieldsByPath,
        fullPath
      )
    } else if (prop.type.kind === 'array') {
      data[key] = []
    } else {
      const field = fieldsByPath.get(fullPath)

      if (field && NON_DATA_TYPES.has(field.type)) {
        continue
      }

      // Resolve default value from metadata on demand
      const scope: TFoormFnScope = {
        v: undefined,
        data: data as Record<string, unknown>,
        context: {},
        entry: field
          ? {
              field: field.path,
              type: field.type,
              component: getFieldMeta<string>(prop, 'foorm.component'),
              name: field.name,
            }
          : undefined,
      }
      const defaultValue = resolveFieldProp<unknown>(prop, 'foorm.fn.value', 'foorm.value', scope)

      if (defaultValue !== undefined) {
        data[key] = defaultValue
      } else {
        data[key] = getDefaultForDesignType(prop)
      }
    }
  }

  return data
}

function getDefaultForDesignType(prop: TAtscriptAnnotatedType): unknown {
  if (prop.type.kind !== '') return undefined
  switch (prop.type.designType) {
    case 'boolean':
      return false
    case 'string':
      return ''
    default:
      return undefined
  }
}

// ── Array helpers ───────────────────────────────────────────

/**
 * Creates default data for a new array item based on its variant.
 *
 * @param variant - The array variant to create data for
 * @returns Default value: nested object for object variants, primitive default for scalar variants
 */
export function createItemData(variant: FoormArrayVariant): unknown {
  if (variant.def) {
    return createFormData(
      variant.type as TAtscriptAnnotatedType<TAtscriptTypeObject>,
      variant.def.fields
    )
  }
  switch (variant.designType) {
    case 'string':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    default:
      return undefined
  }
}

/**
 * Detects which variant an existing array item value matches.
 *
 * @param value - The array item value to inspect
 * @param variants - Available variants for this array field
 * @returns Index of the matching variant (0-based), or 0 as fallback
 */
export function detectVariant(value: unknown, variants: FoormArrayVariant[]): number {
  if (variants.length <= 1) return 0

  // Quick matching by designType
  const isArray = Array.isArray(value)
  const vType = isArray ? 'array' : typeof value
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i]!
    if (v.designType && v.designType === vType) return i
  }

  // Object variant matching via validator
  if (value !== null && typeof value === 'object') {
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]!
      if (v.def) {
        try {
          if (v.type.validator().validate(value, true)) return i
        } catch {
          // Validator threw — skip this variant
        }
      }
    }
  }

  return 0
}
