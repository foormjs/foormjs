import type { TAtscriptAnnotatedType, TAtscriptTypeObject } from '@atscript/typescript/utils'
import type {
  TComputed,
  TFoormEntryOptions,
  TFoormField,
  TFoormFnScope,
  TFoormModel,
  TFoormSubmit,
} from 'foorm'

import { compileFieldFn, compileTopFn, compileValidatorFn } from './fn-compiler'

/** Loose metadata accessor for internal use (the global AtscriptMetadata may not be augmented at library build time). */
type TMetadataAccessor = { get(key: string): unknown }

/** Known foorm primitive extension tags that map directly to field types. */
const FOORM_TAGS = new Set(['action', 'paragraph', 'select', 'radio', 'checkbox'])

/** Converts a static @foorm.options annotation value to TFoormEntryOptions[]. */
function parseStaticOptions(raw: unknown): TFoormEntryOptions[] {
  const items = Array.isArray(raw) ? raw : [raw]
  return items.map(item => {
    // Multi-arg annotations are stored as { label, value? }
    if (typeof item === 'object' && item !== null && 'label' in item) {
      const { label, value } = item as { label: string; value?: string }
      return value !== undefined ? { key: value, label } : label
    }
    // Plain string fallback (single-arg or raw value)
    return String(item)
  })
}

/**
 * Generic property resolver for static and computed annotations.
 *
 * Handles all patterns: boolean constraints, strings with defaults, optional computed properties,
 * transformed values (like options), and custom compilers.
 *
 * @param fnKey - The @foorm.fn.* annotation key
 * @param staticKey - The static annotation key (undefined to skip static check)
 * @param metadata - Metadata accessor
 * @param options - Resolution options
 * @returns TComputed<T> (function or static value) or undefined
 *
 * @example
 * // Boolean constraint (presence = true)
 * resolveProperty('foorm.fn.disabled', 'foorm.disabled', pm, { staticAsBoolean: true, defaultValue: false })
 *
 * // String with default
 * resolveProperty('foorm.fn.label', 'meta.label', pm, { defaultValue: name })
 *
 * // Optional computed (no static)
 * resolveProperty('foorm.fn.classes', undefined, pm)
 *
 * // With transform
 * resolveProperty('foorm.fn.options', 'foorm.options', pm, { transform: parseStaticOptions })
 *
 * // Custom compiler
 * resolveProperty('foorm.fn.title', 'foorm.title', metadata, { compiler: compileTopFn, defaultValue: '' })
 */
// Overload: with defaultValue, never returns undefined
function resolveProperty<T>(
  fnKey: string,
  staticKey: string | undefined,
  metadata: TMetadataAccessor,
  options: {
    transform?: (raw: unknown) => T
    defaultValue: T
    staticAsBoolean?: boolean
    compiler?: (fnStr: string) => (scope: TFoormFnScope) => T
  }
): TComputed<T>
// Overload: without defaultValue, may return undefined
function resolveProperty<T>(
  fnKey: string,
  staticKey: string | undefined,
  metadata: TMetadataAccessor,
  options?: {
    transform?: (raw: unknown) => T
    staticAsBoolean?: boolean
    compiler?: (fnStr: string) => (scope: TFoormFnScope) => T
  }
): TComputed<T> | undefined
// Implementation
function resolveProperty<T>(
  fnKey: string,
  staticKey: string | undefined,
  metadata: TMetadataAccessor,
  options?: {
    transform?: (raw: unknown) => T
    defaultValue?: T
    staticAsBoolean?: boolean
    compiler?: (fnStr: string) => (scope: TFoormFnScope) => T
  }
): TComputed<T> | undefined {
  const {
    transform,
    defaultValue,
    staticAsBoolean = false,
    compiler = compileFieldFn,
  } = options ?? {}

  // Check for computed annotation first
  const fnStr = metadata.get(fnKey)
  if (typeof fnStr === 'string') {
    return compiler(fnStr)
  }

  // Check for static annotation
  if (staticKey !== undefined) {
    const staticVal = metadata.get(staticKey)
    if (staticVal !== undefined) {
      if (staticAsBoolean) {
        return true as T
      }
      if (transform) {
        return transform(staticVal)
      }
      return staticVal as T
    }
  }

  // Return default or undefined
  return defaultValue
}

/**
 * Parses @foorm.attr and @foorm.fn.attr annotations into a Record<string, TComputed<unknown>>.
 * Static attrs are direct key-value pairs, computed attrs are compiled functions.
 */
