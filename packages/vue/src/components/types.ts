import type { TFoormEntryOptions, TFoormField } from 'foorm'

/* eslint-disable @typescript-eslint/ban-types */
export interface TFoormComponentProps<V, TFormData, TFormContext> {
  onBlur: Function
  error?: string
  model: { value: V }
  formData: TFormData
  formContext?: TFormContext
  label?: string
  description?: string
  hint?: string
  placeholder?: string
  class?: Record<string, boolean> | string
  style?: Record<string, string> | string
  optional?: boolean | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
  hidden?: boolean | undefined
  type: string
  altAction?: string
  name?: string
  field?: TFoormField
  options?: TFoormEntryOptions[]
  maxLength?: number
  autocomplete?: string
}
