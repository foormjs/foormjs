<script setup lang="ts">
import type { FoormFieldDef, FoormUnionFieldDef } from '@foormjs/atscript'
import { isUnionField, createItemData, detectUnionVariant } from '@foormjs/atscript'
import { computed, provide, ref, shallowRef, watch } from 'vue'
import type { TFoormComponentProps, TFoormUnionContext } from '../types'
import OoField from '../oo-field.vue'
import OoNoData from './oo-no-data.vue'
import { useDropdown } from '../../composables/use-dropdown'

const props = defineProps<TFoormComponentProps>()

// ── Union field def ─────────────────────────────────────────
const unionField = computed(() =>
  props.field && isUnionField(props.field) ? (props.field as FoormUnionFieldDef) : undefined
)

const hasMultipleVariants = computed(
  () => unionField.value !== undefined && unionField.value.unionVariants.length > 1
)

// ── Local union state ───────────────────────────────────────
const localUnionIndex = ref(
  unionField.value ? detectUnionVariant(props.model?.value, unionField.value.unionVariants) : 0
)

const currentVariant = computed(() => {
  const variants = unionField.value?.unionVariants
  if (!variants) return undefined
  return variants[localUnionIndex.value] ?? variants[0]
})

// ── Inner field def (stable ref — only rebuilt on variant change) ──
function buildInnerField(): FoormFieldDef | undefined {
  const variant = currentVariant.value
  if (!variant) return undefined

  const fieldName = unionField.value?.name ?? ''

  if (variant.def) {
    return { ...variant.def.rootField, path: '', name: fieldName }
  }
  if (variant.itemField) {
    return { ...variant.itemField, path: '' }
  }

  return undefined
}

const innerField = shallowRef<FoormFieldDef | undefined>(buildInnerField())
watch(localUnionIndex, () => {
  innerField.value = buildInnerField()
})

// ── Change variant handler ──────────────────────────────────
function onChangeVariant(newIndex: number) {
  localUnionIndex.value = newIndex
  const variant = unionField.value?.unionVariants[newIndex]
  if (variant && props.model) {
    props.model.value = createItemData(variant)
  }
}

const optionalEnabled = computed(() => props.model?.value !== undefined)

// ── Provide union context for consumers ─────────────────────
if (unionField.value) {
  provide<TFoormUnionContext>('__foorm_union', {
    variants: unionField.value.unionVariants,
    currentIndex: localUnionIndex,
    changeVariant: onChangeVariant,
  })
}

// ── Dropdown (only for optional N/A variant picker) ─────────
const dropdownRef = ref<HTMLElement | null>(null)
const { isOpen, toggle, select } = useDropdown(dropdownRef)

// For optional union N/A: clicking opens variant picker or just enables
function handleNaClick() {
  if (hasMultipleVariants.value) {
    toggle()
  } else {
    props.onToggleOptional?.(true)
  }
}
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
                onChangeVariant(vi)
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
