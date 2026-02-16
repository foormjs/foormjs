<script setup lang="ts">
import OoForm from '@/components/oo-form.vue'
import { useFoorm } from '@/composables/use-foorm'
import { E2eTestForm } from './forms/e2e-test-form.as'

const { form, formData } = useFoorm(E2eTestForm)

const formContext = {
  cityOptions: [
    { key: 'nyc', label: 'New York' },
    { key: 'la', label: 'Los Angeles' },
    { key: 'chi', label: 'Chicago' },
  ],
}

function handleSubmit(d: unknown) {
  console.log('submit', d)
}

function handleAction(name: string, d: unknown) {
  console.log('action', name, d)
}
</script>

<template>
  <main style="width: 100%">
    <OoForm
      class="form"
      :form="form"
      :form-data="formData"
      :form-context="formContext"
      first-validation="on-blur"
      @submit="handleSubmit"
      @action="handleAction"
    />
  </main>
</template>

<style scoped>
main {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 16px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-width: 500px;
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.04);
}
</style>
