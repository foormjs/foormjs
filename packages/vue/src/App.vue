<script setup lang="ts">
import ooFoorm from '@/components/oo-form.vue'
import { Foorm, deserializeForm, serializeForm } from 'foorm'

const form = new Foorm({
  title: (data: { firstName?: string }) => 'User ' + (data.firstName || '<unknown>'),
  entries: [],
})
form.addEntry({
  type: 'paragraph',
  optional: true,
  field: '_',
  description: 'Enter your name and age',
})
form.addEntry<string>({
  field: 'firstName',
  description: 'Not a nickname',
  placeholder: 'John',
  name: 'first name',
  label: 'First Name',
  validators: [(v: string) => !!v || 'Required'],
  classes: {
    foo: (v: string) => v === 'foo',
  },
})
form.addEntry({
  field: 'lastName',
  placeholder: 'Doe',
  hint: 'Real last name please',
  name: 'last name',
  label: 'Last Name',
  validators: [(v: string) => !!v || 'Required'],
  classes: {
    bar: (v: string) => v === 'bar',
  },
})
form.addEntry({
  field: 'age',
  name: 'age',
  label: 'Age',
  type: 'number',
  validators: [(v: string) => !!v || 'Required'],
})
form.setSubmit({
  text: 'Submit',
  disabled: (data: any) => data.firstName?.toLowerCase() === 'artem',
})

const newForm = deserializeForm(serializeForm(form))

function handleSubmit(d: unknown) {
  console.log(d)
}
</script>

<template>
  <main>
    <oo-foorm class="form" :form="newForm" @submit="handleSubmit"> </oo-foorm>
  </main>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
