<script setup lang="ts" generic="TFormData = any, TFormContext = any">
import { useFoormField } from '@foormjs/composables'
import type {
  FoormFieldDef,
  TFoormAltAction,
  TFoormFieldEvaluated,
  TFoormFnScope,
} from '@foormjs/atscript'
import {
  resolveFieldProp,
  resolveOptions,
  resolveAttrs,
  getFieldMeta,
  getByPath,
  setByPath,
} from '@foormjs/atscript'
import { computed, isRef, watch, type ComputedRef } from 'vue'
import { useFoormContext } from '../composables/use-foorm-context'
import { useFoormValidator } from '../composables/use-foorm-validator'

const props = defineProps<{
  field: FoormFieldDef
  error?: string
  onRemove?: () => void
  canRemove?: boolean
  removeLabel?: string
}>()

defineSlots<{
  default(props: {
    onBlur: () => void
    error: string | undefined
    model: { value: unknown }
    formData: TFormData
    formContext: TFormContext | undefined
    label: string
    description: string | undefined
    hint: string | undefined
    placeholder: string | undefined
    value: unknown
    classes: Record<string, boolean>
    styles: unknown
    optional: boolean
    disabled: boolean
    hidden: boolean
    readonly: boolean
    type: string
    altAction: TFoormAltAction | undefined
    component: string | undefined
    vName: string
    field: FoormFieldDef
    options: unknown
    maxLength: number | undefined
    required: boolean | undefined
    autocomplete: string | undefined
    attrs: Record<string, unknown> | undefined
    onRemove: (() => void) | undefined
    canRemove: boolean | undefined
    removeLabel: string | undefined
  }): unknown
}>()

const { foormState, rootFormData, formContext, joinPath, buildScope } = useFoormContext<
  TFormData,
  TFormContext
>('OoField')
const absolutePath = joinPath(props.field.path)

// Helper to unwrap value (handles both static and computed)
const unwrap = <T,>(v: T | ComputedRef<T>): T => (isRef(v) ? v.value : v)

const prop = props.field.prop

// ── Static reads (always) ──────────────────────────────────
const autocomplete = getFieldMeta<string>(prop, 'foorm.autocomplete')
const maxLength = getFieldMeta<number>(prop, 'expect.maxLength')
const component = getFieldMeta<string>(prop, 'foorm.component')
const altActionMeta = getFieldMeta<{ id: string; label?: string }>(prop, 'foorm.altAction')
const altAction: TFoormAltAction | undefined = altActionMeta
  ? {
      id: altActionMeta.id,
      label: altActionMeta.label ?? getFieldMeta<string>(prop, 'meta.label') ?? props.field.name,
    }
  : undefined

// ── Cached validator (created once per field) ────────────────
const { validate: foormValidate } = useFoormValidator(prop)

// ── Helpers for v-model with absolute path support ──────────
function getModel() {
  const p = absolutePath.value
  return p === undefined ? rootFormData() : getByPath(rootFormData(), p)
}

function setModel(value: unknown) {
  const p = absolutePath.value
  if (p !== undefined) setByPath(rootFormData(), p, value)
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

// Whether @meta.required is present (static — shared by both paths)
const hasMetaRequired = getFieldMeta(prop, 'meta.required') !== undefined

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

  // Required: based on @meta.required (skip for phantom)
  required = props.field.phantom ? undefined : hasMetaRequired

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
    required: hasMetaRequired,
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
  // Always uses root form data for fn scopes
  const baseScope = needsScope ? computed(() => buildScope(getModel())) : undefined

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

  // Derived: required based on @meta.required (skip for phantom)
  required = props.field.phantom ? undefined : hasMetaRequired

  // ── Full scope with entry (derived from baseScope) ─────────
  const scope = needsFullScope
    ? computed<TFoormFnScope>(() => {
        const entry: TFoormFieldEvaluated = {
          field: props.field.path,
          type: props.field.type,
          component,
          name: props.field.name,
          optional: unwrap(optional),
          disabled: unwrap(disabled),
          hidden: unwrap(hidden),
          readonly: unwrap(readonly),
        }
        const s = { ...bs.value, entry }
        // Resolve options into entry (after scope is built to avoid circular dep)
        entry.options = resolveOptions(prop, s) ?? undefined
        return s
      })
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
    hasFn.classes || typeof disabled !== 'boolean'
      ? computed(() => {
          const classValue = hasFn.classes
            ? resolveFieldProp(prop, 'foorm.fn.classes', undefined, fs.value)
            : getFieldMeta(prop, 'foorm.classes')

          return {
            ...(typeof classValue === 'string'
              ? { [classValue]: true }
              : (classValue as Record<string, boolean> | undefined)),
            disabled: unwrap(disabled),
            required: hasMetaRequired,
          }
        })
      : (() => {
          const staticClassValue = getFieldMeta(prop, 'foorm.classes')
          return {
            ...(typeof staticClassValue === 'string'
              ? { [staticClassValue]: true }
              : (staticClassValue as Record<string, boolean> | undefined)),
            disabled: disabled as boolean,
            required: hasMetaRequired,
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
        if (newVal !== undefined && unwrap(readonly)) {
          const p = absolutePath.value
          if (p !== undefined) setByPath(rootFormData(), p, newVal)
        }
      },
      { immediate: true }
    )
  }
}

// ── Validation rule (shared by both paths) ──────────────────
function foormRule(v: unknown) {
  return foormValidate(
    v,
    hasCustomValidators ? { data: rootFormData(), context: formContext.value } : undefined
  )
}

// ── Vuiless field composable ────────────────────────────────
const {
  model,
  error: foormError,
  onBlur,
} = useFoormField({
  getValue: getModel,
  setValue: setModel,
  rules: [foormRule],
  path: () => absolutePath.value,
})

// Merged error: external prop > foorm composable error
const mergedError = computed(() => props.error || foormError.value)

// Stable model wrapper — plain object with getter/setter so Vue's template
// auto-unwrapping doesn't strip the ref. Slot consumers use v-model="field.model.value".
const slotModel = {
  get value() {
    return model.value
  },
  set value(v: unknown) {
    model.value = v
  },
}

// Computed classes with error flag
const classes = computed(() => ({
  ...unwrap(classesBase),
  error: !!mergedError.value,
}))
</script>

<template>
  <slot
    :on-blur="onBlur"
    :error="mergedError"
    :model="slotModel"
    :form-data="foormState.formData"
    :form-context="foormState.formContext"
    :label="unwrap(label)"
    :description="unwrap(description)"
    :hint="unwrap(hint)"
    :placeholder="unwrap(placeholder)"
    :value="unwrap(phantomValue)"
    :classes="classes"
    :styles="unwrap(styles)"
    :optional="unwrap(optional)"
    :disabled="unwrap(disabled)"
    :hidden="unwrap(hidden)"
    :readonly="unwrap(readonly)"
    :type="field.type"
    :alt-action="altAction"
    :component="component"
    :v-name="field.name"
    :field="field"
    :options="unwrap(options)"
    :max-length="maxLength"
    :required="required !== undefined ? unwrap(required) : undefined"
    :autocomplete="autocomplete"
    :attrs="unwrap(attrs)"
    :on-remove="onRemove"
    :can-remove="canRemove"
    :remove-label="removeLabel"
  >
  </slot>
</template>
