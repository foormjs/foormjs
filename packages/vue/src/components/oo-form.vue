<script setup lang="ts" generic="TFormData = any, TFormContext = any">
import { VuilessForm } from 'vuiless-forms'
import type { TVuilessState } from 'vuiless-forms'
import OoField from './oo-field.vue'
import {
  type TFoormModel,
  type TFoormFnScope,
  type TFoormEntryOptions,
  evalComputed,
  supportsAltAction,
} from 'foorm'
import { computed, ref, type Component } from 'vue'
import { type TFoormComponentProps } from './types'

export interface Props<TF, TC> {
  form: TFoormModel
  formData?: TF
  formContext?: TC
  firstValidation?: TVuilessState<TF, TC>['firstValidation']
  components?: Record<string, Component<TFoormComponentProps<any, TF, TC>>>
  types?: Record<string, Component<TFoormComponentProps<any, TF, TC>>>
  errors?: Record<string, string | undefined>
}

const props = defineProps<Props<TFormData, TFormContext>>()

const _data = ref<TFormData>({} as TFormData)
const data = computed<TFormData>(() => props.formData || (_data.value as TFormData))

const ctx = computed<TFoormFnScope>(() => ({
  v: undefined,
  data: data.value as Record<string, unknown>,
  context: (props.formContext ?? {}) as Record<string, unknown>,
  entry: undefined,
}))

const _title = computed(() => evalComputed(props.form.title, ctx.value))
const _submitText = computed(() => evalComputed(props.form.submit.text, ctx.value))
const _submitDisabled = computed(() => evalComputed(props.form.submit.disabled, ctx.value))

function handleAction(name: string) {
  if (supportsAltAction(props.form, name)) {
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

function optKey(opt: TFoormEntryOptions): string {
  return typeof opt === 'string' ? opt : opt.key
}

function optLabel(opt: TFoormEntryOptions): string {
  return typeof opt === 'string' ? opt : opt.label
}
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
    <OoField
      v-for="f of props.form.fields"
      :key="f.field"
      v-bind="f"
      v-slot="field"
      :error="errors?.[f.field]"
    >
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
          :max-length="field.maxLength"
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
          :max-length="field.maxLength"
          :autocomplete="field.autocomplete"
          @action="handleAction"
          v-bind="field.attrs"
          v-model="field.model.value"
        />

        <div
          class="oo-default-field"
          :class="field.classes"
          v-else-if="['text', 'password', 'number'].includes(field.type)"
          v-show="!field.hidden"
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
            :disabled="field.disabled"
            :readonly="field.readonly"
            v-bind="field.attrs"
          />
          <div class="oo-error-slot">{{ field.error || field.hint }}</div>
        </div>

        <p v-else-if="field.type === 'paragraph'">{{ field.description }}</p>

        <div
          class="oo-default-field"
          :class="field.classes"
          v-else-if="field.type === 'select'"
          v-show="!field.hidden"
        >
          <label>{{ field.label }}</label>
          <span v-if="!!field.description">{{ field.description }}</span>
          <select
            v-model="field.model.value"
            @blur="field.onBlur"
            :name="field.vName"
            :disabled="field.disabled"
            :readonly="field.readonly"
            v-bind="field.attrs"
          >
            <option v-if="field.placeholder" value="" disabled>{{ field.placeholder }}</option>
            <option v-for="opt in field.options" :key="optKey(opt)" :value="optKey(opt)">
              {{ optLabel(opt) }}
            </option>
          </select>
          <div class="oo-error-slot">{{ field.error || field.hint }}</div>
        </div>

        <div
          class="oo-default-field oo-radio-field"
          :class="field.classes"
          v-else-if="field.type === 'radio'"
          v-show="!field.hidden"
        >
          <span class="oo-field-label">{{ field.label }}</span>
          <span v-if="!!field.description">{{ field.description }}</span>
          <div class="oo-radio-group">
            <label v-for="opt in field.options" :key="optKey(opt)">
              <input
                type="radio"
                :value="optKey(opt)"
                v-model="field.model.value"
                @blur="field.onBlur"
                :name="field.vName"
                :disabled="field.disabled"
                :readonly="field.readonly"
                v-bind="field.attrs"
              />
              {{ optLabel(opt) }}
            </label>
          </div>
          <div class="oo-error-slot">{{ field.error || field.hint }}</div>
        </div>

        <div
          class="oo-default-field oo-checkbox-field"
          :class="field.classes"
          v-else-if="field.type === 'checkbox'"
          v-show="!field.hidden"
        >
          <label>
            <input
              type="checkbox"
              v-model="field.model.value"
              @blur="field.onBlur"
              :name="field.vName"
              :disabled="field.disabled"
              :readonly="field.readonly"
              v-bind="field.attrs"
            />
            {{ field.label }}
          </label>
          <span v-if="!!field.description">{{ field.description }}</span>
          <div class="oo-error-slot">{{ field.error || field.hint }}</div>
        </div>

        <div
          class="oo-default-field oo-action-field"
          :class="field.classes"
          v-else-if="field.type === 'action'"
        >
          <button type="button" @click="handleAction(field.altAction!)">
            {{ field.label }}
          </button>
        </div>

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
  margin-bottom: 4px;
}

.oo-default-field label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.oo-default-field.required label::after {
  content: ' *';
  color: #ef4444;
}

.oo-default-field span {
  font-size: 12px;
  color: #6b7280;
}

.oo-default-field input,
.oo-default-field select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #1d1d1f;
  background: #fff;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  outline: none;
}

.oo-default-field input::placeholder {
  color: #9ca3af;
}

.oo-default-field input:focus,
.oo-default-field select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.oo-default-field input:disabled,
.oo-default-field select:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.oo-default-field.error input,
.oo-default-field.error select {
  border-color: #ef4444;
}

.oo-default-field.error input:focus,
.oo-default-field.error select:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.oo-default-field .oo-field-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.oo-radio-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.oo-radio-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 400;
  color: #1d1d1f;
  cursor: pointer;
}

.oo-radio-group input[type='radio'] {
  padding: 0;
  border: none;
  box-shadow: none;
}

.oo-checkbox-field > label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 400;
  color: #1d1d1f;
  cursor: pointer;
}

.oo-checkbox-field > label input[type='checkbox'] {
  padding: 0;
  border: none;
  box-shadow: none;
}

.oo-default-field .oo-error-slot {
  min-height: 16px;
  line-height: 16px;
  font-size: 12px;
  color: #6b7280;
}

.oo-default-field.error .oo-error-slot {
  color: #ef4444;
}

.oo-default-field.oo-action-field button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.oo-default-field.oo-action-field button:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

h2 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

p {
  margin: 0 0 4px;
  font-size: 14px;
  color: #6b7280;
}

button[type='submit'],
button:not([type]) {
  margin-top: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #6366f1;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

button[type='submit']:hover,
button:not([type]):hover {
  background: #4f46e5;
}

button[type='submit']:disabled,
button:not([type]):disabled {
  background: #c7d2fe;
  cursor: not-allowed;
}
</style>
