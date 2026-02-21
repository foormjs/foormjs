<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useFoormForm } from './composables/use-foorm-form'
import type { TFoormRule, TFoormState } from './types'
import DemoField from './DemoField.vue'

// ---------------------------------------------------------------------------
// Form data
// ---------------------------------------------------------------------------
const formData = reactive({
  name: '',
  email: '',
  age: '',
  message: '',
})

const firstValidation = ref<TFoormState['firstValidation']>('on-blur')

// ---------------------------------------------------------------------------
// Form composable — provides form state to child DemoField components
// ---------------------------------------------------------------------------
const { submit, reset, clearErrors, setErrors } = useFoormForm({
  formData,
  firstValidation,
})

// ---------------------------------------------------------------------------
// Validation rules
// ---------------------------------------------------------------------------
const required: TFoormRule<string, unknown, unknown> = v =>
  (v && v.trim().length > 0) || 'This field is required'

const emailFormat: TFoormRule<string, unknown, unknown> = v =>
  !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email'

const minAge: TFoormRule<string, unknown, unknown> = v =>
  !v || Number(v) >= 18 || 'Must be at least 18'

const maxAge: TFoormRule<string, unknown, unknown> = v =>
  !v || Number(v) <= 120 || 'Must be at most 120'

const maxLength =
  (max: number): TFoormRule<string, unknown, unknown> =>
  v =>
    !v || v.length <= max || `Max ${max} characters`

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------
const submitResult = ref<string>()

function handleSubmit() {
  const result = submit()
  if (result === true) {
    submitResult.value = `Submitted: ${JSON.stringify(formData)}`
  } else {
    submitResult.value = `Errors: ${result.map(e => `${e.path}: ${e.message}`).join(', ')}`
  }
}

function handleReset() {
  reset()
  submitResult.value = undefined
}

function handleSetExternalErrors() {
  setErrors({
    name: 'Name already taken (external)',
    email: 'Email blocked (external)',
  })
}
</script>

<template>
  <main class="page">
    <h1>Composables Playground</h1>
    <p class="subtitle">
      A hand-built form using only <code>useFoormForm</code> and <code>useFoormField</code> — no
      OoForm/OoField components.
    </p>

    <!-- Validation strategy picker -->
    <fieldset class="strategy">
      <legend>First validation</legend>
      <label v-for="s in ['on-change', 'touched-on-blur', 'on-blur', 'on-submit', 'none']" :key="s">
        <input v-model="firstValidation" type="radio" :value="s" />
        {{ s }}
      </label>
    </fieldset>

    <!-- Form -->
    <form class="form" @submit.prevent="handleSubmit">
      <DemoField
        v-model="formData.name"
        path="name"
        label="Name *"
        placeholder="John Doe"
        :rules="[required]"
      />

      <DemoField
        v-model="formData.email"
        path="email"
        label="Email *"
        type="email"
        placeholder="john@example.com"
        :rules="[required, emailFormat]"
      />

      <DemoField
        v-model="formData.age"
        path="age"
        label="Age"
        type="number"
        placeholder="25"
        :rules="[minAge, maxAge]"
      />

      <DemoField
        v-model="formData.message"
        path="message"
        label="Message (max 200 chars)"
        placeholder="Write something..."
        textarea
        :rules="[maxLength(200)]"
      />

      <!-- Actions -->
      <div class="actions">
        <button type="submit">Submit</button>
        <button type="button" @click="handleReset">Reset</button>
        <button type="button" @click="clearErrors">Clear Errors</button>
        <button type="button" @click="handleSetExternalErrors">Set External Errors</button>
      </div>
    </form>

    <!-- Result -->
    <pre v-if="submitResult" class="result">{{ submitResult }}</pre>

    <!-- Debug -->
    <details class="debug">
      <summary>Form Data (debug)</summary>
      <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
    </details>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.page {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  max-width: 520px;
  margin: 48px auto;
  padding: 0 16px;
}

h1 {
  font-size: 24px;
  margin: 0 0 4px;
}

.subtitle {
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 24px;
}

.subtitle code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.strategy {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.strategy legend {
  font-weight: 600;
  font-size: 13px;
  color: #374151;
}

.strategy label {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.actions button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  background: #fff;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.actions button:hover {
  background: #f9fafb;
}

.actions button[type='submit'] {
  background: #6366f1;
  color: #fff;
  border-color: #6366f1;
}

.actions button[type='submit']:hover {
  background: #4f46e5;
}

.result {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
}

.debug {
  margin-top: 16px;
}

.debug summary {
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
}

.debug pre {
  margin-top: 8px;
  padding: 12px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
}
</style>
