import type { FoormFieldDef, TFoormEntryOptions, FoormArrayFieldDef } from 'foorm'

/**
 * Props contract for custom field components used with `OoForm` / `OoField`.
 *
 * Implement this interface in your UI components so that `OoField` can pass
 * all resolved field state (value, label, validation errors, etc.) as props.
 *
 * @typeParam V - The field value type
 * @typeParam TFormData - The full form data object type
 * @typeParam TFormContext - The external context object type
 */
export interface TFoormComponentProps<V, TFormData, TFormContext> {
  /** Called on field blur — triggers validation. */
  onBlur: (event: FocusEvent) => void
  /** Validation error message for this field, if any. */
  error?: string
  /** Reactive model wrapping the field value. Bind with `v-model="model.value"`. */
  model: { value: V }
  /** The full reactive form data object. */
  formData: TFormData
  /** External context passed to the form (e.g., user session, feature flags). */
  formContext?: TFormContext
  /** Resolved field label from `@label` or `@foorm.fn.label`. */
  label?: string
  /** Resolved field description from `@description` or `@foorm.fn.description`. */
  description?: string
  /** Resolved hint text from `@foorm.hint` or `@foorm.fn.hint`. */
  hint?: string
  /** Resolved placeholder from `@foorm.placeholder` or `@foorm.fn.placeholder`. */
  placeholder?: string
  /** CSS class(es) from `@foorm.class` or `@foorm.fn.class`. */
  class?: Record<string, boolean> | string
  /** Inline styles from `@foorm.style` or `@foorm.fn.style`. */
  style?: Record<string, string> | string
  /** Whether the field is optional (not required). */
  optional?: boolean | undefined
  /** Whether the field is required (inverse of optional). */
  required?: boolean | undefined
  /** Whether the field is disabled. */
  disabled?: boolean | undefined
  /** Whether the field is hidden. */
  hidden?: boolean | undefined
  /** Whether the field is read-only. */
  readonly?: boolean | undefined
  /** The resolved field input type (e.g., `'text'`, `'select'`, `'checkbox'`). */
  type: string
  /** Alternate action name from `@foorm.altAction`. */
  altAction?: string
  /** The field name (last segment of the dot-separated path). */
  name?: string
  /** The full FoormFieldDef for advanced use cases. */
  field?: FoormFieldDef
  /** Resolved options for select/radio/checkbox fields. */
  options?: TFoormEntryOptions[]
  /** Max length constraint from `@expect.maxLength`. */
  maxLength?: number
  /** Autocomplete hint from `@foorm.autocomplete`. */
  autocomplete?: string
}

/**
 * Props contract for custom group/array components used via `@foorm.component` on
 * object or array-typed fields.
 *
 * @typeParam TFormData - The full form data object type
 * @typeParam TFormContext - The external context object type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TFoormGroupComponentProps<TFormData = any, TFormContext = any> {
  /** The field definition (FoormArrayFieldDef for arrays, FoormGroupFieldDef for objects). */
  field: FoormFieldDef | FoormArrayFieldDef
  /** Reactive model wrapping the group/array value. */
  model: { value: unknown }
  /** The full reactive form data object. */
  formData: TFormData
  /** External context passed to the form. */
  formContext?: TFormContext
  /** Whether the field is disabled. */
  disabled?: boolean
  /** Whether the field is hidden. */
  hidden?: boolean
  /** Resolved title/label for the group. */
  label?: string
  /** External error overrides (path → message). */
  errors?: Record<string, string | undefined>
}
