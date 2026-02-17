<script setup lang="ts" generic="TFormData = any, TFormContext = any">
import { VuilessField, type TVuilessState } from 'vuiless-forms'
import { Validator } from '@atscript/typescript/utils'
import type { FoormFieldDef, TFoormFnScope } from 'foorm'
import {
  resolveFieldProp,
  resolveOptions,
  resolveAttrs,
  getFieldMeta,
  getByPath,
  setByPath,
  foormValidatorPlugin,
} from 'foorm'
import { computed, inject, ref, watch, type ComputedRef } from 'vue'

const props = defineProps<{ field: FoormFieldDef; error?: string }>()

const vuiless = inject<ComputedRef<TVuilessState<TFormData, TFormContext>>>(
  'vuiless'
) as ComputedRef<TVuilessState<TFormData, TFormContext>>

// Root form data for fn scope (ensures `data` in fn strings always references root)
const rootData = inject<ComputedRef<TFormData>>(
  'oo-root-data',
  undefined as unknown as ComputedRef<TFormData>
)

// Helper to unwrap value (handles both static and computed)
const unwrap = <T,>(v: T | ComputedRef<T>): T =>
  typeof v === 'object' && v !== null && 'value' in v ? (v as ComputedRef<T>).value : (v as T)

/** Returns the data object to use in fn scopes — root data if available, else local form data. */
function scopeData(): Record<string, unknown> {
  return (rootData?.value ?? vuiless.value.formData) as Record<string, unknown>
}

const prop = props.field.prop

// ── Static reads (always) ──────────────────────────────────
const autocomplete = getFieldMeta<string>(prop, 'foorm.autocomplete')
const maxLength = getFieldMeta<number>(prop, 'expect.maxLength')
const component = getFieldMeta<string>(prop, 'foorm.component')
const altAction = getFieldMeta<string>(prop, 'foorm.altAction')

// ── Validator factory + caching ─────────────────────────────
// Plugin + Validator created once per field, reused on every blur.
// Per-call data/context passed via ATScript external context.
const validatorPlugin = foormValidatorPlugin()
let cachedValidator: InstanceType<typeof Validator> | undefined

// ── Helpers for v-model with dot-path support ──────────────
function getModel() {
  return getByPath(vuiless.value.formData as Record<string, unknown>, props.field.path)
}

function setModel(value: unknown) {
  setByPath(vuiless.value.formData as Record<string, unknown>, props.field.path, value)
}

// ── Declare all field properties ────────────────────────────
// These are assigned in the allStatic fast-path or the dynamic path below.
let disabled: boolean | ComputedRef<boolean>
let hidden: boolean | ComputedRef<boolean>
let optional: boolean | ComputedRef<boolean>
let readonly: boolean | ComputedRef<boolean>
let required: boolean | ComputedRef<boolean> | undefined
let label: string | ComputedRef<string>
let description: string | undefined | ComputedRef<string | undefined>
let hint: string | undefined | ComputedRef<string | undefined>
let placeholder: string | undefined | ComputedRef<string | undefined>
let styles: unknown
let options: ReturnType<typeof resolveOptions> | ComputedRef<ReturnType<typeof resolveOptions>>
let attrs: Record<string, unknown> | ComputedRef<Record<string, unknown> | undefined> | undefined
let classesBase: Record<string, boolean> | ComputedRef<Record<string, boolean>>
let phantomValue: unknown
let hasCustomValidators: boolean

// Empty scope for static resolve calls (options, attrs)
const emptyScope: TFoormFnScope = {
  v: undefined,
  data: {} as Record<string, unknown>,
  context: {} as Record<string, unknown>,
  entry: undefined,
}

