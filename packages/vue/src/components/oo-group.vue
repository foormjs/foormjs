<script setup lang="ts" generic="TFormData = any, TFormContext = any">
import type {
  FoormDef,
  FoormFieldDef,
  FoormArrayFieldDef,
  FoormGroupFieldDef,
  TFoormFnScope,
  TFoormEntryOptions,
} from 'foorm'
import {
  isArrayField,
  isGroupField,
  getFieldMeta,
  resolveFieldProp,
  resolveFormProp,
  getByPath,
} from 'foorm'
import { computed, inject, provide, type Component, type ComputedRef } from 'vue'
import type { TVuilessState } from 'vuiless-forms'
import OoField from './oo-field.vue'
// eslint-disable-next-line import/no-cycle -- OoGroup ↔ OoArray recursive component pattern
import OoArray from './oo-array.vue'
import type { TFoormComponentProps } from './types'

export interface OoGroupProps<TF, TC> {
  /** Field definitions to iterate. Required unless `field` is an array field. */
  def?: FoormDef
  /** Source field (for field-level title/component). Absent at top level. */
  field?: FoormFieldDef
  /** When provided, overrides parent vuiless formData (signals nested context). */
  formData?: unknown
  /** Custom named components map. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components?: Record<string, Component<TFoormComponentProps<any, TF, TC>>>
  /** Type-to-component map for default field rendering. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  types?: Record<string, Component<TFoormComponentProps<any, TF, TC>>>
  /** External error overrides (path → message). */
  errors?: Record<string, string | undefined>
  /** Validation error for this group/array field itself (e.g., minLength). */
  error?: string
  /** Whether this group is disabled. */
  disabled?: boolean
  /** Whether this group is hidden. */
  hidden?: boolean
}

const props = defineProps<OoGroupProps<TFormData, TFormContext>>()

// ── Vuiless context ────────────────────────────────────────
const parentVuiless = inject<ComputedRef<TVuilessState<TFormData, TFormContext>>>(
  'vuiless'
) as ComputedRef<TVuilessState<TFormData, TFormContext>>

// Override vuiless formData for nested groups/arrays.
// All fields still register with the root VuilessForm (register/unregister inherited).
if (props.formData !== undefined) {
  provide(
    'vuiless',
    computed(() => ({
      ...parentVuiless.value,
      formData: props.formData as TFormData,
    }))
  )
}

// ── Root data (for fn scopes) ──────────────────────────────
const rootData = inject<ComputedRef<TFormData>>(
  'oo-root-data',
  undefined as unknown as ComputedRef<TFormData>
)

// ── Action handler (provided by OoForm) ────────────────────
const handleAction = inject<(name: string) => void>('oo-action-handler', () => {})

// ── Current form data at this level ────────────────────────
const currentFormData = computed<Record<string, unknown>>(
  () => (props.formData ?? parentVuiless.value.formData) as Record<string, unknown>
)

// ── Mode detection ─────────────────────────────────────────
const arrayField =
  props.field && isArrayField(props.field) ? (props.field as FoormArrayFieldDef) : undefined

const groupField =
  props.field && isGroupField(props.field) ? (props.field as FoormGroupFieldDef) : undefined

// Effective def: groupDef for group fields, or the provided def
const effectiveDef = groupField?.groupDef ?? props.def

// ── Title resolution ───────────────────────────────────────
const title = computed(() => {
  const scope: TFoormFnScope = {
    v: undefined,
    data: (rootData?.value ?? parentVuiless.value.formData) as Record<string, unknown>,
    context: (parentVuiless.value.formContext ?? {}) as Record<string, unknown>,
    entry: undefined,
  }

  if (props.field) {
    return resolveFieldProp<string>(props.field.prop, 'foorm.fn.title', 'foorm.title', scope)
  }
  if (props.def) {
    return resolveFormProp<string>(props.def.type, 'foorm.fn.title', 'foorm.title', scope)
  }
  return undefined
})

// ── Component delegation (field-level @foorm.component) ────
const componentName = props.field
  ? getFieldMeta<string>(props.field.prop, 'foorm.component')
  : undefined

const customComponent = computed(() => {
  if (componentName && props.components?.[componentName]) {
    return props.components[componentName]
  }
  return undefined
})

// ── Model value (for custom component delegation) ──────────
const modelValue = computed(() => {
  if (!props.field) return undefined
  return getByPath(parentVuiless.value.formData as Record<string, unknown>, props.field.path)
})

