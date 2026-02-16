<script setup lang="ts" generic="TFormData = any, TFormContext = any">
import { evalAttrs } from '../utils'
import { VuilessField, type TVuilessState } from 'vuiless-forms'
import { type TFoormField, type TFoormFnScope } from 'foorm'
import { computed, inject, watch, type ComputedRef } from 'vue'

type Props = TFoormField & {
  error?: string
}

const props = defineProps<Props>()

const vuiless = inject<ComputedRef<TVuilessState<TFormData, TFormContext>>>(
  'vuiless'
) as ComputedRef<TVuilessState<TFormData, TFormContext>>

// Helper to create reactive property (computed if function, static otherwise)
function makeReactive<T>(
  value: T | ((scope: TFoormFnScope) => T) | undefined,
  scopeRef: ComputedRef<TFoormFnScope>,
  defaultValue?: T
): T | ComputedRef<T> {
  if (typeof value === 'function') {
    return computed(() => (value as Function)(scopeRef.value))
  }
  return (value ?? defaultValue) as T
}

// Helper to unwrap value (handles both static and computed)
const unwrap = <T>(v: T | ComputedRef<T>): T =>
  typeof v === 'object' && v !== null && 'value' in v ? (v as ComputedRef<T>).value : v as T

// Base scope for constraints (no entry)
const baseScope = computed<TFoormFnScope>(() => ({
  v: vuiless.value.formData[props.field as keyof TFormData],
  data: vuiless.value.formData as Record<string, unknown>,
  context: (vuiless.value.formContext ?? {}) as Record<string, unknown>,
  entry: undefined,
}))

// Constraints - only computed if function
const optional = makeReactive(props.optional, baseScope, false)
const disabled = makeReactive(props.disabled, baseScope, false)
const hidden = makeReactive(props.hidden, baseScope, false)
const readonly = makeReactive(props.readonly, baseScope, false)

// Derived computed values
// Phantom fields don't need required attribute
const required = props.phantom ? undefined : computed(() => !unwrap(optional))

// Full scope with entry
const scope = computed<TFoormFnScope>(() => ({
  v: vuiless.value.formData[props.field as keyof TFormData],
  data: vuiless.value.formData as Record<string, unknown>,
  context: (vuiless.value.formContext ?? {}) as Record<string, unknown>,
  entry: {
    field: props.field,
    type: props.type,
    component: props.component,
    name: props.name || props.field,
    optional: unwrap(optional),
    disabled: unwrap(disabled),
    hidden: unwrap(hidden),
    readonly: unwrap(readonly),
  },
}))

// Field properties - only computed if function
const label = makeReactive(props.label, scope, undefined)
const description = makeReactive(props.description, scope, undefined)
const hint = makeReactive(props.hint, scope, undefined)
const placeholder = makeReactive(props.placeholder, scope, undefined)
const options = makeReactive(props.options, scope, undefined)
const styles = makeReactive(props.styles, scope, undefined)

// Classes - always computed (merges multiple values)
const classesBase = computed(() => {
  const classValue = typeof props.classes === 'function'
    ? props.classes(scope.value)
    : props.classes

  return typeof classValue === 'string'
    ? {
        [classValue]: true,
        disabled: unwrap(disabled),
        required: !unwrap(optional),
      }
    : {
        ...classValue,
        disabled: unwrap(disabled),
        required: !unwrap(optional),
      }
})

// Function to merge classes with error flag
function getClasses(error: string | undefined, vuilessError: string | undefined) {
  return {
    ...classesBase.value,
    error: !!error || !!vuilessError,
  }
}

// Attrs - always computed (evalAttrs processes the entire object)
const attrs = computed(() => evalAttrs(props.attrs, scope.value))

// Phantom value - only for phantom fields (paragraph, action)
const phantomValue = props.phantom
  ? computed(() => (typeof props.value === 'function' ? props.value(scope.value) : props.value))
  : undefined

// Conditional watcher for readonly computed values
// Skip phantom fields (paragraph, action) as they shouldn't be in form data
if (typeof props.value === 'function' && !props.phantom) {
  const computedValue = computed(() => {
    if (unwrap(readonly)) {
      return (props.value as Function)(scope.value)
    }
    return undefined
  })

  watch(
    computedValue,
    (newVal) => {
      if (newVal !== undefined && unwrap(readonly)) {
        vuiless.value.formData[props.field as keyof TFormData] = newVal as any
      }
    },
    { immediate: true }
  )
}

// Validator wrappers - must access scope.value inside to maintain reactivity
const rules = props.validators.map(fn => {
  return (v: unknown, data: TFormData, context: TFormContext) =>
    fn({
      v,
      data: data as Record<string, unknown>,
      context: (context ?? {}) as Record<string, unknown>,
      entry: scope.value.entry,
    })
})
</script>

<template>
  <VuilessField
    v-model="vuiless.formData[props.field as keyof TFormData]"
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
      :type="type"
      :alt-action="altAction"
      :component="component"
      :v-name="name"
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
