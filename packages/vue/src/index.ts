/**
 * @packageDocumentation
 * Renderless Vue components for ATScript-defined forms.
 *
 * Provides `OoForm`, `OoField`, and the `useFoorm` composable for building
 * validated, BYOUI forms driven by ATScript schemas.
 *
 * @see {@link https://atscript.moost.org | ATScript Documentation}
 */

export { default as OoField } from './components/oo-field.vue'
export { default as OoForm } from './components/oo-form.vue'
export type { TFoormComponentProps } from './components/types'
export { useFoorm } from './composables/use-foorm'
