import type {
  FoormArrayVariant,
  FoormFieldDef,
  TFoormAltAction,
  TFoormEntryOptions,
} from '@foormjs/atscript'

/**
 * Shared base props available to all custom foorm components.
 */
export interface TFoormBaseComponentProps {
  /** Whether this component is disabled. */
  disabled?: boolean
  /** Whether this component is hidden. */
  hidden?: boolean
}

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
export interface TFoormComponentProps<V, TFormData, TFormContext> extends TFoormBaseComponentProps {
  /** Called on field blur — triggers validation. */
  onBlur: (event: FocusEvent) => void
  /** Validation error message for this field, if any. */
  error?: string
  /** Reactive model wrapping the field value. Bind with `v-model="model.value"`. */
  model: { value: V }
  /** Phantom field display value from `@foorm.value` / `@foorm.fn.value` (paragraphs, actions). `undefined` for data fields. */
  value?: unknown
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
  /** Whether the field is read-only. */
  readonly?: boolean | undefined
  /** The resolved field input type (e.g., `'text'`, `'select'`, `'checkbox'`). */
  type: string
  /** Alternate action from `@foorm.altAction`. Contains the action id and display label. */
  altAction?: TFoormAltAction
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
  /** Callback to remove this item from its parent array. Present when rendered inside an array. */
  onRemove?: () => void
  /** Whether removal is allowed (respects minLength constraints). */
  canRemove?: boolean
  /** Label for the remove button (from `@foorm.array.remove.label`). */
  removeLabel?: string
}

/**
 * Props contract for custom array "add" button components.
 *
 * Used with `@foorm.array.add.component` annotation.
 * The component receives variant info and emits `add(variantIndex)` to append an item.
 */
export interface TFoormAddComponentProps extends TFoormBaseComponentProps {
  /** Available variants — single-element for homogeneous arrays, multiple for unions. */
  variants: FoormArrayVariant[]
}

/**
 * Props contract for custom array variant selector components.
 *
 * Used with `@foorm.array.variant.component` annotation.
 * Rendered per-item in union arrays to let users switch between variant types.
 */
export interface TFoormVariantComponentProps extends TFoormBaseComponentProps {
  /** Available variants for this union array. */
  variants: FoormArrayVariant[]
  /** Index of the currently active variant. */
  modelValue: number
}

/**
 * Props contract for custom group wrapper components.
 *
 * Passed via the `group-component` prop on `OoForm`. Wraps around group/array-item
 * content, replacing the default `div.oo-group` markup. Fields are rendered in the
 * default slot.
 */
export interface TFoormGroupComponentProps extends TFoormBaseComponentProps {
  /** Resolved group title (from `@foorm.title` / `@meta.label`). */
  title?: string
  /** Group-level validation error message. */
  error?: string
  /** Callback to remove this group from its parent array. Present only for array items. */
  onRemove?: () => void
  /** Whether removal is allowed (respects minLength constraints). */
  canRemove?: boolean
  /** Label for the remove button (from `@foorm.array.remove.label`). */
  removeLabel?: string
}
