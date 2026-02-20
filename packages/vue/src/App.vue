<script setup lang="ts">
import { ref, type Component } from 'vue'
import OoForm from '@/components/oo-form.vue'
import CustomStarInput from './app-components/custom-star-input.vue'
import CustomParagraph from './app-components/custom-paragraph.vue'
import CustomActionButton from './app-components/custom-action-button.vue'
import CustomTextInput from './app-components/custom-text-input.vue'
import CustomGroup from './app-components/custom-group.vue'
import CustomSelect from './app-components/custom-select.vue'
import {
  OoInput,
  OoSelect,
  OoRadio,
  OoCheckbox,
  OoParagraph,
  OoAction,
  OoObject,
  OoArray,
  OoUnion,
  OoTuple,
} from './components/default'
import { useFoorm } from '@/composables/use-foorm'
import { E2eTestForm } from './forms/e2e-test-form.as'
import { NestedForm } from './forms/nested-form.as'
import { ArrayForm, ArrayFormCustom } from './forms/array-form.as'
import { PlaygroundForm } from './forms/playground-form.as'

const { def, formData } = useFoorm(E2eTestForm)
const { def: nestedDef, formData: nestedFormData } = useFoorm(NestedForm)
const { def: arrayDef, formData: arrayFormData } = useFoorm(ArrayForm)
const { def: arrayCustomDef, formData: arrayCustomFormData } = useFoorm(ArrayFormCustom)
const { def: playgroundDef, formData: playgroundFormData } = useFoorm(PlaygroundForm)

const tabs = ['Playground', 'Basic', 'Nested', 'Array', 'Custom Array'] as const
const activeTab = ref<(typeof tabs)[number]>(tabs[0])

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
  object: OoObject,
  array: OoArray,
  union: OoUnion,
  tuple: OoTuple,
}

const customComponents = {
  CustomInput: CustomStarInput,
}

const arrayCustomComponents: Record<string, Component> = {
  CustomParagraph,
  CustomActionButton,
}

const arrayCustomTypes: Record<string, Component> = {
  ...defaultTypes,
  text: CustomTextInput,
  select: CustomSelect,
  object: CustomGroup,
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
    <nav class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </nav>

    <OoForm
      v-if="activeTab === 'Basic'"
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
      v-if="activeTab === 'Nested'"
      class="form"
      :def="nestedDef"
      :form-data="nestedFormData"
      :types="defaultTypes"
      first-validation="on-blur"
      @submit="handleSubmit"
      @error="onError"
    />
    <OoForm
      v-if="activeTab === 'Array'"
      class="form"
      :def="arrayDef"
      :form-data="arrayFormData"
      :form-context="arrayFormContext"
      :types="defaultTypes"
      first-validation="on-blur"
      @submit="handleSubmit"
      @action="handleAction"
      @error="onError"
    />
    <OoForm
      v-if="activeTab === 'Custom Array'"
      class="form"
      :def="arrayCustomDef"
      :form-data="arrayCustomFormData"
      :form-context="arrayFormContext"
      :components="arrayCustomComponents"
      :types="arrayCustomTypes"
      first-validation="on-blur"
      @submit="handleSubmit"
      @action="handleAction"
      @error="onError"
    />
    <OoForm
      v-if="activeTab === 'Playground'"
      class="form"
      :def="playgroundDef"
      :form-data="playgroundFormData"
      :types="defaultTypes"
      first-validation="on-blur"
      @submit="handleSubmit"
      @error="onError"
    />
  </main>
</template>

<style scoped>
main {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 48px 16px;
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #f3f4f6;
  border-radius: 8px;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.tab-btn:hover {
  color: #374151;
}

.tab-btn--active {
  background: #fff;
  color: #6366f1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 500px;
  max-width: 600px;
  width: 100%;
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.04);
}
</style>
