<script setup lang="ts" generic="TFormData = any, TFormContext = any">
import type {
  FoormDef,
  FoormFieldDef,
  FoormArrayFieldDef,
  FoormGroupFieldDef,
  TFoormFnScope,
  TFoormEntryOptions,
} from '@foormjs/atscript'
import {
  isArrayField,
  isGroupField,
  getFieldMeta,
  resolveFieldProp,
  resolveFormProp,
  getByPath,
  setByPath,
  foormValidatorPlugin,
} from '@foormjs/atscript'
import { Validator } from '@atscript/typescript/utils'
import { computed, inject, provide, type Component, type ComputedRef } from 'vue'
import { useFoormField } from '@foormjs/composables'
import OoField from './oo-field.vue'
// eslint-disable-next-line import/no-cycle -- OoGroup ↔ OoArray recursive component pattern
import OoArray from './oo-array.vue'
import type { TFoormComponentProps } from './types'

export interface OoGroupProps<TF, TC> {
  /** Field definitions to iterate. Required unless `field` is an array field. */
  def?: FoormDef
  /** Source field (for field-level title/component). Absent at top level. */
  field?: FoormFieldDef
  /** Explicit path prefix from OoArray (per-item index). */
  pathPrefix?: string
  /** Custom named components map. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components?: Record<string, Component<TFoormComponentProps<any, TF, TC>>>
  /** Type-to-component map for default field rendering. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  types?: Record<string, Component<TFoormComponentProps<any, TF, TC>>>
  /** Custom group wrapper component. */
  groupComponent?: Component
  /** External error overrides (path → message). */
  errors?: Record<string, string | undefined>
  /** Whether this group is disabled. */
  disabled?: boolean
  /** Whether this group is hidden. */
  hidden?: boolean
  /** Callback to remove this item from its parent array. */
  onRemove?: () => void
  /** Whether removal is allowed (respects minLength constraints). */
  canRemove?: boolean
  /** Label for the remove button (from `@foorm.array.remove.label`). */
  removeLabel?: string
}

const props = defineProps<OoGroupProps<TFormData, TFormContext>>()

// ── Root data (for fn scopes and model access) ──────────────
const rootData = inject<ComputedRef<TFormData>>(
  '__foorm_root_data',
  undefined as unknown as ComputedRef<TFormData>
)

function rootFormData(): Record<string, unknown> {
  return (rootData?.value ?? {}) as Record<string, unknown>
}

// ── Path prefix ─────────────────────────────────────────────
const parentPrefix = inject<ComputedRef<string>>(
  '__foorm_path_prefix',
  computed(() => '')
)
const myPrefix = computed(() => {
  if (props.pathPrefix !== undefined)
    return parentPrefix.value ? `${parentPrefix.value}.${props.pathPrefix}` : props.pathPrefix
  if (props.field?.path !== undefined)
    return parentPrefix.value ? `${parentPrefix.value}.${props.field.path}` : props.field.path
  return parentPrefix.value
})
provide('__foorm_path_prefix', myPrefix)

// ── Action handler (provided by OoForm) ────────────────────
const handleAction = inject<(name: string) => void>('__foorm_action_handler', () => {})

// ── Mode detection ─────────────────────────────────────────
const arrayField =
  props.field && isArrayField(props.field) ? (props.field as FoormArrayFieldDef) : undefined

const groupField =
  props.field && isGroupField(props.field) ? (props.field as FoormGroupFieldDef) : undefined

// Effective def: groupDef for group fields, or the provided def.
// Must be computed — props.def can change (e.g. union array variant switches).
const effectiveDef = computed(() => groupField?.groupDef ?? props.def)

// ── Self-registration for array/group validation ────────────
let selfError: ComputedRef<string | undefined> | undefined

if (props.field && (arrayField || groupField)) {
  const fieldProp = props.field.prop
  const validatorPlugin = foormValidatorPlugin()
  let cachedValidator: InstanceType<typeof Validator> | undefined

  function selfValidationRule(v: unknown) {
    cachedValidator ??= new Validator(fieldProp, { plugins: [validatorPlugin] })
    const isValid = cachedValidator.validate(v, true)
    if (!isValid) {
      // Only report root-level errors (path === ''); child errors handled by their own fields
      const rootError = cachedValidator.errors?.find(e => e.path === '')
      if (rootError) return rootError.message
      return true
    }
    return true
  }

  const { error } = useFoormField({
    getValue: () => getByPath(rootFormData(), myPrefix.value),
    setValue: (v: unknown) => setByPath(rootFormData(), myPrefix.value, v),
    rules: [selfValidationRule],
    path: () => myPrefix.value,
    resetValue: arrayField ? [] : {},
  })
  selfError = error
}

