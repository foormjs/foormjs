import type { TAtscriptAnnotatedType, InferDataType } from '@atscript/typescript/utils'
import { createFoormDef, createFormData } from '@foormjs/atscript'
import { reactive } from 'vue'

/**
 * Creates a reactive form definition and data object from an ATScript annotated type.
 *
 * @param type - An ATScript annotated type (imported from a `.as` file via `@atscript/typescript`).
 *   Accepts any type shape: interface/object, primitive, array, union, etc.
 *   For non-object types, the data is wrapped in `{ value: ... }`.
 * @returns `{ def, formData }` — the FoormDef and a Vue reactive data object with defaults applied
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useFoorm } from '@foormjs/vue'
 * import { MyForm } from './my-form.as'
 *
 * const { def, formData } = useFoorm(MyForm)
 * </script>
 *
 * <template>
 *   <OoForm :def="def" :data="formData" />
 * </template>
 * ```
 */
export function useFoorm<T extends TAtscriptAnnotatedType>(type: T) {
  const def = createFoormDef(type)
  const formData = reactive(
    createFormData<InferDataType<T['type']>>(type, def.fields, { skipOptional: true })
  )
  return { def, formData }
}
