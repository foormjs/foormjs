<script lang="ts">
import type { TFoormFnScope } from '@foormjs/atscript'

// Module-level singleton — shared across all OoField instances
const emptyScope: TFoormFnScope = {
  v: undefined,
  data: {} as Record<string, unknown>,
  context: {} as Record<string, unknown>,
  entry: undefined,
}
</script>

<script setup lang="ts" generic="TFormData = any, TFormContext = any">
import { useFoormField } from '@foormjs/composables'
import {
  isObjectField,
  isArrayField,
  isUnionField,
  isTupleField,
  resolveFieldProp,
  resolveOptions,
  resolveAttrs,
  getFieldMeta,
  buildFieldEntry,
  createDefaultValue,
  createFormData,
  createFieldValidator,
  type FoormFieldDef,
  type FoormObjectFieldDef,
  type TFoormAltAction,
} from '@foormjs/atscript'
import { computed, inject, isRef, provide, watch, type Component, type ComputedRef } from 'vue'
import { useFoormContext } from '../composables/use-foorm-context'
import type { TFoormChangeType } from './types'

const props = defineProps<{
  field: FoormFieldDef
  error?: string
  onRemove?: () => void
  canRemove?: boolean
  removeLabel?: string
  arrayIndex?: number
}>()

// ── Inject types, components, errors, action handler ─────────
const types = inject<ComputedRef<Record<string, Component>>>('__foorm_types')
const components = inject<ComputedRef<Record<string, Component> | undefined>>('__foorm_components')
const errors = inject<ComputedRef<Record<string, string | undefined> | undefined>>('__foorm_errors')
const handleAction = inject<(name: string) => void>('__foorm_action_handler', () => {})
const handleChange = inject<(type: TFoormChangeType, path: string, value: unknown) => void>(
  '__foorm_change_handler',
  () => {}
)

// ── Foorm context ────────────────────────────────────────────
const { rootFormData, formContext, joinPath, buildPath, getByPath, setByPath, buildScope } =
  useFoormContext<TFormData, TFormContext>('OoField')
const absolutePath = joinPath(() => props.field.path)

// ── Structured field detection ──────────────────────────────
const isStructured =
  isObjectField(props.field) || isArrayField(props.field) || isTupleField(props.field)
const isUnion = isUnionField(props.field)

// ── Nesting level tracking ──────────────────────────────────
const parentLevel = inject<ComputedRef<number>>(
  '__foorm_level',
  computed(() => -1)
)
const myLevel = isStructured ? parentLevel.value + 1 : -1

// ── Provide path prefix + level for children (object/array/tuple/union)
// Union fields provide path prefix (children need correct path)
// but do NOT increment level (transparent wrapper — prevents double increment)
if (isStructured || isUnion) {
  provide(
    '__foorm_path_prefix',
    computed(() => absolutePath.value)
  )
}
if (isStructured) {
  provide(
    '__foorm_level',
    computed(() => myLevel)
  )
}

// Helper to unwrap value (handles both static and computed)
const unwrap = <T,>(v: T | ComputedRef<T>): T => (isRef(v) ? v.value : v)

// Helper: returns a computed when dynamic, static value otherwise
function maybeComputed<T>(
  isDynamic: boolean,
  dynamicFn: () => T,
  staticVal: T
): T | ComputedRef<T> {
  return isDynamic ? computed(dynamicFn) : staticVal
}

// Helper to build the class object from a raw class value + state flags
function buildFieldClasses(
  classValue: unknown,
  isDisabled: boolean,
  isRequired: boolean
): Record<string, boolean> {
  return {
    ...(typeof classValue === 'string'
      ? { [classValue]: true }
      : (classValue as Record<string, boolean> | undefined)),
    disabled: isDisabled,
    required: isRequired,
  }
}

const prop = props.field.prop

// ── Static reads (always) ──────────────────────────────────
const autocomplete = getFieldMeta(prop, 'foorm.autocomplete')
const maxLength = getFieldMeta(prop, 'expect.maxLength')?.length
const componentName = getFieldMeta(prop, 'foorm.component')
const altActionMeta = getFieldMeta(prop, 'foorm.altAction')
const altAction: TFoormAltAction | undefined = altActionMeta
  ? {
      id: altActionMeta.id,
      label: altActionMeta.label ?? getFieldMeta(prop, 'meta.label') ?? props.field.name,
    }
  : undefined

