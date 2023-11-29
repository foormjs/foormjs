<script setup lang="ts">
import OoBottomSlot from '../oo-bottom-slot.vue'
import { useEntryRefs } from '../../composables/entry-refs'
import type { TFeProps } from './types'
import OoLabel from '../oo-label.vue'
import { computed, ref, watch, type ComponentPublicInstance } from 'vue'
import ooListInner from '../oo-list-inner.vue'

type TItems = TItem[]
type TItem = string | ({ key: string | number, label: string })

const inputTypes = ['text', 'password']

const modelValue = defineModel<string | string[]>({ local: true })
const selectInput = ref('')
const props = defineProps<Partial<TFeProps> & { rows?: number, options?: TItems, filter?: string }>()
const showPassword = ref(false)

const { classes, disabledState, validation, check, focused, onBlur, focusableRef } = useEntryRefs(modelValue, props as TFeProps)
const actualType = computed(() => {
    if (props.type === 'password') {
        return showPassword.value ? 'text' : 'password'
    }
    return props.type || 'text'
})
const showPopupList = ref(true)
const randId = Math.round(Math.random() * 1000000) + '-'
const labelId = computed(() => (props.field || '') + '-' + randId)

const focuses: string[] = []

const listRef = ref<ComponentPublicInstance>()

function _onFocus(id: string) {
    if (!focuses.includes(id)) {
        focuses.push(id)
    }
    focused.value = true
}
function _onBlur(id: string) {
    const index = focuses.findIndex(f => id)
    if (index >= 0) {
        focuses.splice(index, 1)
    }
    setTimeout(() => {
        if (focuses.length === 0) {
            onBlur()
            selectInput.value = ''
            showPopupList.value = true
        }
    }, 10)
}
watch([modelValue], () => {
    if (props.type === 'single-select' && modelValue.value) {
        selectInput.value = ''
        setTimeout(() => {
            showPopupList.value = false
        }, 1)
    }
})
watch([selectInput], () => {
    if (focused.value && selectInput.value && !showPopupList.value) {
        showPopupList.value = true
    }
})
const popupPosition = ref(['top', '100%'])

function updatePopupPos() {
    if (showPopupList.value && focusableRef.value && listRef.value) {
        const parent = (focusableRef.value as HTMLInputElement).parentElement?.parentElement
        const rect = parent?.getBoundingClientRect()
        console.log(parent, rect)
        const windowHeight = window.innerHeight
        const dist = windowHeight - (rect?.bottom || 0)
        if (dist < listRef.value.$el.getBoundingClientRect().height) {
            popupPosition.value = ['bottom', (rect?.height || 40) + 'px']
        } else {
            popupPosition.value = ['top', '100%']
        }
    }
}

function showPopup() {
    if (!disabledState.value) {
        showPopupList.value = true
        updatePopupPos()
    }
}

function removeItem(i: number, event?: MouseEvent) {
    if (Array.isArray(modelValue.value)) {
        modelValue.value.splice(i, 1)
        modelValue.value = [...modelValue.value]
    }
    showPopupList.value = false
    if (event) {
        event.stopPropagation()
        event.preventDefault()
    }
}

function unselect() {
    if (props.type === 'single-select' && !selectInput.value) {
        modelValue.value = ''
        showPopupList.value = true
    }
}
</script>

