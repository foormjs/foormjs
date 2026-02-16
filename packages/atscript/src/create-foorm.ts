import type { TAtscriptAnnotatedType, TAtscriptTypeObject } from '@atscript/typescript/utils'
import type { TComputed, TFoormEntryOptions, TFoormField, TFoormFnScope, TFoormModel, TFoormSubmit } from 'foorm'

import { compileFieldFn, compileTopFn, compileValidatorFn } from './fn-compiler'

/** Loose metadata accessor for internal use (the global AtscriptMetadata may not be augmented at library build time). */
type TMetadataAccessor = { get(key: string): unknown }

/** Known foorm primitive extension tags that map directly to field types. */
const FOORM_TAGS = new Set(['action', 'paragraph', 'select', 'radio', 'checkbox'])

/** Converts a static @foorm.options annotation value to TFoormEntryOptions[]. */
function parseStaticOptions(raw: unknown): TFoormEntryOptions[] {
  const items = Array.isArray(raw) ? raw : [raw]
  return items.map((item) => {
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
 * Resolves a static annotation or a @foorm.fn.* computed annotation.
 * If the fn annotation exists, compiles it. Otherwise falls back to the
 * static annotation or the default value.
 */
function resolveComputed<T>(
  staticKey: string,
  fnKey: string,
  metadata: TMetadataAccessor,
  compileFn: (fnStr: string) => (scope: TFoormFnScope) => T,
  defaultValue: T
): TComputed<T> {
  const fnStr = metadata.get(fnKey)
  if (typeof fnStr === 'string') {
    return compileFn(fnStr)
  }
  const staticVal = metadata.get(staticKey)
  if (staticVal !== undefined) {
    return staticVal as T
  }
  return defaultValue
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
export function createFoorm(type: TAtscriptAnnotatedType<TAtscriptTypeObject<any, any>>): TFoormModel {
  const metadata = type.metadata as unknown as TMetadataAccessor
  const props = type.type.props

  // Form-level metadata
  const title = resolveComputed<string>(
    'foorm.title',
    'foorm.fn.title',
    metadata,
    compileTopFn,
    ''
  )

  const submitText = resolveComputed<string>(
    'foorm.submit.text',
    'foorm.fn.submit.text',
    metadata,
    compileTopFn,
    'Submit'
  )

  const submitDisabled: TComputed<boolean> = (() => {
    const fnStr = metadata.get('foorm.fn.submit.disabled')
    if (typeof fnStr === 'string') {
      return compileTopFn<boolean>(fnStr)
    }
    return false
  })()

  const submit: TFoormSubmit = { text: submitText, disabled: submitDisabled }

  // Build fields from props
  const fields: TFoormField[] = []

  for (const [name, prop] of props.entries()) {
    const pm = prop.metadata as unknown as TMetadataAccessor
    const tags = prop.type?.tags

    // Determine field type from @foorm.type, foorm primitive tags, or default
    const foormType = pm.get('foorm.type') as string | undefined
    const foormTag = tags ? [...tags].find((t) => FOORM_TAGS.has(t)) : undefined
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

      label: resolveComputed<string>('meta.label', 'foorm.fn.label', pm, compileFieldFn, name),
      description: resolveComputed<string>(
        'meta.description',
        'foorm.fn.description',
        pm,
        compileFieldFn,
        ''
      ),
      hint: resolveComputed<string>('meta.hint', 'foorm.fn.hint', pm, compileFieldFn, ''),
      placeholder: resolveComputed<string>(
        'meta.placeholder',
        'foorm.fn.placeholder',
        pm,
        compileFieldFn,
        ''
      ),

      optional: (() => {
        const fnStr = pm.get('foorm.fn.optional')
        if (typeof fnStr === 'string') {
          return compileFieldFn<boolean>(fnStr)
        }
        return prop.optional ?? false
      })(),

      disabled: (() => {
        const fnStr = pm.get('foorm.fn.disabled')
        if (typeof fnStr === 'string') {
          return compileFieldFn<boolean>(fnStr)
        }
        return pm.get('foorm.disabled') !== undefined
      })(),

      hidden: (() => {
        const fnStr = pm.get('foorm.fn.hidden')
        if (typeof fnStr === 'string') {
          return compileFieldFn<boolean>(fnStr)
        }
        return pm.get('foorm.hidden') !== undefined
      })(),

      classes: (() => {
        const fnStr = pm.get('foorm.fn.classes')
        if (typeof fnStr === 'string') {
          return compileFieldFn<string | Record<string, boolean>>(fnStr)
        }
        return undefined
      })(),

      styles: (() => {
        const fnStr = pm.get('foorm.fn.styles')
        if (typeof fnStr === 'string') {
          return compileFieldFn<string | Record<string, string>>(fnStr)
        }
        return undefined
      })(),

      options: (() => {
        const fnStr = pm.get('foorm.fn.options')
        if (typeof fnStr === 'string') {
          return compileFieldFn<TFoormEntryOptions[]>(fnStr)
        }
        const staticOpts = pm.get('foorm.options')
        if (staticOpts) {
          return parseStaticOptions(staticOpts)
        }
        return undefined
      })(),

      value: pm.get('foorm.value'),

      validators,

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