// ── Cached validator (created once per field) ────────────────
const foormValidate = createFieldValidator(
  prop,
  isStructured || isUnion ? { rootOnly: true } : undefined
)

// ── Helpers for v-model with absolute path support ──────────
function getModel() {
  return getByPath(absolutePath.value)
}

function setModel(value: unknown) {
  setByPath(absolutePath.value, value)
}

// ── Optional toggle ─────────────────────────────────────────
function toggleOptional(enabled: boolean) {
  if (enabled) {
    // Check explicit @foorm.value / @foorm.fn.value first
    const explicit = resolveFieldProp(prop, 'foorm.fn.value', 'foorm.value', buildScope(undefined))
    if (explicit !== undefined) {
      setModel(explicit)
    } else if (isObjectField(props.field)) {
      const objField = props.field as FoormObjectFieldDef
      setModel(createFormData(objField.prop, objField.objectDef.fields).value)
    } else {
      setModel(createDefaultValue(props.field.prop))
    }
  } else {
    setModel(undefined)
  }
  handleChange('update', absolutePath.value, getModel())
}

// ── Component resolution ────────────────────────────────────
const resolvedComponent = computed<Component | undefined>(() => {
  if (componentName) return components?.value?.[componentName]
  return types?.value?.[props.field.type]
})

