import type { TFoormFnScope, TFoormEntryOptions, FoormFieldDef, FoormUnionVariant } from './types'
import type {
  TAtscriptAnnotatedType,
  TAtscriptTypeComplex,
  TAtscriptTypeObject,
} from '@atscript/typescript/utils'
import { isPhantomType } from '@atscript/typescript/utils'
import { compileFieldFn, compileTopFn } from './fn-compiler'

// ── Array coercion ───────────────────────────────────────────

/** Ensures a value is an array — returns as-is if already one, wraps in `[x]` otherwise. */
export function asArray<T>(x: T | T[]): T[] {
  return Array.isArray(x) ? x : [x]
}

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

/** Compile function signature used by resolveAnnotatedProp. */
type TCompileFn<T> = (fnStr: string) => (scope: TFoormFnScope) => T

/**
 * Shared resolver for both field-level and form-level metadata.
 * 1. Check fnKey — if found, compile with `compileFn` and call with scope
 * 2. Check staticKey — if found, return static value (optionally transformed)
 * 3. Return undefined
 *
 * FNPool caching makes repeated calls for the same fn string essentially free.
 *
 * @param metadata - Metadata accessor from an ATScript annotated type
 * @param fnKey - Metadata key for the computed function string (e.g., `'foorm.fn.label'`)
 * @param staticKey - Metadata key for the static value (e.g., `'meta.label'`), or `undefined` to skip
 * @param scope - Current form scope
 * @param compileFn - Function compiler (`compileFieldFn` or `compileTopFn`)
 * @param opts - Optional resolve options (staticAsBoolean, transform)
 * @returns The resolved value, or `undefined` if neither fn nor static metadata exists
 */
