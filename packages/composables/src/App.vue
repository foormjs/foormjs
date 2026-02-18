<script setup lang="ts">
import { ref } from 'vue'
import MyInput from './components/MyInput.vue'
import VuilessForm from './components/VuilessForm.vue'
import VuilessField from './components/VuilessField.vue'
import type { MyForm } from './form.type'
import * as rules from './rules'

const data = ref<MyForm>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
})

const toSend = ref()

const fv = ref<'on-change'>('on-change')
</script>

<template>
  <div class="flex">
    <div>
      <!-- form -->

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
      <VuilessForm
        :form-data="data"
        :form-context="{
          nameIsRequired: true,
        }"
        :first-validation="fv"
        @submit="toSend = $event"
        v-slot="form"
      >
        <VuilessField v-model="data.firstName" :rules="[rules.firstOrLastName]" v-slot="field">
          <input v-model="field.model.value" hidden />
        </VuilessField>

        <VuilessField v-model="data.lastName" :rules="[rules.firstOrLastName]" v-slot="field">
          <MyInput
            label="Last Name (Cross Checks)"
            v-model="field.model.value"
            :error="field.error"
            @blur="field.onBlur"
          />
        </VuilessField>

        <VuilessField
          v-model="data.email"
          :rules="[rules.isRequired, rules.isEmail]"
          v-slot="field"
        >
          <MyInput
            label="Email"
            v-model="field.model.value"
            :error="field.error"
            @blur="field.onBlur"
          />
        </VuilessField>

        <VuilessField
          v-model="data.phone"
          :rules="[rules.isRequired, rules.isNumber, rules.min(10), rules.max(12)]"
          v-slot="field"
        >
          <MyInput
            label="Phone"
            v-model="field.model.value"
            :error="field.error"
            @blur="field.onBlur"
          />
        </VuilessField>

        <button role="submit" class="primary">Submit</button>

        <div class="buttons">
          <button type="button" @click="form.clearErrors">Clear Errors</button>
          <button type="button" @click="form.reset">Reset</button>
        </div>
      </VuilessForm>
    </div>

    <div>
      <!-- data -->
      <h2>Data</h2>
      <pre style="font-size: 10px">{{ data }}</pre>
    </div>

    <div v-if="!!toSend">
      <!-- sent form -->
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
