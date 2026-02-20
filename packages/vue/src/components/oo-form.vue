<script setup lang="ts" generic="TFormData = any, TFormContext = any">
import { useFoormForm } from '@foormjs/composables'
import type { TFoormState } from '@foormjs/composables'
import OoField from './oo-field.vue'
import type { FoormDef, TFoormFnScope } from '@foormjs/atscript'
import { getFormValidator, resolveFormProp, supportsAltAction } from '@foormjs/atscript'
import { computed, provide, ref, toRaw, type Component } from 'vue'
import type { TFoormChangeType, TFoormComponentProps, TFoormTypeComponents } from './types'

export interface Props<TF, TC> {
  def: FoormDef
  formData?: TF
  formContext?: TC
  firstValidation?: TFoormState['firstValidation']
  components?: Record<string, Component<TFoormComponentProps>>
  /**
   * Type-to-component map for field rendering. Maps field types to Vue components.
   * Must include entries for all built-in field types. Use `createDefaultTypes()`
   * for a pre-filled map, or supply your own.
   */
  types: TFoormTypeComponents
  errors?: Record<string, string | undefined>
}

const props = defineProps<Props<TFormData, TFormContext>>()

const _data = ref<TFormData>({} as TFormData)
const data = computed<TFormData>(() => props.formData || (_data.value as TFormData))

/**
 * Unwraps domain data from the form data container.
 * Form data is `{ value: domainData }` — getByPath/setByPath handle this
 * wrapper automatically, but scope/validator callers need the inner value.
 */
function getDomainData(): Record<string, unknown> {
  return (data.value as Record<string, unknown>).value as Record<string, unknown>
}

// ── Full-type validator (created once per def, called per-submit) ──
const formValidator = computed(() => getFormValidator(props.def))

// ── Foorm form composable ────────────────────────────────────
const { clearErrors, reset, submit, setErrors } = useFoormForm({
  formData: data,
  formContext: computed(() => props.formContext),
  firstValidation: computed(() => props.firstValidation),
  submitValidator: () =>
    formValidator.value({
      data: getDomainData(),
      context: (props.formContext ?? {}) as Record<string, unknown>,
    }),
})

// ── Provides ────────────────────────────────────────────────
provide(
  '__foorm_root_data',
  computed<TFormData>(() => data.value)
)
provide(
  '__foorm_path_prefix',
  computed(() => '')
)
provide(
  '__foorm_types',
  computed(() => props.types)
)
provide(
  '__foorm_components',
  computed(() => props.components)
)
provide(
  '__foorm_errors',
  computed(() => props.errors)
)

// ── Form-level resolved props ──────────────────────────────
const ctx = computed<TFoormFnScope>(() => ({
  v: undefined,
  data: getDomainData(),
  context: (props.formContext ?? {}) as Record<string, unknown>,
  entry: undefined,
}))

const _submitText = computed(
  () =>
    resolveFormProp<string>(
      props.def.type,
      'foorm.fn.submit.text',
      'foorm.submit.text',
      ctx.value
    ) ?? 'Submit'
)
const _submitDisabled = computed(
  () =>
    resolveFormProp<boolean>(
      props.def.type,
      'foorm.fn.submit.disabled',
      'foorm.submit.disabled',
      ctx.value
    ) ?? false
)

const emit = defineEmits<{
  (e: 'submit', data: TFormData): void
  (e: 'error', errors: { path: string; message: string }[]): void
  (e: 'action', name: string, data: TFormData): void
  (e: 'unsupported-action', name: string, data: TFormData): void
  (e: 'change', type: TFoormChangeType, path: string, value: unknown, formData: TFormData): void
}>()

// ── Action handler (provided to OoField tree) ──────────────
const domainData = () => toRaw(getDomainData()) as TFormData

function handleAction(name: string) {
  if (supportsAltAction(props.def, name)) {
    emit('action', name, domainData())
  } else {
    emit('unsupported-action', name, domainData())
  }
}

provide('__foorm_action_handler', handleAction)

function handleChange(type: TFoormChangeType, path: string, value: unknown) {
  emit('change', type, path, value, domainData())
}
provide('__foorm_change_handler', handleChange)

function onSubmit() {
  const result = submit()
  if (result === true) {
    emit('submit', domainData())
  } else {
    emit('error', result)
  }
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <slot
      name="form.header"
      :clear-errors="clearErrors"
      :reset="reset"
      :set-errors="setErrors"
      :formContext="formContext"
      :disabled="_submitDisabled"
    >
    </slot>
    <slot
      name="form.before"
      :clear-errors="clearErrors"
      :reset="reset"
      :set-errors="setErrors"
    ></slot>

    <OoField :field="def.rootField" />

    <slot
      name="form.after"
      :clear-errors="clearErrors"
      :reset="reset"
      :set-errors="setErrors"
      :disabled="_submitDisabled"
      :formContext="formContext"
    ></slot>

    <slot
      name="form.submit"
      :disabled="_submitDisabled"
      :text="_submitText"
      :clear-errors="clearErrors"
      :reset="reset"
      :set-errors="setErrors"
      :formContext="formContext"
    >
      <button :disabled="_submitDisabled">{{ _submitText }}</button>
    </slot>
    <slot
      name="form.footer"
      :disabled="_submitDisabled"
      :clear-errors="clearErrors"
      :reset="reset"
      :set-errors="setErrors"
      :formContext="formContext"
    ></slot>
  </form>
</template>