if (props.field.allStatic) {
  // ══════════════════════════════════════════════════════════
  // FAST PATH: all properties are static — no scope, no computeds
  // ══════════════════════════════════════════════════════════
  hasCustomValidators = false

  // Constraints: static booleans
  disabled = getFieldMeta(prop, 'foorm.disabled') !== undefined
  hidden = getFieldMeta(prop, 'foorm.hidden') !== undefined
  optional = props.field.prop.optional ?? false
  readonly = getFieldMeta(prop, 'foorm.readonly') !== undefined

  // Required: static boolean (skip for phantom)
  required = props.field.phantom ? undefined : !optional

  // Display: static reads
  label = getFieldMeta<string>(prop, 'meta.label') ?? props.field.name
  description = getFieldMeta<string>(prop, 'meta.description')
  hint = getFieldMeta<string>(prop, 'meta.hint')
  placeholder = getFieldMeta<string>(prop, 'meta.placeholder')
  styles = getFieldMeta(prop, 'foorm.styles')
  options = resolveOptions(prop, emptyScope)
  attrs =
    getFieldMeta(prop, 'foorm.attr') !== undefined ? resolveAttrs(prop, emptyScope) : undefined

  // Classes: plain object (no computed)
  const staticClassValue = getFieldMeta(prop, 'foorm.classes')
  classesBase = {
    ...(typeof staticClassValue === 'string'
      ? { [staticClassValue]: true }
      : (staticClassValue as Record<string, boolean> | undefined)),
    disabled: disabled as boolean,
    required: !(optional as boolean),
  }

  // Phantom value: static
  phantomValue = props.field.phantom ? getFieldMeta(prop, 'foorm.value') : undefined
} else {
  // ══════════════════════════════════════════════════════════
  // DYNAMIC PATH: per-property static/dynamic detection
  // ══════════════════════════════════════════════════════════
  const hasFn = {
    disabled: getFieldMeta(prop, 'foorm.fn.disabled') !== undefined,
    hidden: getFieldMeta(prop, 'foorm.fn.hidden') !== undefined,
    optional: getFieldMeta(prop, 'foorm.fn.optional') !== undefined,
    readonly: getFieldMeta(prop, 'foorm.fn.readonly') !== undefined,
    label: getFieldMeta(prop, 'foorm.fn.label') !== undefined,
    description: getFieldMeta(prop, 'foorm.fn.description') !== undefined,
    hint: getFieldMeta(prop, 'foorm.fn.hint') !== undefined,
    placeholder: getFieldMeta(prop, 'foorm.fn.placeholder') !== undefined,
    classes: getFieldMeta(prop, 'foorm.fn.classes') !== undefined,
    styles: getFieldMeta(prop, 'foorm.fn.styles') !== undefined,
    options: getFieldMeta(prop, 'foorm.fn.options') !== undefined,
    value: getFieldMeta(prop, 'foorm.fn.value') !== undefined,
    attr: getFieldMeta(prop, 'foorm.fn.attr') !== undefined,
  }
  hasCustomValidators = getFieldMeta(prop, 'foorm.validate') !== undefined

  // ── Lazy scope construction ────────────────────────────────
  const needsBaseScope = hasFn.disabled || hasFn.hidden || hasFn.optional || hasFn.readonly
  const needsFullScope =
    hasFn.label ||
    hasFn.description ||
    hasFn.hint ||
    hasFn.placeholder ||
    hasFn.classes ||
    hasFn.styles ||
    hasFn.options ||
    hasFn.value ||
    hasFn.attr ||
    hasCustomValidators
  const needsScope = needsBaseScope || needsFullScope

  // Base scope for constraints (no entry)
  // Uses scopeData() so fn strings always reference root form data
  const baseScope = needsScope
    ? computed<TFoormFnScope>(() => ({
        v: getByPath(vuiless.value.formData as Record<string, unknown>, props.field.path),
        data: scopeData(),
        context: (vuiless.value.formContext ?? {}) as Record<string, unknown>,
        entry: undefined,
      }))
    : undefined

  // Safe alias — guaranteed non-null when hasFn.* is true (implies needsScope)
  const bs = baseScope as ComputedRef<TFoormFnScope>

  // ── Constraints (baseScope phase) ──────────────────────────
  disabled = hasFn.disabled
    ? computed(
        () =>
          resolveFieldProp<boolean>(prop, 'foorm.fn.disabled', 'foorm.disabled', bs.value, {
            staticAsBoolean: true,
          }) ?? false
      )
    : getFieldMeta(prop, 'foorm.disabled') !== undefined

  hidden = hasFn.hidden
    ? computed(
        () =>
          resolveFieldProp<boolean>(prop, 'foorm.fn.hidden', 'foorm.hidden', bs.value, {
            staticAsBoolean: true,
          }) ?? false
      )
    : getFieldMeta(prop, 'foorm.hidden') !== undefined

  optional = hasFn.optional
    ? computed(
        () =>
          resolveFieldProp<boolean>(prop, 'foorm.fn.optional', undefined, bs.value) ??
          props.field.prop.optional ??
          false
      )
    : (props.field.prop.optional ?? false)

  readonly = hasFn.readonly
    ? computed(
        () =>
          resolveFieldProp<boolean>(prop, 'foorm.fn.readonly', 'foorm.readonly', bs.value, {
            staticAsBoolean: true,
          }) ?? false
      )
    : getFieldMeta(prop, 'foorm.readonly') !== undefined

  // Derived: required (skip for phantom fields)
  required = props.field.phantom
    ? undefined
    : typeof optional === 'boolean'
      ? !optional
      : computed(() => !unwrap(optional))

  // ── Full scope with entry (derived from baseScope) ─────────
  const scope = needsFullScope
    ? computed<TFoormFnScope>(() => ({
        ...bs.value,
        entry: {
          field: props.field.path,
          type: props.field.type,
          component,
          name: props.field.name,
          optional: unwrap(optional),
          disabled: unwrap(disabled),
          hidden: unwrap(hidden),
          readonly: unwrap(readonly),
        },
      }))
    : undefined

  // Safe alias — guaranteed non-null when hasFn.* is true (implies needsFullScope)
  const fs = scope as ComputedRef<TFoormFnScope>

  // ── Display props (full scope phase) ───────────────────────
  label = hasFn.label
    ? computed(
        () =>
          resolveFieldProp<string>(prop, 'foorm.fn.label', 'meta.label', fs.value) ??
          props.field.name
      )
    : (getFieldMeta<string>(prop, 'meta.label') ?? props.field.name)

  description = hasFn.description
    ? computed(() =>
        resolveFieldProp<string>(prop, 'foorm.fn.description', 'meta.description', fs.value)
      )
    : getFieldMeta<string>(prop, 'meta.description')

  hint = hasFn.hint
    ? computed(() => resolveFieldProp<string>(prop, 'foorm.fn.hint', 'meta.hint', fs.value))
    : getFieldMeta<string>(prop, 'meta.hint')

  placeholder = hasFn.placeholder
    ? computed(() =>
        resolveFieldProp<string>(prop, 'foorm.fn.placeholder', 'meta.placeholder', fs.value)
      )
    : getFieldMeta<string>(prop, 'meta.placeholder')

  styles = hasFn.styles
    ? computed(() => resolveFieldProp(prop, 'foorm.fn.styles', 'foorm.styles', fs.value))
    : getFieldMeta(prop, 'foorm.styles')

  options = hasFn.options
    ? computed(() => resolveOptions(prop, fs.value))
    : resolveOptions(prop, emptyScope)

  attrs =
    hasFn.attr || getFieldMeta(prop, 'foorm.attr') !== undefined
      ? hasFn.attr
        ? computed(() => resolveAttrs(prop, fs.value))
        : resolveAttrs(prop, emptyScope)
      : undefined

  // ── Classes — conditional computed ─────────────────────────
  classesBase =
    hasFn.classes || typeof disabled !== 'boolean' || typeof optional !== 'boolean'
      ? computed(() => {
          const classValue = hasFn.classes
            ? resolveFieldProp(prop, 'foorm.fn.classes', undefined, fs.value)
            : getFieldMeta(prop, 'foorm.classes')

          return {
            ...(typeof classValue === 'string'
              ? { [classValue]: true }
              : (classValue as Record<string, boolean> | undefined)),
            disabled: unwrap(disabled),
            required: !unwrap(optional),
          }
        })
      : (() => {
          const staticClassValue = getFieldMeta(prop, 'foorm.classes')
          return {
            ...(typeof staticClassValue === 'string'
              ? { [staticClassValue]: true }
              : (staticClassValue as Record<string, boolean> | undefined)),
            disabled: disabled as boolean,
            required: !(optional as boolean),
          }
        })()

  // ── Phantom value (paragraph, action display) ──────────────
  phantomValue = props.field.phantom
    ? hasFn.value
      ? computed(() => resolveFieldProp(prop, 'foorm.fn.value', 'foorm.value', fs.value))
      : getFieldMeta(prop, 'foorm.value')
    : undefined

  // ── Readonly watcher (computed derived fields) ─────────────
  if (hasFn.value && !props.field.phantom) {
    const computedValue = computed(() => {
      if (unwrap(readonly)) return resolveFieldProp(prop, 'foorm.fn.value', 'foorm.value', fs.value)
      return undefined
    })

    watch(
      computedValue,
      newVal => {
        if (newVal !== undefined && unwrap(readonly))
          setByPath(vuiless.value.formData as Record<string, unknown>, props.field.path, newVal)
      },
      { immediate: true }
    )
  }
}