function parseAttrs(
  metadata: TMetadataAccessor
): Record<string, TComputed<unknown>> | undefined {
  const staticAttrs = metadata.get('foorm.attr')
  const fnAttrs = metadata.get('foorm.fn.attr')

  if (!staticAttrs && !fnAttrs) {
    return undefined
  }

  const result: Record<string, TComputed<unknown>> = {}

  // Process static @foorm.attr annotations
  if (staticAttrs) {
    const items = Array.isArray(staticAttrs) ? staticAttrs : [staticAttrs]
    for (const item of items) {
      if (typeof item === 'object' && item !== null && 'name' in item && 'value' in item) {
        const { name, value } = item as { name: string; value: string }
        result[name] = value
      }
    }
  }

  // Process computed @foorm.fn.attr annotations (override static if same name)
  if (fnAttrs) {
    const items = Array.isArray(fnAttrs) ? fnAttrs : [fnAttrs]
    for (const item of items) {
      if (typeof item === 'object' && item !== null && 'name' in item && 'fn' in item) {
        const { name, fn } = item as { name: string; fn: string }
        result[name] = compileFieldFn<unknown>(fn)
      }
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Converts an ATScript annotated type into a TFoormModel.
 *
 * Reads @foorm.*, @meta.*, and @expect.* annotations from the type's
 * metadata to build field definitions with static or computed properties.
 *
 * @example
 * ```ts
 * import { RegistrationForm } from './registration.as'
 * import { createFoorm } from '@foormjs/atscript'
 *
 * const model = createFoorm(RegistrationForm)
 * const data = createFormData(model.fields)
 * const validator = getFormValidator(model)
 * ```
 */
export function createFoorm(
  type: TAtscriptAnnotatedType<TAtscriptTypeObject<any, any>>
): TFoormModel {
  const metadata = type.metadata as unknown as TMetadataAccessor
  const props = type.type.props

  // Form-level metadata
  const title = resolveProperty<string>('foorm.fn.title', 'foorm.title', metadata, {
    compiler: compileTopFn,
    defaultValue: '',
  })

  const submitText = resolveProperty<string>('foorm.fn.submit.text', 'foorm.submit.text', metadata, {
    compiler: compileTopFn,
    defaultValue: 'Submit',
  })

  const submitDisabled = resolveProperty<boolean>(
    'foorm.fn.submit.disabled',
    'foorm.submit.disabled',
    metadata,
    {
      compiler: compileTopFn,
      defaultValue: false,
    }
  )

  const submit: TFoormSubmit = { text: submitText, disabled: submitDisabled }

  // Build fields from props
  const fields: TFoormField[] = []

  for (const [name, prop] of props.entries()) {
    const pm = prop.metadata as unknown as TMetadataAccessor
    const tags = prop.type?.tags

    // Determine field type from @foorm.type, foorm primitive tags, or default
    const foormType = pm.get('foorm.type') as string | undefined
    const foormTag = tags ? [...tags].find(t => FOORM_TAGS.has(t)) : undefined
    const fieldType = foormType ?? foormTag ?? 'text'

    // Build validators from @foorm.validate
    const validators: Array<(scope: TFoormFnScope) => boolean | string> = []
    const validateAnnotation = pm.get('foorm.validate')
    if (validateAnnotation) {
      const fns = Array.isArray(validateAnnotation) ? validateAnnotation : [validateAnnotation]
      for (const fnStr of fns) {
        if (typeof fnStr === 'string') {
          validators.push(compileValidatorFn(fnStr))
        }
      }
    }

    const field: TFoormField = {
      field: name,
      type: fieldType,
      component: pm.get('foorm.component') as string | undefined,
      autocomplete: pm.get('foorm.autocomplete') as string | undefined,
      altAction: pm.get('foorm.altAction') as string | undefined,
      order: pm.get('foorm.order') as number | undefined,
      name: name,

      label: resolveProperty<string>('foorm.fn.label', 'meta.label', pm, { defaultValue: name }),
      description: resolveProperty<string>('foorm.fn.description', 'meta.description', pm, {
        defaultValue: '',
      }),
      hint: resolveProperty<string>('foorm.fn.hint', 'meta.hint', pm, { defaultValue: '' }),
      placeholder: resolveProperty<string>('foorm.fn.placeholder', 'meta.placeholder', pm, {
        defaultValue: '',
      }),

      optional: resolveProperty<boolean>('foorm.fn.optional', undefined, pm, {
        defaultValue: prop.optional ?? false,
      }),
      disabled: resolveProperty<boolean>('foorm.fn.disabled', 'foorm.disabled', pm, {
        staticAsBoolean: true,
        defaultValue: false,
      }),
      hidden: resolveProperty<boolean>('foorm.fn.hidden', 'foorm.hidden', pm, {
        staticAsBoolean: true,
        defaultValue: false,
      }),
      readonly: resolveProperty<boolean>('foorm.fn.readonly', 'foorm.readonly', pm, {
        staticAsBoolean: true,
        defaultValue: false,
      }),

      classes: resolveProperty<string | Record<string, boolean>>('foorm.fn.classes', undefined, pm),
      styles: resolveProperty<string | Record<string, string>>('foorm.fn.styles', undefined, pm),

      options: resolveProperty<TFoormEntryOptions[]>('foorm.fn.options', 'foorm.options', pm, {
        transform: parseStaticOptions,
      }),
      value: resolveProperty<unknown>('foorm.fn.value', 'foorm.value', pm),

      validators,

      // Custom attributes/props
      attrs: parseAttrs(pm),

      // ATScript @expect constraints
      maxLength: pm.get('expect.maxLength') as number | undefined,
      minLength: pm.get('expect.minLength') as number | undefined,
      min: pm.get('expect.min') as number | undefined,
      max: pm.get('expect.max') as number | undefined,
    }

    fields.push(field)
  }

  // Sort by explicit order, preserving original order for unordered fields
  fields.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))

  return { title, submit, fields }
}
