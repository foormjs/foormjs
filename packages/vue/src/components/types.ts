import type { TFoormEntry } from 'foorm'

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
  class?: Record<string, boolean> | string
  style?: Record<string, string> | string
  optional?: boolean | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
  hidden?: boolean | undefined
  type: string
  altAction?: string
  name?: string
  field?: TFoormEntry
  options?: unknown[]
  length?: number
  autocomplete?: string
}
