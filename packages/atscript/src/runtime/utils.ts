import type {
  TFoormFnScope,
  TFoormEntryOptions,
  TFoormFieldEvaluated,
  FoormUnionVariant,
} from './types'
import type { TAtscriptAnnotatedType, TAtscriptDataType } from '@atscript/typescript/utils'
import { createDataFromAnnotatedType } from '@atscript/typescript/utils'
import { compileFieldFn, compileTopFn } from './fn-compiler'

// ── Array coercion ───────────────────────────────────────────

/** Ensures a value is an array — returns as-is if already one, wraps in `[x]` otherwise. */
export function asArray<T>(x: T | T[]): T[] {
  return Array.isArray(x) ? x : [x]
}

// ── Metadata access ─────────────────────────────────────────

/**
 * Reads a static metadata value from an ATScript prop.
 *
 * For keys declared in the global `AtscriptMetadata` interface (generated `atscript.d.ts`),
 * the return type is inferred automatically. Unknown keys fall back to `unknown`.
 *
 * @param prop - ATScript annotated type for the field
 * @param key - Metadata key to read (e.g., `'foorm.autocomplete'`)
 * @returns The typed metadata value, or `undefined` if not present
 */
export function getFieldMeta<K extends keyof AtscriptMetadata>(
  prop: TAtscriptAnnotatedType,
  key: K
): AtscriptMetadata[K] | undefined
export function getFieldMeta(prop: TAtscriptAnnotatedType, key: string): unknown
export function getFieldMeta(prop: TAtscriptAnnotatedType, key: string): unknown {
  return prop.metadata.get(key as keyof AtscriptMetadata)
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
  metadata: TAtscriptAnnotatedType['metadata'],
  fnKey: string,
  staticKey: string | undefined,
  scope: TFoormFnScope,
  compileFn: TCompileFn<T>,
  opts?: TResolveOptions<T>
): T | undefined {
  const fnStr = metadata.get(fnKey as keyof AtscriptMetadata)
  if (typeof fnStr === 'string') {
    return compileFn(fnStr)(scope)
  }

  if (staticKey !== undefined) {
    const staticVal = metadata.get(staticKey as keyof AtscriptMetadata)
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
    prop.metadata,
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
    type.metadata,
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
  const staticAttrs = prop.metadata.get('foorm.attr')
  const fnAttrs = prop.metadata.get('foorm.fn.attr')

  if (!staticAttrs && !fnAttrs) return undefined

  const result: Record<string, unknown> = {}
  let hasAttrs = false

  if (staticAttrs) {
    for (const item of asArray(staticAttrs)) {
      if (typeof item === 'object' && item !== null && 'name' in item && 'value' in item) {
        const { name, value } = item as { name: string; value: string }
        result[name] = value
        hasAttrs = true
      }
    }
  }

  if (fnAttrs) {
    for (const item of asArray(fnAttrs)) {
      if (typeof item === 'object' && item !== null && 'name' in item && 'fn' in item) {
        const { name, fn } = item as { name: string; fn: string }
        result[name] = compileFieldFn<unknown>(fn)(scope)
        hasAttrs = true
      }
    }
  }

  return hasAttrs ? result : undefined
}

// ── Entry builder (dual-scope pattern) ──────────────────────

/** Options for buildFieldEntry — allows pre-resolved overrides. */
export interface TBuildFieldEntryOpts {
  /** Field name — if not provided, extracted from path */
  name?: string
  /** Field type — if not provided, reads from @foorm.type metadata (default 'text') */
  type?: string
  /** Component name — if not provided, reads from @foorm.component metadata */
  component?: string
  /** Pre-resolved constraint overrides — skip metadata resolution */
  optional?: boolean
  disabled?: boolean
  hidden?: boolean
  readonly?: boolean
}

/**
 * Builds a `TFoormFieldEvaluated` entry and returns a full scope containing it.
 *
 * Implements the dual-scope pattern used by both the validator plugin and OoField:
 * 1. Resolve constraints (disabled/hidden/readonly) from `baseScope`
 * 2. Assemble the entry object
 * 3. Build full scope (`{ ...baseScope, entry }`)
 * 4. Resolve options into the entry using the full scope
 *
 * When overrides are provided in `opts`, those values are used directly
 * instead of resolving from metadata (useful when constraints are already
 * resolved reactively, e.g. in Vue components).
 *
 * @param prop - ATScript annotated type for the field
 * @param baseScope - Scope without entry (v, data, context)
 * @param path - Field path (e.g. 'address.city')
 * @param opts - Optional overrides for field info and pre-resolved constraints
 * @returns Full scope with the assembled entry
 */
export function buildFieldEntry(
  prop: TAtscriptAnnotatedType,
  baseScope: TFoormFnScope,
  path: string,
  opts?: TBuildFieldEntryOpts
): TFoormFnScope {
  const boolOpts = { staticAsBoolean: true } as const

  const entry: TFoormFieldEvaluated = {
    field: path,
    type: opts?.type ?? getFieldMeta(prop, 'foorm.type') ?? 'text',
    component: opts?.component ?? getFieldMeta(prop, 'foorm.component'),
    name: opts?.name ?? path.slice(path.lastIndexOf('.') + 1),
    optional: opts?.optional ?? prop.optional,
    disabled:
      opts?.disabled ??
      resolveFieldProp<boolean>(prop, 'foorm.fn.disabled', 'foorm.disabled', baseScope, boolOpts),
    hidden:
      opts?.hidden ??
      resolveFieldProp<boolean>(prop, 'foorm.fn.hidden', 'foorm.hidden', baseScope, boolOpts),
    readonly:
      opts?.readonly ??
      resolveFieldProp<boolean>(prop, 'foorm.fn.readonly', 'foorm.readonly', baseScope, boolOpts),
  }

  const scope: TFoormFnScope = { ...baseScope, entry }
  entry.options = resolveOptions(prop, scope)
  return scope
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
  if (prop.metadata.get('foorm.validate') !== undefined) return true
  for (const key of prop.metadata.keys()) {
    if ((key as string).startsWith('foorm.fn.')) return true
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

/**
 * Coerces a static annotation string to the field's expected type.
 * Strings are returned as-is for string fields; everything else goes through `JSON.parse`.
 * Returns `undefined` on parse failure (falls through to structural default).
 */
function parseStaticDefault(raw: unknown, prop: TAtscriptAnnotatedType): unknown {
  if (typeof raw !== 'string') return raw
  if (prop.type.kind === '' && prop.type.designType === 'string') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

/** Value resolver function type — created once per form, reused across calls. */
export type TFoormValueResolver = (prop: TAtscriptAnnotatedType, path: string) => unknown

/** Cached default resolver (no data, no context) — reused when no resolver is provided. */
const defaultResolver: TFoormValueResolver = createFoormValueResolver()

/**
 * Creates a reusable value resolver for form data creation.
 * Cascade: `foorm.fn.value` → `foorm.value` → `meta.default` → structural default.
 *
 * Create once per form with the form's data and context, then pass to `createFormData`.
 *
 * @param data - Form data object passed to `foorm.fn.value` functions
 * @param context - Context object passed to `foorm.fn.value` functions
 */
export function createFoormValueResolver(
  data: Record<string, unknown> = {},
  context: Record<string, unknown> = {}
): TFoormValueResolver {
  return (prop, _path) => {
    // 1. foorm.fn.value — compiled function (may throw if it references unavailable scope)
    const fnStr = prop.metadata.get('foorm.fn.value' as keyof AtscriptMetadata)
    if (typeof fnStr === 'string') {
      try {
        return compileFieldFn<unknown>(fnStr)({ v: undefined, data, context })
      } catch {
        // Fall through — fn depends on runtime scope not available at data creation time
      }
    }
    // 2. foorm.value — static
    const staticVal = prop.metadata.get('foorm.value' as keyof AtscriptMetadata)
    if (staticVal !== undefined) {
      return parseStaticDefault(staticVal, prop)
    }
    // 3. meta.default — ATScript standard
    const metaDefault = prop.metadata.get('meta.default' as keyof AtscriptMetadata)
    if (metaDefault !== undefined) {
      return parseStaticDefault(metaDefault, prop)
    }
    // 4. Fall through → createDataFromAnnotatedType applies structural default
    return undefined
  }
}

/**
 * Creates form data from an ATScript type with default values.
 *
 * Uses `createDataFromAnnotatedType` with a custom resolver that checks
 * `foorm.fn.value` → `foorm.value` → `meta.default` before falling through
 * to structural defaults. Phantom types (action, paragraph) are skipped automatically.
 *
 * Optional properties are only included if the resolver provides a value for them.
 *
 * @param type - ATScript annotated type describing the form
 * @param resolver - Value resolver (from `createFoormValueResolver`). If omitted, a cached default resolver is used.
 * @returns A data object matching the form schema with defaults applied
 */
export function createFormData<T extends TAtscriptAnnotatedType>(
  type: T,
  resolver?: TFoormValueResolver
): { value: TAtscriptDataType<T> } {
  return {
    value: createDataFromAnnotatedType(type, {
      mode: resolver ?? defaultResolver,
    }) as TAtscriptDataType<T>,
  }
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
