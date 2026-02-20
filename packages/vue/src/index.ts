/**
 * @packageDocumentation
 * Renderless Vue components for ATScript-defined forms.
 *
 * Provides `OoForm`, `OoField`, and the `useFoorm` composable for building
 * validated, BYOUI forms driven by ATScript schemas.
 *
 * @see {@link https://atscript.moost.org | ATScript Documentation}
 */

// Public components
export { default as OoForm } from './components/oo-form.vue'
export { default as OoField } from './components/oo-field.vue'
export { default as OoIterator } from './components/oo-iterator.vue'

// Default type components
export {
  OoFieldShell,
  OoInput,
  OoSelect,
  OoRadio,
  OoCheckbox,
  OoParagraph,
  OoAction,
  OoVariantPicker,
  OoStructuredHeader,
  OoObject,
  OoArray,
  OoUnion,
  OoTuple,
} from './components/default'

// Types
export type {
  TFoormBaseComponentProps,
  TFoormComponentProps,
  TFoormUnionContext,
  TFoormChangeType,
} from './components/types'

// Composables
export { useFoorm } from './composables/use-foorm'
export { useFoormArray } from './composables/use-foorm-array'
export { useFoormUnion } from './composables/use-foorm-union'
export { useConsumeUnionContext, formatIndexedLabel } from './composables/use-foorm-context'
