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
  FoormObjectFieldDef,
  FoormUnionFieldDef,
  FoormTupleFieldDef,
  FoormUnionVariant,
  TComputed,
  TFoormAltAction,
  TFoormEntryOptions,
  TFoormFieldEvaluated,
  TFoormFnScope,
} from './runtime/types'
export { isArrayField, isObjectField, isUnionField, isTupleField } from './runtime/types'

// Core
export { createFoormDef, buildUnionVariants } from './runtime/create-foorm'
export { getFormValidator, supportsAltAction, createFieldValidator } from './runtime/validate'
export type { TFormValidatorCallOptions, TFieldValidatorOptions } from './runtime/validate'

// Resolve utilities
export {
  resolveFieldProp,
  resolveFormProp,
  resolveOptions,
  resolveAttrs,
  getFieldMeta,
  hasComputedAnnotations,
  parseStaticOptions,
  optKey,
  optLabel,
} from './runtime/utils'
export type { TResolveOptions } from './runtime/utils'

// General utilities
export {
  getByPath,
  setByPath,
  createFormData,
  createDefaultValue,
  createItemData,
  detectUnionVariant,
} from './runtime/utils'

// fn-compiler
export { compileFieldFn, compileTopFn, compileValidatorFn } from './runtime/fn-compiler'

// Validator plugin
export { foormValidatorPlugin } from './runtime/validator-plugin'
export type { TFoormValidatorContext } from './runtime/validator-plugin'
