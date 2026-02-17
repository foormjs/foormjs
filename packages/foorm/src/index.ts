/**
 * @packageDocumentation
 * Core form model for ATScript-defined validatable forms.
 *
 * Converts ATScript annotated types into form definitions with field metadata,
 * computed properties, and validation — all resolved on demand from ATScript annotations.
 *
 * @see {@link https://atscript.moost.org | ATScript Documentation}
 */

// Types
export type {
  FoormDef,
  FoormFieldDef,
  FoormArrayFieldDef,
  FoormGroupFieldDef,
  FoormArrayVariant,
  TComputed,
  TFoormEntryOptions,
  TFoormFieldEvaluated,
  TFoormFnScope,
} from './runtime/types'
export { isArrayField, isGroupField } from './runtime/types'

// Core
export { createFoormDef, buildVariants } from './runtime/create-foorm'
export { getFormValidator, supportsAltAction } from './runtime/validate'

// Resolve utilities
export {
  resolveFieldProp,
  resolveFormProp,
  resolveOptions,
  resolveAttrs,
  getFieldMeta,
  hasComputedAnnotations,
  parseStaticOptions,
} from './runtime/utils'
export type { TResolveOptions } from './runtime/utils'

// General utilities
export {
  evalComputed,
  getByPath,
  setByPath,
  createFormData,
  createItemData,
  detectVariant,
} from './runtime/utils'

// fn-compiler
export { compileFieldFn, compileTopFn, compileValidatorFn } from './runtime/fn-compiler'

// Validator plugin
export { foormValidatorPlugin } from './runtime/validator-plugin'
export type { TFoormPluginOptions, TFoormValidatorContext } from './runtime/validator-plugin'
