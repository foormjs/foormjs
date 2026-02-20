import type {
  FoormFieldDef,
  FoormUnionVariant,
  TFoormAltAction,
  TFoormEntryOptions,
} from '@foormjs/atscript'
import type { Component, Ref } from 'vue'

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
export interface TFoormComponentProps<V = unknown> extends TFoormBaseComponentProps {
  /** Called on field blur — triggers validation. */
  onBlur: () => void
  /** Validation error message for this field, if any. */
  error?: string
  /** Reactive model wrapping the field value. Bind with `v-model="model.value"`. */
  model: { value: V }
  /** Phantom field display value from `@foorm.value` / `@foorm.fn.value` (paragraphs, actions). `undefined` for data fields. */
  value?: unknown
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
  /** Toggle an optional field on/off. `true` sets default value; `false` sets `undefined`. Only present when `optional` is true. */
  onToggleOptional?: (enabled: boolean) => void
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
  /** Resolved title from `@foorm.title` / `@foorm.fn.title` / `@meta.label` for structure/array fields. */
  title?: string
  /** Nesting level for structure/array fields. Root structure is 0, each nested structure/array increments by 1. */
  level?: number
  /** Callback to remove this item from its parent array. Present when rendered inside an array. */
  onRemove?: () => void
  /** Whether removal is allowed (respects minLength constraints). */
  canRemove?: boolean
  /** Label for the remove button (from `@foorm.array.remove.label`). */
  removeLabel?: string
  /** Zero-based index when rendered as a direct array item. `undefined` otherwise. */
  arrayIndex?: number
}

/**
 * Discriminated type for the `change` event emitted by `OoForm`.
 *
 * - `'update'` — leaf field value committed (blur)
 * - `'array-add'` — array item added
 * - `'array-remove'` — array item removed
 * - `'union-switch'` — union variant switched
 */
export type TFoormChangeType = 'update' | 'array-add' | 'array-remove' | 'union-switch'

/**
 * Union context provided by `OoUnion` via `__foorm_union` inject key.
 * Consumed by header components (OoStructuredHeader, OoFieldShell) to render
 * the variant picker inline with the item's own header.
 */
/**
 * Type-to-component map for `OoForm`. Lists all built-in field types as
 * required keys and accepts additional custom types via index signature.
 *
 * Use {@link createDefaultTypes} to get a pre-built map with all defaults.
 */
export type TFoormTypeComponents = {
  text: Component
  select: Component
  radio: Component
  checkbox: Component
  paragraph: Component
  action: Component
  object: Component
  array: Component
  union: Component
  tuple: Component
} & Record<string, Component>

export interface TFoormUnionContext {
  /** All available union variant branches. */
  variants: FoormUnionVariant[]
  /** Reactive index of the currently selected variant. */
  currentIndex: Ref<number>
  /** Switch to a different variant (rewrites model data). */
  changeVariant: (index: number) => void
}