// ── Error path helpers ─────────────────────────────────────
function getSubErrors(fieldPath: string): Record<string, string | undefined> | undefined {
  if (!props.errors) return undefined
  const prefix = `${fieldPath}.`
  const result: Record<string, string | undefined> = {}
  let hasErrors = false
  for (const [key, value] of Object.entries(props.errors) as [string, string | undefined][]) {
    if (key.startsWith(prefix)) {
      result[key.slice(prefix.length)] = value
      hasErrors = true
    }
  }
  return hasErrors ? result : undefined
}

// ── Sub-field helpers (for field iteration) ─────────────────
function getGroupDef(f: FoormFieldDef): FoormDef | undefined {
  if (isGroupField(f)) return (f as FoormGroupFieldDef).groupDef
  return undefined
}

function getSubData(f: FoormFieldDef): unknown {
  return getByPath(currentFormData.value, f.path)
}

// ── Option helpers ─────────────────────────────────────────
function optKey(opt: TFoormEntryOptions): string {
  return typeof opt === 'string' ? opt : opt.key
}

function optLabel(opt: TFoormEntryOptions): string {
  return typeof opt === 'string' ? opt : opt.label
}
</script>

<template>
  <div :class="{ 'oo-group': !!field }" v-show="!field || !hidden">
    <!-- Title -->
    <div class="oo-group-header" v-if="title">
      <h2 v-if="!field" class="oo-form-title">{{ title }}</h2>
      <h3 v-else class="oo-group-title">{{ title }}</h3>
    </div>

    <!-- Group-level error (arrays handle their own error below the add button) -->
    <div v-if="error && !arrayField" class="oo-group-error">{{ error }}</div>

    <!-- Custom component delegation (@foorm.component on field) -->
    <component
      v-if="customComponent"
      :is="customComponent"
      :field="field"
      :model="{ value: modelValue }"
      :form-data="parentVuiless.formData"
      :form-context="parentVuiless.formContext"
      :disabled="disabled"
      :hidden="hidden"
      :errors="field ? getSubErrors(field.path) : errors"
    />

    <!-- Missing custom component warning -->
    <div v-else-if="componentName && !customComponent">
      [{{ title || field?.name }}] Component "{{ componentName }}" not supplied
    </div>

    <!-- Array field → delegate to OoArray -->
    <OoArray
      v-else-if="arrayField"
      :field="arrayField"
      :components="components"
      :types="types"
      :errors="errors"
      :error="error"
      :disabled="disabled"
    />

    <!-- Field list (group or top-level) -->
    <template v-else-if="effectiveDef">
      <OoField
        v-for="f of effectiveDef.fields"
        :key="f.path"
        :field="f"
        v-slot="field"
        :error="errors?.[f.path]"
      >
        <!-- Array or Group sub-field → nested OoGroup -->
        <OoGroup
          v-if="field.type === 'array' || field.type === 'group'"
          :field="f"
          :def="getGroupDef(f)"
          :form-data="field.type === 'group' ? getSubData(f) : undefined"
          :components="components"
          :types="types"
          :errors="errors"
          :error="field.error"
          :disabled="field.disabled"
          :hidden="field.hidden"
        />

        <!-- Custom named component (@foorm.component) -->
        <component
          v-else-if="field.component && components?.[field.component]"
          :is="components[field.component]"
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

        <div v-else-if="field.component && !components?.[field.component]">
          [{{ field.label }}] Component "{{ field.component }}" not supplied
        </div>

        <!-- Custom type component (types prop) -->
        <component
          v-else-if="types?.[field.type]"
          :is="types[field.type]"
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

        <!-- Default: text/password/number input -->
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

        <!-- Default: paragraph -->
        <p v-else-if="field.type === 'paragraph'">{{ field.value }}</p>

        <!-- Default: select -->
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

        <!-- Default: radio -->
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

        <!-- Default: checkbox -->
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

        <!-- Default: action button -->
        <div
          class="oo-default-field oo-action-field"
          :class="field.classes"
          v-else-if="field.type === 'action'"
        >
          <button type="button" @click="handleAction(field.altAction!)">
            {{ field.label }}
          </button>
        </div>

        <!-- Unsupported type fallback -->
        <div v-else>
          [{{ field.label }}] Not supported field type "{{ field.type }}" {{ field.component }}
        </div>
      </OoField>
    </template>
  </div>
</template>

<style>
.oo-group {
  margin: 8px 0;
  padding-left: 12px;
  border-left: 2px solid #e5e7eb;
}

.oo-group-header {
  margin-bottom: 8px;
}

.oo-form-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.oo-group-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.oo-group-error {
  font-size: 12px;
  color: #ef4444;
  margin-bottom: 4px;
}

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
</style>
