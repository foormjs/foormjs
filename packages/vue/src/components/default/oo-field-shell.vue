<script setup lang="ts">
import { computed, inject, provide, ref, useId } from 'vue'
import type { TFoormComponentProps, TFoormUnionContext } from '../types'
import OoNoData from './oo-no-data.vue'
import { useDropdown } from '../../composables/use-dropdown'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<
  TFoormComponentProps & {
    fieldClass?: string
    idPrefix?: string
  }
>()

const id = useId()
const prefix = props.idPrefix ?? 'oo-field'
const inputId = `${prefix}-${id}`
const errorId = `${prefix}-${id}-err`
const descId = `${prefix}-${id}-desc`

const optionalEnabled = computed(() => props.model?.value !== undefined)

// ── Union context (optional — present when rendered inside oo-union) ──
const unionCtx = inject<TFoormUnionContext | undefined>('__foorm_union', undefined)
provide('__foorm_union', undefined) // Clear for nested children
const hasVariantPicker = unionCtx !== undefined && unionCtx.variants.length > 1

// In array context, prepend #<index+1> to the label (same as oo-object displayTitle)
const displayLabel = computed(() => {
  const idx = props.arrayIndex
  if (idx !== undefined) {
    return props.label ? `${props.label} #${idx + 1}` : `#${idx + 1}`
  }
  return props.label
})

// ── Dropdown for variant picker ─────────────────────────────
const dropdownRef = ref<HTMLElement | null>(null)
const { isOpen, toggle, select } = useDropdown(dropdownRef)

function onSelectVariant(index: number) {
  select(() => unionCtx!.changeVariant(index))
}
</script>

<template>
  <div class="oo-default-field" :class="[fieldClass, $props.class]" v-show="!hidden">
    <!-- Header row: label/header on left, action buttons on right -->
    <div
      v-if="displayLabel || onRemove || (optional && optionalEnabled) || hasVariantPicker || $slots.header"
      class="oo-field-header-row"
    >
      <div class="oo-field-header-content">
        <template v-if="$slots.header">
          <slot
            name="header"
            :input-id="inputId"
            :desc-id="descId"
            :optional-enabled="optionalEnabled"
          />
        </template>
        <template v-else>
          <label v-if="displayLabel" :for="inputId">{{ displayLabel }}</label>
          <span v-if="description" :id="descId">{{ description }}</span>
        </template>

        <!-- Union variant picker — inline next to label -->
        <div v-if="hasVariantPicker" ref="dropdownRef" class="oo-dropdown">
          <button
            type="button"
            class="oo-variant-trigger"
            :disabled="disabled"
            :title="unionCtx!.variants[unionCtx!.currentIndex.value]?.label ?? 'Switch variant'"
            @click="toggle"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="3" cy="8" r="1.5" fill="currentColor" />
              <circle cx="8" cy="8" r="1.5" fill="currentColor" />
              <circle cx="13" cy="8" r="1.5" fill="currentColor" />
            </svg>
          </button>
          <div v-if="isOpen" class="oo-dropdown-menu">
            <button
              v-for="(v, vi) in unionCtx!.variants"
              :key="vi"
              type="button"
              class="oo-dropdown-item"
              :class="{ 'oo-dropdown-item--active': unionCtx!.currentIndex.value === vi }"
              @click="onSelectVariant(vi)"
            >
              {{ v.label }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="(optional && optionalEnabled) || onRemove" class="oo-field-header-actions">
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
          class="oo-field-remove-btn"
          :disabled="!canRemove"
          :aria-label="removeLabel || 'Remove item'"
          @click="onRemove"
        >
          {{ removeLabel || '\u00d7' }}
        </button>
      </div>
    </div>

    <template v-if="optional && !optionalEnabled">
      <OoNoData :on-edit="() => onToggleOptional?.(true)" />
    </template>
    <template v-else>
      <div class="oo-field-input-row">
        <slot :input-id="inputId" :error-id="errorId" :desc-id="descId" />
      </div>
      <slot name="after-input" :desc-id="descId" />
      <div :id="errorId" class="oo-error-slot" :role="error ? 'alert' : undefined">
        {{ error || hint }}
      </div>
    </template>
  </div>
</template>
