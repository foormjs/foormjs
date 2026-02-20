<script setup lang="ts">
import type { FoormArrayFieldDef } from '@foormjs/atscript'
import { isArrayField } from '@foormjs/atscript'
import { computed } from 'vue'
import type { TFoormComponentProps } from '../types'
import { useFoormArray } from '../../composables/use-foorm-array'
import OoField from '../oo-field.vue'
import OoOptionalNa from './oo-optional-na.vue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<TFoormComponentProps<unknown, any, any>>()

const arrayField = isArrayField(props.field!) ? (props.field as FoormArrayFieldDef) : undefined

const optionalEnabled = computed(() => Array.isArray(props.model?.value))

const {
  arrayValue,
  itemKeys,
  getItemField,
  isUnion,
  unionVariants,
  addItem,
  removeItem,
  canAdd,
  canRemove,
  addLabel,
  removeLabel,
} = useFoormArray(
  arrayField!,
  computed(() => props.disabled ?? false)
)
</script>

<template>
  <div
    class="oo-array"
    :class="{ 'oo-array--root': level === 0, 'oo-array--nested': (level ?? 0) > 0 }"
    v-show="!hidden"
  >
    <!-- Header (title + clear/remove buttons) -->
    <div class="oo-array-header" v-if="title || onRemove || optional">
      <div class="oo-array-header-content">
        <h2 v-if="title && level === 0" class="oo-array-title oo-form-title">{{ title }}</h2>
        <h3 v-else-if="title" class="oo-array-title">{{ title }}</h3>
      </div>
      <button
        v-if="optional && optionalEnabled"
        type="button"
        class="oo-optional-clear"
        @click="onToggleOptional?.(false)"
      >
        &times;
      </button>
      <button
        v-if="onRemove"
        type="button"
        class="oo-array-remove-btn"
        :disabled="!props.canRemove"
        :aria-label="props.removeLabel || 'Remove item'"
        @click="onRemove"
      >
        {{ props.removeLabel || 'Remove' }}
      </button>
    </div>

    <template v-if="optional && !optionalEnabled">
      <OoOptionalNa :on-edit="() => onToggleOptional?.(true)" />
    </template>
    <template v-else>
      <!-- Items — each rendered as a single OoField -->
      <OoField
        v-for="(_item, i) in arrayValue"
        :key="itemKeys[i]"
        :field="getItemField(i)"
        :on-remove="() => removeItem(i)"
        :can-remove="canRemove"
        :remove-label="removeLabel"
        :array-index="i"
      />

      <!-- Add button -->
      <div class="oo-array-add">
        <!-- Single type: simple add button -->
        <button
          v-if="!isUnion"
          type="button"
          class="oo-array-add-btn"
          :disabled="!canAdd"
          @click="addItem(0)"
        >
          {{ addLabel }}
        </button>

        <!-- Union: one button per variant -->
        <div v-else class="oo-array-union-picker">
          <button
            v-for="(v, vi) in unionVariants"
            :key="vi"
            type="button"
            class="oo-array-add-btn"
            :disabled="!canAdd"
            @click="addItem(vi)"
          >
            {{ addLabel }}: {{ v.label }}
          </button>
        </div>
      </div>

      <!-- Array-level validation error -->
      <div v-if="error" class="oo-array-error" role="alert">{{ error }}</div>
    </template>
  </div>
</template>

<style>
.oo-array {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0;
}

.oo-array--nested {
  padding-left: 12px;
  border-left: 2px solid #e5e7eb;
}

.oo-array-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.oo-array-title.oo-form-title {
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1f;
}

.oo-array-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.oo-array-header-content {
  flex: 1;
}

.oo-array-remove-btn {
  padding: 4px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
}

.oo-array-remove-btn:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.oo-array-remove-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.oo-array-error {
  font-size: 12px;
  color: #ef4444;
}

.oo-array-add {
  margin-top: 4px;
}

.oo-array-add-btn {
  padding: 6px 14px;
  border: 1px dashed #d1d5db;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
}

.oo-array-add-btn:hover:not(:disabled) {
  border-color: #6366f1;
  color: #6366f1;
}

.oo-array-add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.oo-array-union-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
