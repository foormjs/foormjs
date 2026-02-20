<script setup lang="ts">
import { computed, useId } from 'vue'
import type { TFoormComponentProps } from '../types'
import { useConsumeUnionContext, formatIndexedLabel } from '../../composables/use-foorm-context'
import OoNoData from './oo-no-data.vue'
import OoVariantPicker from './oo-variant-picker.vue'

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
const unionCtx = useConsumeUnionContext()
const hasVariantPicker = unionCtx !== undefined && unionCtx.variants.length > 1

// In array context, prepend #<index+1> to the label (same as oo-object displayTitle)
const displayLabel = computed(() => formatIndexedLabel(props.label, props.arrayIndex))
</script>

<template>
  <div class="oo-default-field" :class="[fieldClass, $props.class]" v-show="!hidden">
    <!-- Header row: label/header on left, action buttons on right -->
    <div
      v-if="
        displayLabel ||
        onRemove ||
        (optional && optionalEnabled) ||
        hasVariantPicker ||
        $slots.header
      "
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
        <OoVariantPicker v-if="hasVariantPicker" :union-context="unionCtx!" :disabled="disabled" />
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
          {{ removeLabel || 'Remove' }}
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
