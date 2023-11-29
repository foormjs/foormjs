<script setup lang="ts">
import DarkModeBtn from '@/components/dark-mode-btn.vue'
import { onMounted } from 'vue'
import OoForm from './components/oo-form.vue';
import type { TFoormAction, TFoormEntry } from 'foorm';
// import { renderFlag } from '@foormjs/flags'

onMounted(() => {
  setTimeout(() => document.body.classList.add('loaded'), 100)
})

const entries: TFoormEntry[] = [
  {
  label: 'Input one',
  component: 'fe-input',
  type: 'text',
  field: 'input1',
  focusable: true,
  nextFocusable: true,
  validators: ['v.length > 5 || "Must be at least 5 characters long, Must be at least 5 sdafbe at least 5 sdafbe at least 5 sdaf"'],
  bind: { placeholder: 'test placeholder', hint: 'Not a nickname' },
},
  {
    label: 'Pick something',
    component: 'fe-input',
    type: 'single-select',
    field: 'selection',
    focusable: true,
    nextFocusable: true,
    hint: 'this is dropdown',
    validators: ['v.length > 5 || "Must be at least 5 characters long, Must be at least 5 sdafbe at least 5 sdafbe at least 5 sdaf"'],
    bind: { rows: 3, options: ['Option one', 'Option two', '3rd option', 'Four', '5TH'] },
  },
  {
    label: 'Pick something 2',
    component: 'fe-list',
    type: 'multi-select',
    field: 'selection2',
    focusable: true,
    nextFocusable: true,
    validators: ['v.length <=3 || "Pick upto 3 options"'],
    bind: { rows: 3, options: ['Option one', 'Option two', '3rd option', 'Four', '5TH'] },
  },
  {
    label: 'Pick something 3',
    component: 'fe-list',
    type: 'single-select',
    field: 'selection3',
    focusable: true,
    nextFocusable: true,
    bind: { rows: 5, options: ['Option one', 'Option two', '3rd option', 'Four', '5TH', 'more options', 'one more'] },
    validators: ['v !== \'Option one\' || "Don\'t pick Option One"']
  },
// {
//   label: 'Input two',
//   component: 'fe-input',
//   disabled: 'true',
//   value: 'prefilled value',
//   type: 'text',
//   field: 'input2',
//   focusable: true,
//   nextFocusable: true,
//   validators: ['v.length > 5 || "Must be at least 5 characters long"'],
//   bind: { placeholder: 'test placeholder', hint: 'very long hint bla bla bla bla bla very very ling text of hintvery long hint bla bla bla bla bla very very ling text of hint' },
// }, {
//   label: 'Input three',
//   component: 'fe-input',
//   type: 'text',
//   field: 'input3',
//   focusable: true,
//   nextFocusable: true,
//   disabled: 'inputs.input1 === "secret"',
//   validators: ['v === inputs.input1 || "Must be equal to Input one"'],
// }, {
//   label: 'Password',
//   component: 'fe-input',
//   type: 'password',
//   field: 'password',
//   focusable: true,
//   nextFocusable: true,
// }, {
//   label: 'Pin',
//   component: 'fe-pin',
//   validators: ['v === inputs.input3 || "Must be equal to Input three"'],
//   field: 'code',
//   bind: { length: 6 },
//   focusable: true,
//   nextFocusable: true,
// }, {
//   label: 'Pin (4)',
//   component: 'fe-pin',
//   field: 'code2',
//   bind: { length: 4, hint: 'enabled pin' },
//   focusable: true,
//   nextFocusable: true,
// }, {
//   label: 'Pin (disabled)',
//   disabled: 'true',
//   component: 'fe-pin',
//   field: 'code2',
//   bind: { length: 4, hint: 'disabled pin' },
//   focusable: true,
//   nextFocusable: true,
// }
]
const values = {}
const actions: TFoormAction[] = [{
  type: 'submit',
  text: 'Submit',
  classes: {
    'full-width': 'true',
    'bg-white':  'true',
  },
}]
function onAction(action: TFoormAction) {
  console.log(action, values)
}
</script>

<template>
      <!-- <div v-html="renderFlag('BM', 100)" />
      <div v-html="renderFlag('BT', 100)" />
      <div v-html="renderFlag('RU', 100)" />
      <div v-html="renderFlag('RU', 100)" />
      <div v-html="renderFlag('RU', 100)" />
    <div v-html="renderFlag('RU', 100)" />
    <div v-html="renderFlag('RU', 100)" />
    <div v-html="renderFlag('RU', 100)" />
    <div v-html="renderFlag('RU', 100)" /> -->

  <oo-form title="Test form" :entries="entries" :values="values" :actions="actions" @action="onAction" :validate="'after-action-attempt'" />
  <dark-mode-btn class="float" />
</template>

<style scoped>
.float {
    position: fixed;
    right: 10px;
    top: 10px;
}
</style>
