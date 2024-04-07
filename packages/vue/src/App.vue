<script setup lang="ts">
import ooFoorm from '@/components/oo-form.vue'
import { Foorm, ftring } from 'foorm'
import { ref } from 'vue'

const form = new Foorm({
  title: 'User',
  entries: [],
})
form.addEntry({
  type: 'paragraph',
  optional: true,
  field: '_',
  description: 'Enter your name and age',
})
form.addEntry({
  field: 'firstName',
  description: 'Not a nickname',
  placeholder: 'John',
  name: 'first name',
  label: 'First Name',
  validators: [ftring`!!v || 'Required'`],
  classes: {
    foo: ftring`v === 'foo'`,
  },
})
form.addEntry({
  field: 'lastName',
  placeholder: 'Doe',
  hint: 'Real last name please',
  name: 'last name',
  label: 'Last Name',
  validators: [ftring`!!v || 'Required'`],
  classes: {
    bar: ftring`v === 'bar'`,
  },
})
form.addEntry({
  field: 'age',
  name: 'age',
  label: 'Age',
  type: 'number',
  validators: [ftring`!!v || 'Required'`],
})
form.setSubmit({
  text: 'Submit',
  disabled: ftring`data.firstName?.toLowerCase() === 'artem'`,
})

function handleSubmit(d: unknown) {
  console.log(d)
}
</script>

<template>
  <main>
    <oo-foorm class="form" :form="form" @submit="handleSubmit"> </oo-foorm>
  </main>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
