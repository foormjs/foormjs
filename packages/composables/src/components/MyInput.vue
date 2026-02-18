<script setup lang="ts">
type Props = {
  label?: string
  error?: string
}

const modelValue = defineModel()
defineProps<Props>()

const emit = defineEmits<{
  (e: 'blur', event: FocusEvent): void
}>()
</script>

<template>
  <label class="my-input" :class="{ error: !!error }">
    {{ label }}
    <input v-model="modelValue" @blur="emit('blur', $event)" />
    <div class="error-text">
      <span v-if="!!error">{{ error }}</span>
    </div>
  </label>
</template>

<style scoped>
.my-input {
  display: flex;
  flex-direction: column;
}
.my-input input {
  height: 38px;
  border-radius: 4px;
  padding: 0 8px;
  background-color: #ffffff25;
  color: white;
  border: 1px solid #ffffff50;
}
.my-input.error input {
  border: 1px solid rgb(205, 48, 48);
}
.error-text {
  font-size: 12px;
  color: rgb(205, 48, 48);
  height: 24px;
}
</style>
