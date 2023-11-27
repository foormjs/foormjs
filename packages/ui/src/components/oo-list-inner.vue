<script setup lang="ts">
import type { TFeProps } from './fe/types'
import { computed, watch, ref, nextTick, onMounted, onUnmounted } from 'vue'
import { entryRefs } from '../composables/entry-refs'
import { isElementFullyVisibleInContainer } from './utils';

type TItems = TItem[]
type TItem = string | ({ key: string | number, label: string })
const props = defineProps<Partial<TFeProps> & {
    labelId: string
    focused: boolean
    rows?: number,
    options: TItems,
    filter?: string
    asPopup?: boolean
}>()
const modelValue = defineModel<(string | number)[] | string | number>({ local: true })

const selectedForADA = computed(() => {
    if (typeof modelValue.value === 'undefined' || (typeof modelValue.value !== 'number' && modelValue.value.length === 0)) return 'None of options is selected'
    if (Array.isArray(modelValue.value)) return `Selected options: ${modelValue.value.join(', ')}`
    return `Option "${modelValue.value}" selected"`
})

watch(() => props.value, updateValue)
function updateValue() {
    modelValue.value = props.type === 'single-select' ? props.value as string : (props.value ? [props.value as string] : [])
}

const { classes, check, focusableRef } = entryRefs(modelValue, props as TFeProps)
const listRows = computed(() => Math.min(props.rows || 3, filtered.value.length))
const listHeight = computed(() => listRows.value * 40)
const filtered = computed(() => {
    if (props.filter) {
        return props.options.filter(o => getLabel(o)?.toLocaleLowerCase().search(props.filter?.toLowerCase() as string) >= 0)
    }
    return props.options
})

const randId = Math.round(Math.random() * 1000000) + '-'

const focusedItem = ref<number>(0)

function getKey(item?: TItem) {
    if (!item) return undefined
    return typeof item === 'string' ? item : item.key
}
function getLabel(item?: TItem): string {
    if (typeof item === 'string') return item
    if (typeof item === 'object') return item.label
    return undefined as unknown as string
}
function isSelected(item: TItem) {
    const key = getKey(item)
    if (!key) return false
    if (Array.isArray(modelValue.value)) {
        return modelValue.value.includes(key)
    } else {
        return modelValue.value === key
    }
}

function onClick(item: TItem, index: number) {
    focusedItem.value = index
    const key = getKey(item) as string
    if (props.type === 'single-select') {
        check()
        modelValue.value = key
    } else if (props.type === 'multi-select') {
        check()
        if (!Array.isArray(modelValue.value)) {
            modelValue.value = [key]
            return
        }
        const selected = isSelected(item)
        if (selected) modelValue.value = modelValue.value.filter(v => v !== key)
        else modelValue.value.push(key)
    } else if (props.type === 'action') {

    }
}
function select(offset: number) {
    focusedItem.value += offset
    if (focusedItem.value > filtered.value.length - 1) focusedItem.value = filtered.value.length - 1
    if (focusedItem.value < 0) focusedItem.value = 0
    nextTick(() => {
        const item = (focusableRef.value as HTMLElement).querySelector(`li.oo-list-item:nth-child(${focusedItem.value + 3})`) as HTMLElement
        const cont = focusableRef.value as HTMLElement
        if (item && cont && !isElementFullyVisibleInContainer(item, cont)) {
            item.scrollIntoView({
                behavior: 'instant',
                block: offset < 0 ? 'start' : 'end',
            })
        }
    })
}

onMounted(() => {
    setTimeout(() => {
        window.addEventListener('keydown', onKeydown)
    }, 1)
})

onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
    focusedItem.value = -1
})

function onKeydown(event: KeyboardEvent) {
    if (!props.focused) return
    switch (event.key) {
        case 'ArrowUp': select(-1); break;
        case 'ArrowDown': select(1); break;
        case 'ArrowLeft': select(-listRows.value); break;
        case 'ArrowRight': select(listRows.value); break;
        default:
            if ((event.key === 'Enter' || event.code === 'Space') && typeof filtered.value[focusedItem.value] !== 'undefined' && focusableRef.value && props.focused) {
                console.log('hit enter,', focusedItem.value, 'focused', props.focused)
                onClick(filtered.value[focusedItem.value], focusedItem.value)
                event.preventDefault()
            }
    }
}
</script>

<template>
    <ul class="oo-list-container oo-focusable"
    role="listbox"
    ref="focusableRef"
    :tabindex="asPopup ? '0' : undefined"
    :aria-labelledby="labelId"
    :aria-activedescendant="randId + focusedItem"
    :class="{
        ['oo-list-' + props.type]: props.type && true || false,
        focused,
        error: classes.error,
    }"
    :style="{ height: listHeight + 'px' }">

        <div aria-live="polite" style="display: none;">{{ selectedForADA }}</div>
        <div aria-live="polite" style="display: none;">Focused on "{{ getLabel(filtered[focusedItem]) }}"</div>    

        <li v-for="(item, i) of filtered"
        :id="randId + i"
        role="option"
        @click="onClick(item, i)"
        :aria-selected="isSelected(item)"
        class="oo-list-item"
        :class="{
            selected: isSelected(item),
            focused: focusedItem === i
        }"
        >
            {{ getLabel(item) }}
        </li>
    </ul>
</template>

<style>
.oo-list-container {
    border: 1px solid var(--oo-c-border);
    border-radius: var(--oo-border-radius);
    overflow-y: scroll;
    margin: 0;
    padding: 0;
}
.oo-list-container .oo-list-item {
    width: 100%;
    font-size: var(--oo-input-font-size);
    padding: var(--oo-input-padding);
    height: var(--oo-input-height);
    display: flex;
    align-items: center;
    /* border-radius: var(--oo-border-radius); */
    color: var(--oo-c-text);
    background-color: var(--oo-c-background-1);
    transition: border-color var(--oo-transition), box-shadow var(--oo-transition), background-color 0.5s ease;
    box-sizing: border-box;
}

.oo-list-single-select .oo-list-item,
.oo-list-multi-select .oo-list-item {
    cursor: pointer;
}
.oo-list-single-select .oo-list-item:hover,
.oo-list-multi-select .oo-list-item:hover,
.oo-list-single-select.focused .oo-list-item.focused,
.oo-list-multi-select.focused .oo-list-item.focused {
    /* color: var(--oo-c-neutral); */
    background-color: var(--oo-c-hl);
    border: none;
    outline: none;
    /* text-decoration: underline; */
    /* outline-offset: -2px; */
    /* outline: 2px solid var(--oo-c-neutral); */
}
.oo-list-single-select .oo-list-item.selected {
    /* background-color: var(--oo-c-neutral); */
    font-weight: bold;
    /* color: var(--oo-c-white); */
    color: var(--oo-c-neutral);
}

.oo-list-multi-select .oo-list-item.selected {
    /* background-color: var(--oo-c-background-2); */
    font-weight: bold;
    color: var(--oo-c-neutral);
}
</style>