<template>
    <div class="oo-input oo-form-entry" :class="classes">
        <label :id="labelId" >
            <oo-label :class="{ 'oo-required': !optional }">{{ label }}</oo-label>
            <div class="oo-input-like oo-focusable" :class="{ disabled: classes.disabled, focused, error: classes.error, ['oo-input-type-' + actualType]: true }">
                <div class="oo-input-prepend"></div>
                <input
                    v-if="!props.type || inputTypes.includes(props.type)"
                    ref="focusableRef"
                    :placeholder="placeholder"
                    :type="actualType"
                    :disabled="!!disabledState"
                    v-model="modelValue"
                    @input="check"
                    @blur.native="onBlur"
                    @focus.native="focused = true"
                />
                <textarea
                    v-else-if="type === 'textarea'"
                    :placeholder="placeholder"
                    ref="focusableRef"
                    v-model="modelValue"
                    :name="field"
                    :disabled="!!disabledState"
                    @input="check"
                    @blur.native="onBlur"
                    @focus.native="focused = true"
                    rows="5" />
                <template v-else>
                    <div class="oo-input-select">
                        <div class="oo-tokens" v-if="modelValue && type === 'multi-select' && modelValue?.length > 0">
                            <div v-for="(item, i) of modelValue" class="oo-token" tabindex="0" @keydown.delete="removeItem(i)" @keydown.backspace="removeItem(i)">
                                <span class="oo-token-value">{{ item }}</span>
                                <div role="button" class="i-oo-close" title="Remove item" @click="removeItem(i, $event)"></div>
                            </div>
                        </div>
                        <div v-else-if="type === 'single-select'" class="oo-select-current-value">
                            {{ modelValue }}
                        </div>
                        <input
                            :aria-expanded="focused && showPopupList"
                            aria-haspopup="true"
                            :placeholder="placeholder"
                            type="text"
                            :disabled="!!disabledState"
                            ref="focusableRef"
                            v-model="selectInput"
                            @click="showPopup"
                            @keydown.enter="showPopupList = true"
                            @keydown.backspace="unselect"
                            @blur.native="_onBlur('input')"
                            @focus.native="_onFocus('input')"
                        />
                    </div>
                </template>
                <div class="oo-input-append">
                    <div class="i-oo-down" v-if="type && type.endsWith('-select')"></div>
                </div>
                <div v-if="type === 'password'" class="oo-show-password" @click="showPassword = !showPassword">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path v-if="showPassword" fill="currentColor" d="M12 16q1.875 0 3.188-1.313T16.5 11.5q0-1.875-1.313-3.188T12 7q-1.875 0-3.188 1.313T7.5 11.5q0 1.875 1.313 3.188T12 16Zm0-1.8q-1.125 0-1.913-.788T9.3 11.5q0-1.125.788-1.913T12 8.8q1.125 0 1.913.788T14.7 11.5q0 1.125-.787 1.913T12 14.2Zm0 4.8q-3.65 0-6.65-2.038T1 11.5q1.35-3.425 4.35-5.463T12 4q3.65 0 6.65 2.038T23 11.5q-1.35 3.425-4.35 5.463T12 19Zm0-7.5Zm0 5.5q2.825 0 5.188-1.488T20.8 11.5q-1.25-2.525-3.613-4.013T12 6Q9.175 6 6.812 7.488T3.2 11.5q1.25 2.525 3.613 4.013T12 17Z"/>
                        <path v-else fill="currentColor" d="m16.1 13.3l-1.45-1.45q.225-1.175-.675-2.2t-2.325-.8L10.2 7.4q.425-.2.863-.3T12 7q1.875 0 3.188 1.313T16.5 11.5q0 .5-.1.938t-.3.862Zm3.2 3.15l-1.45-1.4q.95-.725 1.688-1.587T20.8 11.5q-1.25-2.525-3.588-4.013T12 6q-.725 0-1.425.1T9.2 6.4L7.65 4.85q1.025-.425 2.1-.638T12 4q3.775 0 6.725 2.087T23 11.5q-.575 1.475-1.513 2.738T19.3 16.45Zm.5 6.15l-4.2-4.15q-.875.275-1.762.413T12 19q-3.775 0-6.725-2.087T1 11.5q.525-1.325 1.325-2.463T4.15 7L1.4 4.2l1.4-1.4l18.4 18.4l-1.4 1.4ZM5.55 8.4q-.725.65-1.325 1.425T3.2 11.5q1.25 2.525 3.588 4.013T12 17q.5 0 .975-.063t.975-.137l-.9-.95q-.275.075-.525.113T12 16q-1.875 0-3.188-1.312T7.5 11.5q0-.275.038-.525t.112-.525L5.55 8.4Zm7.975 2.325ZM9.75 12.6Z"/>
                    </svg>
                </div>
             </div>
            <ooListInner v-if="focused && showPopupList && type?.endsWith('select')"
                class="oo-popup"
                :style="{
                    [popupPosition[0]]: popupPosition[1],
                }"
                v-model="modelValue"
                ref="listRef"
                @blur.native="_onBlur('input')"
                @focus.native="_onFocus('input')"
                as-popup
                :rows="5"
                :type="type"
                :field="field"
                :inputs="inputs"
                :options="options || []"
                :focused="focused && showPopupList"
                :filter="selectInput"
                :label-id="labelId"
            />
        </label>
        <oo-bottom-slot
            :hint="hint"
            :disabled="!!disabledState"
            :error="(validation.error as string)"
        />
    </div>