// ── Validation rule (shared by both paths) ──────────────────
function vuilessRule(v: unknown) {
  cachedValidator ??= new Validator(prop, { plugins: [validatorPlugin] })
  const isValid = cachedValidator.validate(
    v,
    true,
    hasCustomValidators
      ? {
          data: scopeData(),
          context: (vuiless.value.formContext ?? {}) as Record<string, unknown>,
        }
      : undefined
  )
  if (!isValid) {
    // For array/group fields, only report root-level errors (path === '').
    // Child errors are handled by their own OoField validators.
    if (props.field.type === 'array' || props.field.type === 'group') {
      const rootError = cachedValidator.errors?.find(e => e.path === '')
      if (rootError) return rootError.message
      return true
    }
    return cachedValidator.errors?.[0]?.message || 'Invalid value'
  }
  return true
}

const rules = [vuilessRule]

// Function to merge classes with error flag
function getClasses(error: string | undefined, vuilessError: string | undefined) {
  return {
    ...unwrap(classesBase),
    error: !!error || !!vuilessError,
  }
}
</script>

<template>
  <VuilessField
    :model-value="getModel()"
    @update:model-value="setModel($event)"
    :rules="rules"
    v-slot="vuilessField"
  >
    <slot
      :on-blur="vuilessField.onBlur"
      :error="error || vuilessField.error"
      :model="vuilessField.model"
      :form-data="vuiless.formData"
      :form-context="vuiless.formContext"
      :label="label"
      :description="description"
      :hint="hint"
      :placeholder="placeholder"
      :value="phantomValue"
      :classes="getClasses(error, vuilessField.error)"
      :styles="styles"
      :optional="optional"
      :disabled="disabled"
      :hidden="hidden"
      :readonly="readonly"
      :type="field.type"
      :alt-action="altAction"
      :component="component"
      :v-name="field.name"
      :field="field"
      :options="options"
      :max-length="maxLength"
      :required="required"
      :autocomplete="autocomplete"
      :attrs="attrs"
    >
    </slot>
  </VuilessField>
</template>
