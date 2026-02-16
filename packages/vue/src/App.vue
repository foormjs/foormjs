<script setup lang="ts">
import OoForm from '@/components/oo-form.vue'
import { createFoorm } from '@foormjs/atscript'
import { createFormData } from 'foorm'
import { RegistrationForm } from './forms/registration.as'

const form = createFoorm(RegistrationForm)
const formData = createFormData(form.fields)

function handleSubmit(d: unknown) {
  console.log(d)
}
</script>

<template>
  <main>
    <OoForm class="form" :form="form" :form-data="formData" @submit="handleSubmit" />
  </main>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