// ── Title resolution ───────────────────────────────────────
const title = computed(() => {
  const scope: TFoormFnScope = {
    v: undefined,
    data: rootFormData(),
    context: {} as Record<string, unknown>,
    entry: undefined,
  }

  if (props.field) {
    return (
      resolveFieldProp<string>(props.field.prop, 'foorm.fn.title', 'foorm.title', scope) ??
      getFieldMeta<string>(props.field.prop, 'meta.label')
    )
  }
  if (props.def) {
    return resolveFormProp<string>(props.def.type, 'foorm.fn.title', 'foorm.title', scope)
  }
  return undefined
})

// ── Remove button placement ────────────────────────────────
// Primitive wrapper: single field with path=undefined (e.g. primitive array item).
// For these, pass onRemove to OoField for inline rendering.
// For objects (multiple fields), render remove in the header.
const isPrimitiveWrapper = computed(() => {
  const d = effectiveDef.value
  return !!d && d.fields.length === 1 && d.fields[0].path === undefined
})

// ── Custom group component ──────────────────────────────────
const useCustomGroup = computed(
  () => !!props.groupComponent && (!!props.field || props.pathPrefix !== undefined)
)

const renderRemoveInHeader = computed(
  () => !!props.onRemove && !isPrimitiveWrapper.value && !useCustomGroup.value
)
const passRemoveToFields = computed(
  () => !!props.onRemove && isPrimitiveWrapper.value && !useCustomGroup.value
)

// ── Absolute path helper for error lookup ───────────────────
function absoluteFieldPath(f: FoormFieldDef): string | undefined {
  if (f.path === undefined) return myPrefix.value || undefined
  return myPrefix.value ? `${myPrefix.value}.${f.path}` : f.path
}

// ── Sub-field helpers (for field iteration) ─────────────────
function getGroupDef(f: FoormFieldDef): FoormDef | undefined {
  if (isGroupField(f)) return (f as FoormGroupFieldDef).groupDef
  return undefined
}

