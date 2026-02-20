<script setup lang="ts">
import type { FoormArrayFieldDef } from '@foormjs/atscript'
import { isArrayField } from '@foormjs/atscript'
import { computed, ref } from 'vue'
import type { TFoormComponentProps } from '../types'
import { useConsumeUnionContext } from '../../composables/use-foorm-context'
import { useFoormArray } from '../../composables/use-foorm-array'
import { useDropdown } from '../../composables/use-dropdown'
import OoField from '../oo-field.vue'
import OoNoData from './oo-no-data.vue'
import OoStructuredHeader from './oo-structured-header.vue'

const props = defineProps<TFoormComponentProps>()

const arrayField = isArrayField(props.field!) ? (props.field as FoormArrayFieldDef) : undefined

// ── Union context: consume and clear for nested children ────
const unionCtx = useConsumeUnionContext()

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

// ── Union add dropdown ──────────────────────────────────────
const addDropdownRef = ref<HTMLElement | null>(null)
const { isOpen: addOpen, toggle: toggleAdd, select: selectAdd } = useDropdown(addDropdownRef)
</script>

<template>
  <div
    class="oo-array"
    :class="{ 'oo-array--root': level === 0, 'oo-array--nested': (level ?? 0) > 0 }"
    v-show="!hidden"
  >
    <OoStructuredHeader
      :title="title"
      :level="level"
      :on-remove="onRemove"
      :can-remove="props.canRemove"
      :remove-label="props.removeLabel"
      :optional="optional"
      :optional-enabled="optionalEnabled"
      :on-toggle-optional="onToggleOptional"
      :disabled="disabled"
      :union-context="unionCtx"
    />

    <template v-if="optional && !optionalEnabled">
      <OoNoData :on-edit="() => onToggleOptional?.(true)" />
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

        <!-- Union: single button with variant dropdown -->
        <div v-else ref="addDropdownRef" class="oo-dropdown">
          <button type="button" class="oo-array-add-btn" :disabled="!canAdd" @click="toggleAdd">
            {{ addLabel }} &#x25BE;
          </button>
          <div v-if="addOpen" class="oo-dropdown-menu">
            <button
              v-for="(v, vi) in unionVariants"
              :key="vi"
              type="button"
              class="oo-dropdown-item"
              @click="selectAdd(() => addItem(vi))"
            >
              {{ v.label }}
            </button>
          </div>
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
  gap: 0;
  margin: 12px 0;
}

.oo-array--nested {
  padding-left: 16px;
  border-left: 2px solid #d1d5db;
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
</style>