function resolveAnnotatedProp<T>(
  metadata: TMetadataAccessor,
  fnKey: string,
  staticKey: string | undefined,
  scope: TFoormFnScope,
  compileFn: TCompileFn<T>,
  opts?: TResolveOptions<T>
): T | undefined {
  const fnStr = metadata.get(fnKey)
  if (typeof fnStr === 'string') {
    return compileFn(fnStr)(scope)
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
 * Core field-level resolver. Reads metadata on demand using `compileFieldFn`.
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
  return resolveAnnotatedProp(
    prop.metadata as unknown as TMetadataAccessor,
    fnKey,
    staticKey,
    scope,
    compileFieldFn as TCompileFn<T>,
    opts
  )
}

/**
 * Form-level resolver. Same logic as resolveFieldProp but uses `compileTopFn`
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
  return resolveAnnotatedProp(
    type.metadata as unknown as TMetadataAccessor,
    fnKey,
    staticKey,
    scope,
    compileTopFn as TCompileFn<T>,
    opts
  )
}

// ── Option helpers ───────────────────────────────────────────

/**
 * Extracts the key from an option entry.
 * For string options the value itself is the key; for objects it's `opt.key`.
 */
export function optKey(opt: TFoormEntryOptions): string {
  return typeof opt === 'string' ? opt : opt.key
}

/**
 * Extracts the display label from an option entry.
 * For string options the value itself is the label; for objects it's `opt.label`.
 */
export function optLabel(opt: TFoormEntryOptions): string {
  return typeof opt === 'string' ? opt : opt.label
}

// ── Specialized resolvers ───────────────────────────────────

/**
 * Converts raw `@foorm.options` annotation value to a normalized array.
 *
 * @param raw - Raw metadata value (single item or array of `{ label, value? }` objects or strings)
 * @returns Normalized array of TFoormEntryOptions
 */
export function parseStaticOptions(raw: unknown): TFoormEntryOptions[] {
  const items = asArray(raw)
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
    for (const item of asArray(staticAttrs)) {
      if (typeof item === 'object' && item !== null && 'name' in item && 'value' in item) {
        const { name, value } = item as { name: string; value: string }
        result[name] = value
      }
    }
  }

  if (fnAttrs) {
    for (const item of asArray(fnAttrs)) {
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

// ── Path utilities ──────────────────────────────────────────

/**
 * Gets a nested value by dot-separated path.
 * Always dereferences `obj.value` first (form data is wrapped in `{ value: domainData }`).
 * When `path` is empty, returns the root domain data (`obj.value`).
 *
 * @param obj - The root form data wrapper (must have a `value` property)
 * @param path - Dot-separated path (e.g., `'address.city'`), or `''` for root value
 * @returns The value at the path, or `undefined` if any segment is missing
 */
export function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const root = obj.value
  if (!path) return root
  const keys = path.split('.')
  let current: unknown = root
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

/**
 * Sets a nested value by dot-separated path.
 * Always dereferences `obj.value` first (form data is wrapped in `{ value: domainData }`).
 * When `path` is empty, sets the root domain data (`obj.value = value`).
 * Creates intermediate objects if they do not exist.
 *
 * @param obj - The root form data wrapper (must have a `value` property)
 * @param path - Dot-separated path (e.g., `'address.city'`), or `''` for root value
 * @param value - The value to set
 */
export function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  if (!path) {
    obj.value = value
    return
  }
  const keys = path.split('.')
  const last = keys.pop()
  if (last === undefined) return
  let current: Record<string, unknown> = obj.value as Record<string, unknown>
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
 * Creates form data from an ATScript type with default values.
 *
 * For object types: builds nested data from properties.
 * For non-object types (primitive, array, etc.): wraps in `{ value: defaultValue }`.
 *
 * Skips phantom types and non-data fields (action, paragraph).
 * Resolves `@foorm.value` / `@foorm.fn.value` defaults from metadata.
 *
 * @param type - ATScript annotated type describing the form
 * @param fields - The FoormFieldDef array produced by createFoormDef
 * @returns A data object matching the form schema with defaults applied
 */
export function createFormData<T = Record<string, unknown>>(
  type: TAtscriptAnnotatedType,
  fields: FoormFieldDef[],
  opts?: { skipOptional?: boolean }
): T {
  if (type.type.kind !== 'object') {
    return { value: createDefaultValue(type) } as T
  }
  const fieldsByPath = new Map<string, FoormFieldDef>()
  for (const f of fields) {
    if (f.path !== undefined) fieldsByPath.set(f.path, f)
  }
  return {
    value: buildNestedData(
      type as TAtscriptAnnotatedType<TAtscriptTypeObject>,
      fieldsByPath,
      '',
      opts?.skipOptional ?? false
    ),
  } as T
}

/**
 * Coerces a static `@foorm.value` annotation string to the field's expected type.
 * Strings are returned as-is; other types go through `JSON.parse` with a fallback
 * to the type's default value on parse failure.
 */
function parseStaticDefault(raw: unknown, prop: TAtscriptAnnotatedType): unknown {
  if (typeof raw !== 'string') return raw
  if (prop.type.kind === '' && prop.type.designType === 'string') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return getDefaultForDesignType(prop)
  }
}

function buildNestedData(
  typeDef: TAtscriptAnnotatedType<TAtscriptTypeObject>,
  fieldsByPath: Map<string, FoormFieldDef>,
  prefix: string,
  skipOptional: boolean
): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  for (const [key, prop] of typeDef.type.props.entries()) {
    if (isPhantomType(prop)) continue

    const fullPath = prefix ? `${prefix}.${key}` : key

    if (prop.type.kind === 'object') {
      data[key] = prop.optional
        ? undefined
        : buildNestedData(
            prop as TAtscriptAnnotatedType<TAtscriptTypeObject>,
            fieldsByPath,
            fullPath,
            skipOptional
          )
      continue
    }

    if (prop.type.kind === 'array') {
      data[key] = prop.optional ? undefined : []
      continue
    }

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
    const defaultValue = resolveFieldProp<unknown>(prop, 'foorm.fn.value', 'foorm.value', scope, {
      transform: (raw) => parseStaticDefault(raw, prop),
    })

    if (defaultValue !== undefined) {
      data[key] = defaultValue
    } else if (!skipOptional || !prop.optional) {
      data[key] = getDefaultForDesignType(prop)
    }
  }

  return data
}

function getDefaultForDesignType(prop: TAtscriptAnnotatedType): unknown {
  // Union: use the first branch's default
  if (prop.type.kind === 'union') {
    const items = (prop.type as TAtscriptTypeComplex).items
    return items[0] ? createDefaultValue(items[0]) : undefined
  }
  // Tuple: array of defaults for each position
  if (prop.type.kind === 'tuple') {
    const items = (prop.type as TAtscriptTypeComplex).items
    return items.map(item => createDefaultValue(item))
  }
  if (prop.type.kind !== '') return undefined
  // Literal types (e.g., type: 'address'): use the literal value directly
  if (prop.type.value !== undefined) return prop.type.value
  switch (prop.type.designType) {
    case 'boolean':
      return false
    case 'string':
      return ''
    case 'number':
      return 0
    default:
      return undefined
  }
}

/** Returns a default value for any type kind. */
export function createDefaultValue(type: TAtscriptAnnotatedType): unknown {
  if (type.type.kind === 'array') return []
  if (type.type.kind === 'object') {
    const objType = type.type as TAtscriptTypeObject
    const data: Record<string, unknown> = {}
    for (const [key, prop] of objType.props.entries()) {
      if (isPhantomType(prop)) continue
      data[key] = createDefaultValue(prop)
    }
    return data
  }
  if (type.type.kind === 'tuple') {
    const items = (type.type as TAtscriptTypeComplex).items
    return items.map(item => createDefaultValue(item))
  }
  return getDefaultForDesignType(type)
}

// ── Union helpers ────────────────────────────────────────────

/**
 * Creates default data for a union branch.
 *
 * @param variant - The union variant to create data for
 * @returns Default value: nested object for object variants, primitive default for scalar variants
 */
export function createItemData(variant: FoormUnionVariant): unknown {
  if (variant.def) {
    // createFormData wraps in { value: ... } — unwrap for array items (they're raw domain data)
    return (
      createFormData(
        variant.type as TAtscriptAnnotatedType<TAtscriptTypeObject>,
        variant.def.fields
      ) as Record<string, unknown>
    ).value
  }
  // Primitives and complex types (tuple, array, etc.)
  return createDefaultValue(variant.type)
}

// Lazily-cached validators keyed by variant type identity.
const variantValidatorCache = new WeakMap<
  TAtscriptAnnotatedType,
  ReturnType<TAtscriptAnnotatedType['validator']>
>()

function getVariantValidator(variant: FoormUnionVariant) {
  let v = variantValidatorCache.get(variant.type)
  if (!v) {
    v = variant.type.validator()
    variantValidatorCache.set(variant.type, v)
  }
  return v
}

/**
 * Detects which union variant an existing value matches.
 *
 * @param value - The value to inspect
 * @param variants - Available union variants
 * @returns Index of the matching variant (0-based), or 0 as fallback
 */
export function detectUnionVariant(value: unknown, variants: FoormUnionVariant[]): number {
  if (variants.length <= 1) return 0

  for (let i = 0; i < variants.length; i++) {
    try {
      if (getVariantValidator(variants[i]!).validate(value, true)) return i
    } catch {
      // Validator threw — skip this variant
    }
  }

  return 0
}
