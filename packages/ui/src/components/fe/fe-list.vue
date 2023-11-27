<script setup lang="ts">
import type { TFeProps } from './types'
import OoLabel from '../oo-label.vue'
import OoBottomSlot from '../oo-bottom-slot.vue'
import { entryRefs } from '../../composables/entry-refs'
import ooListInner from '../oo-list-inner.vue'

type TItems = TItem[]
type TItem = string | ({ key: string | number, label: string })
const modelValue = defineModel<(string | number)[] | string | number>({ local: true })
const props = defineProps<Partial<TFeProps> & { rows?: number, options: TItems, filter?: string }>()

const { classes, disabledState, validation, focused, onBlur, focusableRef } = entryRefs(modelValue, props as TFeProps)
</script>

<template>
    <div class="oo-list oo-form-entry" :class="classes">
        <label
        tabindex="0"
        @blur="onBlur"
        @focus="focused = true"
        ref="focusableRef">
            <oo-label :class="{ 'oo-required': !optional }" :id="id + '-label'" v-if="!!label">{{ label }}</oo-label>
            <ooListInner
                v-bind="$props"
                :label-id="id + '-label'"
                :focused="focused"
                v-model="modelValue"
            />

        </label>
        <oo-bottom-slot
            :hint="hint"
            :disabled="disabledState"
            :error="(validation.error as string)"
        />
    </div>
</template>

<style>


.oo-list.error .oo-list-container {
    border-color: var(--oo-c-negative);
}

.oo-list.focused label:focus {
    outline: none;
}
</style>
