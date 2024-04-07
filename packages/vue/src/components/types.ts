/* eslint-disable @typescript-eslint/ban-types */
export interface TFoormComponentProps<T, TFormData, TFormContext> {
  onBlur: Function
  error?: string
  model: { value: T }
  formData: TFormData
  formContext?: TFormContext
  label?: string
  description?: string
  hint?: string
  placeholder?: string
  class?: Record<string, boolean>
  style?: Record<string, string>
  optional: boolean
  required: boolean
  disabled?: boolean
  hidden?: boolean
  type: string
  altAction?: string
  name?: string
  field?: string
  options?: unknown[]
  length?: number
  autocomplete?: string
}