</template>

<style>
.oo-input.oo-form-entry > label {
    position: relative;
}

.oo-list-container.oo-popup {
    position: absolute;
    left: 0;
    right: 0;
    max-height: 400px;
    background-color: var(--oo-c-background);
    padding: 0;
    margin: 0;
    z-index: 1;
    box-shadow: 0px 2px 6px rgba(0,0,0,.25);
}

.oo-input {
}

.oo-input input {
    background-color: transparent;
    height: 100%;
    width: 100%;
    border: none;
    outline: none;
    color: var(--oo-c-text);
    font-size: var(--oo-input-font-size);
}

.oo-input-like {
    position: relative;
    width: 100%;
    font-size: var(--oo-input-font-size);
    padding: var(--oo-input-padding);
    min-height: var(--oo-input-height);
    border: var(--oo-input-border-width) solid var(--oo-c-border);
    border-radius: var(--oo-border-radius);
    color: var(--oo-c-text);
    background-color: var(--oo-c-background-1);
    transition: border-color var(--oo-transition), box-shadow var(--oo-transition), background-color 0.5s ease;
    box-sizing: border-box;  
}

.oo-form-entry:not(.disabled) .oo-input-like:focus, .oo-input-like:not(.disabled):focus {
    border-color: var(--oo-c-neutral);
    outline: 2px solid var(--oo-c-neutral);
}
.oo-form-entry:not(.disabled).error .oo-input-like:focus, .oo-input-like:not(.disabled).error:focus {
    border-color: var(--oo-c-negative);
    outline: 2px solid var(--oo-c-negative);
}

.oo-input input::placeholder {
    color: var(--oo-c-text-2);
    opacity: 0.5;
}

.oo-form-entry:not(.disabled) .oo-input-like:hover, .oo-input-like:not(.disabled):hover {
    border-color: var(--oo-c-neutral);
}

.oo-input.disabled input, .oo-form-entry.disabled .oo-input-like, .oo-input-like.disabled {
    opacity: 1;
    color: var(--oo-c-gray);
    background-color: var(--oo-c-background-2);
}

.oo-form-entry:not(.disabled).error .oo-input-like, .oo-input-like:not(.disabled).error {
    border-color: var(--oo-c-negative);
}

.oo-input .oo-input-like {
    display: flex;
    align-items: center;
    justify-content: stretch;
}

.oo-input .oo-show-password {
    width: var(--oo-input-icon-size);
    margin-left: var(--oo-space-input);
    height: var(--oo-input-icon-size);
    color: var(--oo-c-text-2);
    opacity: 0.75;
    cursor: pointer;
}
.oo-input .oo-show-password svg {
    width: var(--oo-input-icon-size);
    height: var(--oo-input-icon-size);
}

.oo-input-select {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    width: 100%;
    align-items: center;
    position: relative;
}

.oo-tokens {
    display: flex;
    width: 100%;
    flex-grow: 1;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    gap: 4px;
}

.oo-tokens .oo-token {
    display: flex;
    gap: 4px;
    align-items: center;
    border: 1px solid var(--oo-c-border);
    padding: var(--oo-token-padding);
    border-radius: var(--oo-token-border-radius);
    background-color: var(--oo-c-background);
}

.oo-tokens .oo-token .oo-token-value {
    max-width: 300px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: var(--oo-token-font-size);
}

.oo-tokens .oo-token:focus, .oo-tokens .oo-token:active {
    /* border-color: var(--oo-c-neutral); */
    outline: 2px solid var(--oo-c-neutral);
}

.oo-tokens .oo-token .i-oo-close {
    opacity: 0.75;
}

.oo-select-current-value {
    flex-shrink: 1;
}

.oo-input-select input {
    width: auto!important;
}


.oo-input input,
.oo-input-like.oo-input-type-textarea textarea {
    background-color: transparent;
    height: 100%;
    width: 100%;
    border: none;
    outline: none;
    color: var(--oo-c-text);
    font-size: var(--oo-input-font-size);
    font-family: Inter, sans-serif;
}

.oo-input-like.oo-input-type-textarea textarea {
    padding: var(--oo-input-padding);
}

.oo-input-like.oo-input-type-textarea {
    height: auto;
}

</style>
