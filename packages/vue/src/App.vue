<script setup lang="ts">
import type { Component } from 'vue'
import OoForm from '@/components/oo-form.vue'
import CustomStarInput from './app-components/custom-star-input.vue'
import CustomAddButton from './app-components/custom-add-button.vue'
import CustomVariantPicker from './app-components/custom-variant-picker.vue'
import CustomParagraph from './app-components/custom-paragraph.vue'
import CustomActionButton from './app-components/custom-action-button.vue'
import CustomTextInput from './app-components/custom-text-input.vue'
import CustomGroup from './app-components/custom-group.vue'
import CustomSelect from './app-components/custom-select.vue'
import { OoInput, OoSelect, OoRadio, OoCheckbox, OoParagraph, OoAction } from './components/default'
import { useFoorm } from '@/composables/use-foorm'
import { E2eTestForm } from './forms/e2e-test-form.as'
import { NestedForm } from './forms/nested-form.as'
import { ArrayForm, ArrayFormCustom } from './forms/array-form.as'
const { def, formData } = useFoorm(E2eTestForm)
const { def: nestedDef, formData: nestedFormData } = useFoorm(NestedForm)
const { def: arrayDef, formData: arrayFormData } = useFoorm(ArrayForm)
const { def: arrayCustomDef, formData: arrayCustomFormData } = useFoorm(ArrayFormCustom)

const categoryPool = [
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend' },
  { key: 'devops', label: 'DevOps' },
  { key: 'design', label: 'Design' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'data', label: 'Data Science' },
  { key: 'security', label: 'Security' },
  { key: 'qa', label: 'QA / Testing' },
  { key: 'ml', label: 'Machine Learning' },
  { key: 'infra', label: 'Infrastructure' },
]

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

const categoryOptions = pickRandom(categoryPool, 3 + Math.floor(Math.random() * 5))

const formContext = {
  cityOptions: [
    { key: 'nyc', label: 'New York' },
    { key: 'la', label: 'Los Angeles' },
    { key: 'chi', label: 'Chicago' },
  ],
  labels: {
    contextLabel: 'Context-Driven Label',
  },
  descriptions: {
    contextDescription: 'This label and description come from nested context object',
  },
}

const arrayFormContext = {
  categoryOptions,
}

const defaultTypes: Record<string, Component> = {
  text: OoInput,
  password: OoInput,
  number: OoInput,
  select: OoSelect,
  radio: OoRadio,
  checkbox: OoCheckbox,
  paragraph: OoParagraph,
  action: OoAction,
}

const customComponents = {
  CustomInput: CustomStarInput,
}

const arrayCustomComponents: Record<string, Component> = {
  CustomAddButton,
  CustomVariantPicker,
  CustomParagraph,
  CustomActionButton,
}

const arrayCustomTypes: Record<string, Component> = {
  ...defaultTypes,
  text: CustomTextInput,
  select: CustomSelect,
}

function handleSubmit(d: unknown) {
  console.log('submit', d)
}

function handleAction(name: string, d: unknown) {
  console.log('action', name, d)
}

function onError(e: unknown) {
  console.log('error', e)
}
</script>

<template>
  <main>
    <OoForm
      class="form"
      :def="def"
      :form-data="formData"
      :form-context="formContext"
      :components="customComponents"
      :types="defaultTypes"
      first-validation="on-blur"
      @submit="handleSubmit"
      @action="handleAction"
      @error="onError"
    />
    <OoForm
      class="form"
      :def="nestedDef"
      :form-data="nestedFormData"
      :types="defaultTypes"
      first-validation="on-blur"
      @submit="handleSubmit"
      @error="onError"
    />
    <OoForm
      class="form"
      :def="arrayDef"
      :form-data="arrayFormData"
      :form-context="arrayFormContext"
      :types="defaultTypes"
      first-validation="on-blur"
      @submit="handleSubmit"
      @error="onError"
    />
    <OoForm
      class="form"
      :def="arrayCustomDef"
      :form-data="arrayCustomFormData"
      :form-context="arrayFormContext"
      :components="arrayCustomComponents"
      :types="arrayCustomTypes"
      :group-component="CustomGroup"
      first-validation="on-blur"
      @submit="handleSubmit"
      @action="handleAction"
      @error="onError"
    />
  </main>
</template>

<style scoped>
main {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 48px 16px;
  overflow-x: auto;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 500px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.04);
}
</style>
