<script setup lang="ts" generic="TFormData = any, TFormContext = any">
import { VuilessForm } from 'vuiless-forms'
import type { TVuilessState } from 'vuiless-forms'
import OoField from './oo-field.vue'
import { Foorm } from 'foorm'
import { computed, ref, type Component } from 'vue'
import { type TFoormFnScope, evalParameter } from 'foorm'
import { type TFoormComponentProps } from './types'

export interface Props<TF, TC> {
  form: Foorm
  formData?: TF
  formContext?: TC
  firstValidation?: TVuilessState<TF, TC>['firstValidation']
  components?: Record<string, Component<TFoormComponentProps<any, TF, TC>>>
  types?: Record<string, Component<TFoormComponentProps<any, TF, TC>>>
  errors?: Record<string, string | undefined>
}

const props = defineProps<Props<TFormData, TFormContext>>()

const executable = computed(() => {
  return props.form.executable()
})

const ctx = computed<TFoormFnScope>(
  () =>
    ({
      v: undefined,
      data: data.value,
      context: props.formContext,
      entry: props,
    }) as unknown as TFoormFnScope
)
const _data = ref<TFormData>({} as TFormData)
const data = computed<TFormData>(() => props.formData || (_data.value as TFormData))

function valueOrComputed<T>(v: T) {
  if (typeof v === 'function') {
    return computed(() => evalParameter(v, ctx.value))
  }
  return ref(v)
}

const _submitDisabled = valueOrComputed(executable.value.submit.disabled)

const _submitText = valueOrComputed(executable.value.submit.text)

const _title = valueOrComputed(executable.value.title)

function handleAction(name: string) {
  if (props.form.supportsAltAction(name)) {
    emit('action', name, data.value)
  } else {
    emit('unsupported-action', name, data.value)
  }
}

const emit = defineEmits<{
  (e: 'submit', data: TFormData): void
  (e: 'action', name: string, data: TFormData): void
  (e: 'unsupported-action', name: string, data: TFormData): void
}>()
</script>

<template>
  <VuilessForm
    :first-validation="firstValidation"
    @submit="emit('submit', $event)"
    :form-data="data"
    :form-context="formContext"
    v-slot="form"
  >
    <slot
      name="form.header"
      :clear-errors="form.clearErrors"
      :reset="form.reset"
      :title="_title"
      :formContext="formContext"
      :disabled="_submitDisabled"
    >
      <h2 v-if="!!_title">{{ _title }}</h2>
    </slot>
    <slot name="form.before" :clear-errors="form.clearErrors" :reset="form.reset"></slot>
    <OoField v-for="f of executable.entries" v-bind="f" v-slot="field" :error="errors?.[f.field]">
      <slot :name="`field:${field.type}`" v-bind="field">
        <component
          v-if="f.component && props.components?.[f.component]"
          :is="props.components[f.component]"
          :on-blur="field.onBlur"
          :error="field.error"
          :model="field.model"
          :form-data="field.formData"
          :form-context="field.formContext"
          :label="field.label"
          :description="field.description"
          :hint="field.hint"
          :placeholder="field.placeholder"
          :class="field.classes"
          :style="field.styles"
          :optional="field.optional"
          :required="!field.required"
          :disabled="field.disabled"
          :hidden="field.hidden"
          :type="field.type"
          :alt-action="field.altAction"
          :name="field.vName"
          :field="field"
          :options="field.options"
          :length="field.length"
          :autocomplete="field.autocomplete"
          @action="handleAction"
          v-bind="field.attrs"
          v-model="field.model.value"
        />

        <div v-else-if="f.component && !props.components?.[f.component]">
          [{{ field.label }}] Component "{{ field.component }}" not supplied
        </div>

        <component
          v-else-if="props.types?.[f.type!]"
          :is="props.types[f.type!]"
          :on-blur="field.onBlur"
          :error="field.error"
          :model="field.model"
          :form-data="field.formData"
          :form-context="field.formContext"
          :label="field.label"
          :description="field.description"
          :hint="field.hint"
          :placeholder="field.placeholder"
          :class="field.classes"
          :style="field.styles"
          :optional="field.optional"
          :required="!field.required"
          :disabled="field.disabled"
          :hidden="field.hidden"
          :type="field.type"
          :alt-action="field.altAction"
          :name="field.vName"
          :field="field"
          :options="field.options"
          :length="field.length"
          :autocomplete="field.autocomplete"
          @action="handleAction"
          v-bind="field.attrs"
          v-model="field.model.value"
        />

        <div
          class="oo-default-field"
          :class="field.classes"
          v-else-if="['text', 'password', 'number'].includes(field.type)"
        >
          <label>{{ field.label }}</label>
          <span v-if="!!field.description">{{ field.description }}</span>
          <input
            v-model="field.model.value"
            @blur="field.onBlur"
            :placeholder="field.placeholder"
            :autocomplete="field.autocomplete"
            :name="field.vName"
            :type="field.type"
          />
          <div class="oo-error-slot">{{ field.error || field.hint }}</div>
        </div>

        <p v-else-if="field.type === 'paragraph'">{{ field.description }}</p>

        <div v-else>
          [{{ field.label }}] Not supported field type "{{ field.type }}" {{ field.component }}
        </div>
      </slot>
    </OoField>
    <slot
      name="form.after"
      :clear-errors="form.clearErrors"
      :reset="form.reset"
      :disabled="_submitDisabled"
      :formContext="formContext"
    ></slot>

    <slot
      name="form.submit"
      :disabled="_submitDisabled"
      :text="_submitText"
      :clear-errors="form.clearErrors"
      :reset="form.reset"
      :formContext="formContext"
    >
      <button :disabled="_submitDisabled">{{ _submitText }}</button>
    </slot>
    <slot
      name="form.footer"
      :disabled="_submitDisabled"
      :clear-errors="form.clearErrors"
      :reset="form.reset"
      :formContext="formContext"
    ></slot>
  </VuilessForm>
</template>

<style>
.oo-default-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.oo-default-field.required label:after {
  content: ' *';
  color: red;
}
.oo-default-field.error input {
  outline: 1px solid red;
}

.oo-default-field .oo-error-slot {
  height: 14px;
  line-height: 12px;
  font-size: 12px;
}
.oo-default-field.error .oo-error-slot {
  color: red;
}
</style>
