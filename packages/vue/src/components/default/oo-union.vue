<script setup lang="ts">
import type { TFoormComponentProps } from '../types'
import OoField from '../oo-field.vue'
import OoNoData from '../internal/oo-no-data.vue'
import { useFoormUnion } from '../../composables/use-foorm-union'

const props = defineProps<TFoormComponentProps>()

const {
  unionField,
  hasMultipleVariants,
  localUnionIndex,
  innerField,
  changeVariant,
  optionalEnabled,
  dropdownRef,
  isOpen,
  toggle,
  select,
  handleNaClick,
} = useFoormUnion(props)
</script>

<template>
  <div class="oo-union" v-show="!hidden">
    <!-- Optional N/A state: click opens variant picker when multiple variants -->
    <template v-if="optional && !optionalEnabled">
      <div v-if="hasMultipleVariants" ref="dropdownRef" class="oo-dropdown-anchor">
        <OoNoData :on-edit="handleNaClick" />
        <div v-if="isOpen" class="oo-dropdown-menu">
          <button
            v-for="(v, vi) in unionField!.unionVariants"
            :key="vi"
            type="button"
            class="oo-dropdown-item"
            @click="
              select(() => {
                changeVariant(vi)
                onToggleOptional?.(true)
              })
            "
          >
            {{ v.label }}
          </button>
        </div>
      </div>
      <OoNoData v-else :on-edit="() => onToggleOptional?.(true)" />
    </template>
    <template v-else>
      <!-- Optional clear button -->
      <button
        v-if="optional"
        type="button"
        class="oo-optional-clear"
        @click="onToggleOptional?.(false)"
      >
        &times;
      </button>
      <!-- Inner field — variant picker rendered by consumer via union context -->
      <OoField
        v-if="innerField"
        :key="localUnionIndex"
        :field="innerField"
        :array-index="arrayIndex"
        :on-remove="onRemove"
        :can-remove="canRemove"
        :remove-label="removeLabel"
      />
    </template>
  </div>
</template>

<style>
.oo-union {
  margin: 0;
}
</style>
