<script setup lang="ts">
import { ref } from 'vue'
import MyInput from './components/MyInput.vue'
import type { MyForm } from './form.type'
import * as rules from './rules'
import { useFoormForm } from './composables/use-foorm-form'
import { useFoormField } from './composables/use-foorm-field'

const data = ref<MyForm>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
})

const toSend = ref()

const fv = ref<'on-change'>('on-change')

const { clearErrors, reset, submit } = useFoormForm({
  formData: data,
  formContext: { nameIsRequired: true },
  firstValidation: fv,
})

const firstName = useFoormField({
  getValue: () => data.value.firstName,
  setValue: v => (data.value.firstName = v),
  rules: [rules.firstOrLastName],
  path: () => 'firstName',
})

const lastName = useFoormField({
  getValue: () => data.value.lastName,
  setValue: v => (data.value.lastName = v),
  rules: [rules.firstOrLastName],
  path: () => 'lastName',
})

const email = useFoormField({
  getValue: () => data.value.email,
  setValue: v => (data.value.email = v),
  rules: [rules.isRequired, rules.isEmail],
  path: () => 'email',
})

const phone = useFoormField({
  getValue: () => data.value.phone,
  setValue: v => (data.value.phone = v),
  rules: [rules.isRequired, rules.isNumber, rules.min(10), rules.max(12)],
  path: () => 'phone',
})

function handleSubmit() {
  const result = submit()
  if (result === true) {
    toSend.value = { ...data.value }
  }
}
</script>

<template>
  <div class="flex">
    <div>
      <h2>Form</h2>

      <label class="fv-select">
        First Validation
        <select v-model="fv">
          <option value="none">None</option>
          <option value="on-change">On Change</option>
          <option value="touched-on-blur">On Blur (Touched)</option>
          <option value="on-blur">On Blur</option>
          <option value="on-submit">On Submit</option>
        </select>
      </label>

      <form @submit.prevent="handleSubmit">
        <MyInput
          label="First Name"
          v-model="firstName.model.value"
          :error="firstName.error.value"
          @blur="firstName.onBlur"
        />
        <MyInput
          label="Last Name (Cross Checks)"
          v-model="lastName.model.value"
          :error="lastName.error.value"
          @blur="lastName.onBlur"
        />
        <MyInput
          label="Email"
          v-model="email.model.value"
          :error="email.error.value"
          @blur="email.onBlur"
        />
        <MyInput
          label="Phone"
          v-model="phone.model.value"
          :error="phone.error.value"
          @blur="phone.onBlur"
        />

        <button type="submit" class="primary">Submit</button>

        <div class="buttons">
          <button type="button" @click="clearErrors">Clear Errors</button>
          <button type="button" @click="reset">Reset</button>
        </div>
      </form>
    </div>

    <div>
      <h2>Data</h2>
      <pre style="font-size: 10px">{{ data }}</pre>
    </div>

    <div v-if="!!toSend">
      <h2>Sent form</h2>
      <pre style="font-size: 10px">{{ toSend }}</pre>
    </div>
  </div>
</template>

<style scoped>
.flex {
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 20px;
}

.flex > div {
  flex: 1;
}

button {
  height: 32px;
  border: none;
  border-radius: 4px;
  padding: 0 12px;
  background-color: #4b545f;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

button:hover {
  background-color: #586b81;
  color: white;
}

button.primary {
  background-color: #2e5c8d;
  color: white;
  width: 100%;
}

button.primary:hover {
  background-color: #2577c9;
  color: white;
}

.buttons {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}
.buttons > button {
  flex: 1;
}
.fv-select {
  display: block;
  padding: 12px 0;
}
</style>
