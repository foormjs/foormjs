<script setup lang="ts" generic="TFormData = any, TFormContext = any">
import { evalAttrs } from '../utils'
import { VuilessField, type TVuilessState } from 'vuiless-forms'
import { type TFoormField, type TFoormFnScope, evalComputed } from 'foorm'
import { computed, inject, type ComputedRef } from 'vue'

type Props = TFoormField & {
  error?: string
}

const props = defineProps<Props>()

const vuiless = inject<ComputedRef<TVuilessState<TFormData, TFormContext>>>(
  'vuiless'
) as ComputedRef<TVuilessState<TFormData, TFormContext>>

// Base scope (without evaluated entry) for constraint evaluation
const baseCtx = computed<TFoormFnScope>(() => ({
  v: vuiless.value.formData[props.field as keyof TFormData],
  data: vuiless.value.formData as Record<string, unknown>,
  context: (vuiless.value.formContext ?? {}) as Record<string, unknown>,
}))

// Constraints (evaluated first, before full scope)
const _optional = computed(() => evalComputed(props.optional, baseCtx.value))
const _disabled = computed(() => evalComputed(props.disabled, baseCtx.value))
const _hidden = computed(() => evalComputed(props.hidden, baseCtx.value))

// Full scope with evaluated entry (for description, appearance, validators)
const ctx = computed<TFoormFnScope>(() => ({
  ...baseCtx.value,
  entry: {
    field: props.field,
    type: props.type,
    component: props.component,
    name: props.name || props.field,
    disabled: _disabled.value,
    optional: _optional.value,
    hidden: _hidden.value,
  },
}))

// Description
const _label = computed(() => evalComputed(props.label, ctx.value))
const _description = computed(() => evalComputed(props.description, ctx.value))
const _hint = computed(() => evalComputed(props.hint, ctx.value))
const _placeholder = computed(() => evalComputed(props.placeholder, ctx.value))

// Options
const _options = computed(() => evalComputed(props.options, ctx.value))

// Appearance
const _classes = computed(() => {
  const v = evalComputed(props.classes, ctx.value)
  if (typeof v === 'string') {
    return {
      [v]: true,
      disabled: _disabled.value,
      required: !_optional.value,
    }
  }
  return {
    ...(v || {}),
    disabled: _disabled.value,
    required: !_optional.value,
  }
})

const _styles = computed(
  () => evalComputed(props.styles, ctx.value) as string | Record<string, string> | undefined
)

const _attrs = computed(() => evalAttrs(props.attrs, ctx.value))

// Wrap validators into vuiless-forms rule format: (v, data, context) => boolean | string
const rules = computed(() => {
  return props.validators.map(
    fn => (v: unknown, data: TFormData, context: TFormContext) =>
      fn({
        v,
        data: data as Record<string, unknown>,
        context: (context ?? {}) as Record<string, unknown>,
        entry: ctx.value.entry,
      })
  )
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
      :label="_label"
      :description="_description"
      :hint="_hint"
      :placeholder="_placeholder"
      :classes="{
        ..._classes,
        error: !!error || !!vuilessField.error,
      }"
      :styles="_styles"
      :optional="_optional"
      :disabled="_disabled"
      :hidden="_hidden"
      :type="type"
      :alt-action="altAction"
      :component="component"
      :v-name="name"
      :field="field"
      :options="_options"
      :max-length="maxLength"
      :required="!_optional"
      :autocomplete="autocomplete"
      :attrs="_attrs"
    >
    </slot>
  </VuilessField>
</template>