// ── Declare all field properties ────────────────────────────
let disabled: boolean | ComputedRef<boolean>
let hidden: boolean | ComputedRef<boolean>
let optional: boolean | ComputedRef<boolean>
let readonly: boolean | ComputedRef<boolean>
let required: boolean | ComputedRef<boolean> | undefined
let label: string | ComputedRef<string>
let description: string | undefined | ComputedRef<string | undefined>
let hint: string | undefined | ComputedRef<string | undefined>
let placeholder: string | undefined | ComputedRef<string | undefined>
let title: string | undefined | ComputedRef<string | undefined>
let styles: unknown
let options: ReturnType<typeof resolveOptions> | ComputedRef<ReturnType<typeof resolveOptions>>
let attrs: Record<string, unknown> | ComputedRef<Record<string, unknown> | undefined> | undefined
let classesBase: Record<string, boolean> | ComputedRef<Record<string, boolean>>
let phantomValue: unknown
let hasCustomValidators: boolean

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
  label = getFieldMeta(prop, 'meta.label') ?? props.field.name
  description = getFieldMeta(prop, 'meta.description')
  hint = getFieldMeta(prop, 'meta.hint')
  placeholder = getFieldMeta(prop, 'meta.placeholder')
  styles = getFieldMeta(prop, 'foorm.styles')
  options = resolveOptions(prop, emptyScope)
  attrs =
    getFieldMeta(prop, 'foorm.attr') !== undefined ? resolveAttrs(prop, emptyScope) : undefined

  // Title: static (for structure/array fields)
  title = isStructured
    ? (getFieldMeta(prop, 'foorm.title') ?? getFieldMeta(prop, 'meta.label') ?? props.field.name)
    : undefined

  // Classes: plain object (no computed)
  classesBase = buildFieldClasses(
    getFieldMeta(prop, 'foorm.classes'),
    disabled as boolean,
    hasMetaRequired
  )

  // Phantom value: static
  phantomValue = props.field.phantom ? getFieldMeta(prop, 'foorm.value') : undefined
} else {
  // ══════════════════════════════════════════════════════════
  // DYNAMIC PATH: per-property static/dynamic detection
  // ══════════════════════════════════════════════════════════
  // Single scan of metadata keys to detect all foorm.fn.* annotations
  const hasFn = new Set<string>()
  for (const key of (prop.metadata as unknown as { keys(): Iterable<string> }).keys()) {
    if (key.startsWith('foorm.fn.')) hasFn.add(key.slice(9))
  }
  hasCustomValidators = getFieldMeta(prop, 'foorm.validate') !== undefined

  // ── Lazy scope construction ────────────────────────────────
  const needsBaseScope = hasFn.has('disabled') || hasFn.has('hidden') || hasFn.has('readonly')
  const needsFullScope =
    hasFn.has('label') ||
    hasFn.has('description') ||
    hasFn.has('hint') ||
    hasFn.has('placeholder') ||
    hasFn.has('classes') ||
    hasFn.has('styles') ||
    hasFn.has('options') ||
    hasFn.has('value') ||
    hasFn.has('attr') ||
    hasFn.has('title') ||
    hasCustomValidators
  const needsScope = needsBaseScope || needsFullScope

  // Base scope for constraints (no entry)
  const baseScope = needsScope ? computed(() => buildScope(getModel())) : undefined

  // Safe alias — guaranteed non-null when hasFn.has() is true (implies needsScope)
  const bs = baseScope as ComputedRef<TFoormFnScope>

  // ── Constraints (baseScope phase) ──────────────────────────
  const boolOpts = { staticAsBoolean: true } as const

  disabled = maybeComputed(
    hasFn.has('disabled'),
    () =>
      resolveFieldProp<boolean>(prop, 'foorm.fn.disabled', 'foorm.disabled', bs.value, boolOpts) ??
      false,
    getFieldMeta(prop, 'foorm.disabled') !== undefined
  )

  hidden = maybeComputed(
    hasFn.has('hidden'),
    () =>
      resolveFieldProp<boolean>(prop, 'foorm.fn.hidden', 'foorm.hidden', bs.value, boolOpts) ??
      false,
    getFieldMeta(prop, 'foorm.hidden') !== undefined
  )

  optional = props.field.prop.optional ?? false

  readonly = maybeComputed(
    hasFn.has('readonly'),
    () =>
      resolveFieldProp<boolean>(prop, 'foorm.fn.readonly', 'foorm.readonly', bs.value, boolOpts) ??
      false,
    getFieldMeta(prop, 'foorm.readonly') !== undefined
  )

  // Derived: required based on @meta.required (skip for phantom)
  required = props.field.phantom ? undefined : hasMetaRequired

  // ── Full scope with entry (derived from baseScope) ─────────
  const scope = needsFullScope
    ? computed<TFoormFnScope>(() =>
        buildFieldEntry(prop, bs.value, props.field.path, {
          type: props.field.type,
          component: componentName,
          name: props.field.name,
          optional: unwrap(optional),
          disabled: unwrap(disabled),
          hidden: unwrap(hidden),
          readonly: unwrap(readonly),
        })
      )
    : undefined

  // Safe alias — guaranteed non-null when hasFn.has() is true (implies needsFullScope)
  const fs = scope as ComputedRef<TFoormFnScope>

  // ── Display props (full scope phase) ───────────────────────
  label = maybeComputed(
    hasFn.has('label'),
    () =>
      resolveFieldProp<string>(prop, 'foorm.fn.label', 'meta.label', fs.value) ?? props.field.name,
    getFieldMeta(prop, 'meta.label') ?? props.field.name
  )

  description = maybeComputed(
    hasFn.has('description'),
    () => resolveFieldProp<string>(prop, 'foorm.fn.description', 'meta.description', fs.value),
    getFieldMeta(prop, 'meta.description')
  )

  hint = maybeComputed(
    hasFn.has('hint'),
    () => resolveFieldProp<string>(prop, 'foorm.fn.hint', 'meta.hint', fs.value),
    getFieldMeta(prop, 'meta.hint')
  )

  placeholder = maybeComputed(
    hasFn.has('placeholder'),
    () => resolveFieldProp<string>(prop, 'foorm.fn.placeholder', 'meta.placeholder', fs.value),
    getFieldMeta(prop, 'meta.placeholder')
  )

  styles = maybeComputed(
    hasFn.has('styles'),
    () => resolveFieldProp(prop, 'foorm.fn.styles', 'foorm.styles', fs.value),
    getFieldMeta(prop, 'foorm.styles')
  )

  options = maybeComputed(
    hasFn.has('options'),
    () => resolveOptions(prop, fs.value),
    resolveOptions(prop, emptyScope)
  )

  attrs =
    hasFn.has('attr') || getFieldMeta(prop, 'foorm.attr') !== undefined
      ? hasFn.has('attr')
        ? computed(() => resolveAttrs(prop, fs.value))
        : resolveAttrs(prop, emptyScope)
      : undefined

  // ── Title (for structure/array fields) ─────────────────────
  title = isStructured
    ? maybeComputed(
        hasFn.has('title'),
        () =>
          resolveFieldProp<string>(prop, 'foorm.fn.title', 'foorm.title', fs.value) ??
          getFieldMeta(prop, 'meta.label') ??
          props.field.name,
        getFieldMeta(prop, 'foorm.title') ?? getFieldMeta(prop, 'meta.label') ?? props.field.name
      )
    : undefined

  // ── Classes — conditional computed ─────────────────────────
  classesBase =
    hasFn.has('classes') || typeof disabled !== 'boolean'
      ? computed(() =>
          buildFieldClasses(
            hasFn.has('classes')
              ? resolveFieldProp(prop, 'foorm.fn.classes', undefined, fs.value)
              : getFieldMeta(prop, 'foorm.classes'),
            unwrap(disabled),
            hasMetaRequired
          )
        )
      : buildFieldClasses(getFieldMeta(prop, 'foorm.classes'), disabled as boolean, hasMetaRequired)

  // ── Phantom value (paragraph, action display) ──────────────
  phantomValue = props.field.phantom
    ? maybeComputed(
        hasFn.has('value'),
        () => resolveFieldProp(prop, 'foorm.fn.value', 'foorm.value', fs.value),
        getFieldMeta(prop, 'foorm.value')
      )
    : undefined

  // ── Readonly watcher (computed derived fields) ─────────────
  if (hasFn.has('value') && !props.field.phantom) {
    const computedValue = computed(() => {
      if (unwrap(readonly)) return resolveFieldProp(prop, 'foorm.fn.value', 'foorm.value', fs.value)
      return undefined
    })

    watch(
      computedValue,
      newVal => {
        if (newVal !== undefined && unwrap(readonly)) {
          setByPath(absolutePath.value, newVal)
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
const isOptionalField = props.field.prop.optional ?? false

const {
  model,
  error: foormError,
  onBlur: _onBlur,
} = useFoormField({
  getValue: getModel,
  setValue: setModel,
  rules: [foormRule],
  path: () => absolutePath.value,
  ...(isOptionalField
    ? { resetValue: undefined }
    : isArrayField(props.field) || isTupleField(props.field)
      ? { resetValue: [] }
      : isObjectField(props.field)
        ? { resetValue: {} }
        : {}),
})

// Leaf fields emit 'update' on blur only when value changed since last emit.
let lastEmittedValue: unknown = model.value
const onBlur =
  isStructured || isUnion
    ? _onBlur
    : () => {
        _onBlur()
        const current = model.value
        if (current !== lastEmittedValue) {
          lastEmittedValue = current
          handleChange('update', absolutePath.value, current)
        }
      }

// Merged error: external errors map > prop > foorm composable error
const mergedError = computed(() => {
  const path = buildPath(props.field.path)
  return (path ? errors?.value?.[path] : undefined) ?? props.error ?? foormError.value
})

// Stable model wrapper — plain object with getter/setter
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

// ── Field-invariant props (setup-time constants) ──────────────
const invariantProps = {
  onBlur,
  model: slotModel,
  type: props.field.type,
  altAction,
  name: props.field.name,
  field: props.field,
  maxLength,
  autocomplete,
  level: isStructured ? myLevel : undefined,
}

// ── Display props — cached separately from error state ────────
// For allStatic fields this computed has zero reactive deps (evaluated
// once and cached). Error-only changes skip re-evaluating all unwrap() calls.
const displayProps = computed(() => ({
  value: unwrap(phantomValue),
  label: unwrap(label),
  description: unwrap(description),
  hint: unwrap(hint),
  placeholder: unwrap(placeholder),
  style: unwrap(styles),
  optional: unwrap(optional),
  onToggleOptional: unwrap(optional) ? toggleOptional : undefined,
  required: required !== undefined ? unwrap(required) : undefined,
  disabled: unwrap(disabled),
  hidden: unwrap(hidden),
  readonly: unwrap(readonly),
  options: unwrap(options),
  title: unwrap(title),
  onRemove: props.onRemove,
  canRemove: props.canRemove,
  removeLabel: props.removeLabel,
  arrayIndex: props.arrayIndex,
  ...unwrap(attrs),
}))

// ── Final component props — merges invariant + display + error state ──
const componentProps = computed(() => ({
  ...invariantProps,
  ...displayProps.value,
  error: mergedError.value,
  class: classes.value,
}))
</script>

<template>
  <component
    v-if="resolvedComponent"
    :is="resolvedComponent"
    v-bind="componentProps"
    @action="handleAction"
  />
  <div v-else>
    [{{ unwrap(label) }}] No component for type "{{ field.type }}"{{
      componentName ? ` (component "${componentName}" not supplied)` : ''
    }}
  </div>
</template>
