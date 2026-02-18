<script setup lang="ts" generic="TFormData = any, TFormContext = any">
import { useFoormForm } from '@foormjs/composables'
import type { TFoormState } from '@foormjs/composables'
import OoGroup from './oo-group.vue'
import type { FoormDef, TFoormFnScope } from '@foormjs/atscript'
import { getFormValidator, resolveFormProp, supportsAltAction } from '@foormjs/atscript'
import { computed, provide, ref, type Component } from 'vue'
import { type TFoormComponentProps } from './types'

export interface Props<TF, TC> {
  def: FoormDef
  formData?: TF
  formContext?: TC
  firstValidation?: TFoormState<TF, TC>['firstValidation']
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components?: Record<string, Component<TFoormComponentProps<any, TF, TC>>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  types?: Record<string, Component<TFoormComponentProps<any, TF, TC>>>
  errors?: Record<string, string | undefined>
}

const props = defineProps<Props<TFormData, TFormContext>>()

const _data = ref<TFormData>({} as TFormData)
const data = computed<TFormData>(() => props.formData || (_data.value as TFormData))

// ── Full-type validator (created once per def, called per-submit) ──
const formValidator = computed(() => getFormValidator(props.def))

// ── Foorm form composable ────────────────────────────────────
const { clearErrors, reset, submit, setErrors } = useFoormForm({
  formData: data,
  formContext: computed(() => props.formContext),
  firstValidation: computed(() => props.firstValidation),
  submitValidator: () =>
    formValidator.value({
      data: data.value as Record<string, unknown>,
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

// ── Form-level resolved props ──────────────────────────────
const ctx = computed<TFoormFnScope>(() => ({
  v: undefined,
  data: data.value as Record<string, unknown>,
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

// ── Action handler (provided to OoGroup tree) ──────────────
function handleAction(name: string) {
  if (supportsAltAction(props.def, name)) {
    emit('action', name, data.value)
  } else {
    emit('unsupported-action', name, data.value)
  }
}

provide('__foorm_action_handler', handleAction)

const emit = defineEmits<{
  (e: 'submit', data: TFormData): void
  (e: 'error', errors: { path: string; message: string }[]): void
  (e: 'action', name: string, data: TFormData): void
  (e: 'unsupported-action', name: string, data: TFormData): void
}>()

function onSubmit() {
  const result = submit()
  if (result === true) {
    emit('submit', data.value)
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

    <OoGroup :def="def" :components="components" :types="types" :errors="errors" />

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

<style>
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
