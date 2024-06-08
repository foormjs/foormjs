<script setup lang="ts" generic="TFormData, TFormContext">
import { evalFn, evalFnObj } from '../utils'
import { VuilessField, type TVuilessState } from 'vuiless-forms'
import { type TFoormFnScope, type TFoormEntryExecutable } from 'foorm'
import { computed, inject, type ComputedRef } from 'vue'

type Props = TFoormEntryExecutable & { error?: string }

const props = defineProps<Props>()

const vuiless = inject<ComputedRef<TVuilessState<TFormData, TFormContext>>>(
  'vuiless'
) as ComputedRef<TVuilessState<TFormData, TFormContext>>

const ctx = computed<TFoormFnScope>(
  () =>
    ({
      v: vuiless.value.formData[props.field as keyof TFormData],
      data: vuiless?.value.formData,
      context: vuiless?.value.formContext,
      entry: props,
    }) as TFoormFnScope
)

// description
const _label = computed(() => evalFn(props.label, ctx.value))
const _description = computed(() => evalFn(props.description, ctx.value))
const _hint = computed(() => evalFn(props.hint, ctx.value))
const _placeholder = computed(() => evalFn(props.placeholder, ctx.value))

// constraints
const _optional = computed(() => evalFn(props.optional, ctx.value))
const _disabled = computed(() => evalFn<boolean>(props.disabled, ctx.value))
const _hidden = computed(() => evalFn(props.hidden, ctx.value))

// options
const _options = computed(() => evalFn(props.options, ctx.value))

// appearance
const _classes = computed(() => {
  const v = evalFnObj(props.classes, ctx.value)
  if (typeof v === 'string') {
    return {
      [v]: true,
      disabled: _disabled.value,
      required: !_optional.value,
    }
  } else {
    return {
      ...(v || {}),
      disabled: _disabled.value,
      required: !_optional.value,
    }
  }
})

const _styles = computed(
  () => evalFnObj(props.styles, ctx.value) as string | Record<string, string>
)

const _attrs = computed(() => evalFnObj(props.attrs, ctx.value) as Record<string, string>)

// have to wrap validators into rule fn format
const rules = computed(() => {
  return props.validators?.map(
    fn => (v: string, data: TFormData, context: TFormContext) =>
      fn({
        v,
        data: data as Record<string, unknown>,
        context: context as Record<string, unknown>,
        entry: props as unknown as undefined,
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
      :length="length"
      :required="!_optional"
      :autocomplete="autocomplete"
      :attrs="_attrs"
    >
    </slot>
  </VuilessField>
</template>
