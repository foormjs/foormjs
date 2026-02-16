import type {
  TAtscriptAnnotatedType,
  TAtscriptTypeObject,
  InferDataType,
} from '@atscript/typescript/utils'
import { createFoorm } from '@foormjs/atscript'
import { createFormData } from 'foorm'
import { reactive } from 'vue'

export function useFoorm<T extends TAtscriptAnnotatedType<TAtscriptTypeObject<any, any>>>(type: T) {
  const form = createFoorm(type)
  const formData = reactive(createFormData<InferDataType<T['type']>>(form.fields))
  return { form, formData }
}