function fieldHasComponent(f: FoormFieldDef): boolean {
  return getFieldMeta<string>(f.prop, 'foorm.component') !== undefined
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
  <component
    :is="useCustomGroup ? groupComponent! : 'div'"
    v-bind="
      useCustomGroup
        ? {
            title,
            error: !arrayField ? selfError : undefined,
            onRemove,
            canRemove,
            removeLabel,
            disabled,
          }
        : undefined
    "
    :class="useCustomGroup ? 'oo-custom-group' : { 'oo-group': !!field }"
    v-show="!field || !hidden"
  >
    <!-- Default header (only when NOT using custom group) -->
    <div class="oo-group-header" v-if="!useCustomGroup && (title || renderRemoveInHeader)">
      <div class="oo-group-header-content">
        <h2 v-if="title && !field" class="oo-form-title">{{ title }}</h2>
        <h3 v-else-if="title" class="oo-group-title">{{ title }}</h3>
      </div>
      <button
        v-if="renderRemoveInHeader"
        type="button"
        class="oo-group-remove-btn"
        :disabled="!canRemove"
        @click="onRemove"
      >
        {{ removeLabel || 'Remove' }}
      </button>
    </div>

    <!-- Group-level error (only when NOT using custom group; custom group receives it as prop) -->
    <div v-if="!useCustomGroup && selfError && !arrayField" class="oo-group-error">
      {{ selfError }}
    </div>

    <!-- Array field → delegate to OoArray -->
    <OoArray
      v-if="arrayField"
      :field="arrayField"
      :components="components"
      :types="types"
      :group-component="groupComponent"
      :errors="errors"
      :error="selfError"
      :disabled="disabled"
    />

    <!-- Field list (group or top-level) -->
    <template v-else-if="effectiveDef">
      <template v-for="f of effectiveDef.fields" :key="f.path ?? f.name">
        <!-- Array or Group sub-field WITHOUT @foorm.component → nested OoGroup -->
        <OoGroup
          v-if="!fieldHasComponent(f) && (f.type === 'array' || f.type === 'group')"
          :field="f"
          :def="getGroupDef(f)"
          :components="components"
          :types="types"
          :group-component="groupComponent"
          :errors="errors"
          :disabled="disabled"
          :hidden="hidden"
        />

        <!-- Everything else → OoField (handles custom component + default templates) -->
        <OoField
          v-else
          :field="f"
          :on-remove="passRemoveToFields ? onRemove : undefined"
          :can-remove="passRemoveToFields ? canRemove : undefined"
          :remove-label="passRemoveToFields ? removeLabel : undefined"
          v-slot="field"
          :error="errors?.[absoluteFieldPath(f)!]"
        >
          <!-- Custom named component (@foorm.component) — terminal delegation -->
          <component
            v-if="field.component && components?.[field.component]"
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
            :required="field.required"
            :disabled="field.disabled"
            :hidden="field.hidden"
            :type="field.type"
            :alt-action="field.altAction"
            :name="field.vName"
            :field="field"
            :options="field.options"
            :max-length="field.maxLength"
            :autocomplete="field.autocomplete"
            :on-remove="field.onRemove"
            :can-remove="field.canRemove"
            :remove-label="field.removeLabel"
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
            :required="field.required"
            :disabled="field.disabled"
            :hidden="field.hidden"
            :type="field.type"
            :alt-action="field.altAction"
            :name="field.vName"
            :field="field"
            :options="field.options"
            :max-length="field.maxLength"
            :autocomplete="field.autocomplete"
            :on-remove="field.onRemove"
            :can-remove="field.canRemove"
            :remove-label="field.removeLabel"
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
            <label v-if="!isPrimitiveWrapper">{{ field.label }}</label>
            <span v-if="!!field.description && !isPrimitiveWrapper">{{ field.description }}</span>
            <div class="oo-field-input-row">
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
              <button
                v-if="field.onRemove"
                type="button"
                class="oo-array-inline-remove"
                :disabled="!field.canRemove"
                @click="field.onRemove"
              >
                {{ field.removeLabel || '\u00d7' }}
              </button>
            </div>
            <div v-if="!isPrimitiveWrapper || field.error" class="oo-error-slot">
              {{ field.error || field.hint }}
            </div>
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
            <label v-if="!isPrimitiveWrapper">{{ field.label }}</label>
            <span v-if="!!field.description && !isPrimitiveWrapper">{{ field.description }}</span>
            <div class="oo-field-input-row">
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
              <button
                v-if="field.onRemove"
                type="button"
                class="oo-array-inline-remove"
                :disabled="!field.canRemove"
                @click="field.onRemove"
              >
                {{ field.removeLabel || '\u00d7' }}
              </button>
            </div>
            <div v-if="!isPrimitiveWrapper || field.error" class="oo-error-slot">
              {{ field.error || field.hint }}
            </div>
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
    </template>

    <!-- Slot fallback: when no def and no field (pure prefix provider for primitive array items) -->
    <slot v-else></slot>
  </component>
</template>

<style>
.oo-group,
.oo-custom-group {
  margin: 8px 0;
}

.oo-array-item > .oo-group,
.oo-array-item > .oo-custom-group {
  margin: 0;
}

.oo-group {
  padding-left: 12px;
  border-left: 2px solid #e5e7eb;
}

.oo-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.oo-group-header-content {
  flex: 1;
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

.oo-group-remove-btn {
  padding: 4px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
}

.oo-group-remove-btn:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.oo-group-remove-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.oo-group-error {
  font-size: 12px;
  color: #ef4444;
  margin-bottom: 4px;
}

.oo-field-input-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.oo-field-input-row > input,
.oo-field-input-row > select {
  flex: 1;
}

.oo-array-inline-remove {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1;
}

.oo-array-inline-remove:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.oo-array-inline-remove:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.oo-default-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
}

/* Compact style for primitive array items — no label, minimal spacing */
.oo-array-item--primitive .oo-default-field {
  margin-bottom: 0;
  gap: 2px;
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
