<script setup lang="ts">
import OoBottomSlot from '../oo-bottom-slot.vue'
import { nextTick, watch } from 'vue'
import type { TFeProps } from './types'
import { useEntryRefs } from '../../composables/entry-refs'
import OoLabel from '../oo-label.vue'

const modelValue = defineModel<string>({ local: true })
const props = defineProps<TFeProps>()

function length() { return props.length || 4 }

const { classes, disabledState, validation, focused, onBlur, focusableRef, focus } = useEntryRefs(modelValue, props)
const filler = '•'
modelValue.value = filler.repeat(length())
function onInput(event: KeyboardEvent) {
    if (disabledState.value) return
    if (event.ctrlKey) return
    if (event.key === 'Tab') return
    if (event.key === 'Escape') return
    event.preventDefault()
    const toFocus = focusableRef.value as HTMLElement[]
    const div = event.target as HTMLDivElement
    const n = Number(div.dataset.n) - 1
    if (!modelValue.value) modelValue.value = filler.repeat(length())
    const val = modelValue.value as string
    if (event.key.match(/^\d$/)) {
        modelValue.value = val.slice(0, n) + event.key + val.slice(n + 1)
        if (!next() && modelValue.value.match(/^\d+$/)) {
            nextTick(() => emit('input', modelValue.value as string))
        }
    } else if (event.key === 'ArrowUp') {
        const nVal = Number(val[n])
        const num = (Number.isNaN(nVal) ? 0 : nVal) + 1
        modelValue.value = val.slice(0, n) + Math.min(9, num) + val.slice(n + 1)
    } else if (event.key === 'ArrowDown') {
        const nVal = Number(val[n])
        const num = (Number.isNaN(nVal) ? 0 : nVal) - 1
        modelValue.value = val.slice(0, n) + Math.max(0, num) + val.slice(n + 1)
    } else if (event.key === 'ArrowLeft') {
        prev()
    } else if (event.key === 'ArrowRight') {
        next()
    } else if (event.key === 'Backspace') {
        let nToErase = n
        if (modelValue.value && modelValue.value[n] === filler) {
            nToErase--
        }
        modelValue.value = val.slice(0, nToErase) + filler + val.slice(nToErase + 1)
        prev()
    } else if (event.key === 'Delete') {
        modelValue.value = val.slice(0, n) + filler + val.slice(n + 1)
    } else if (event.key === 'Home') {
        toFocus && toFocus[0].focus()
    } else if (event.key === 'End') {
        const lastDigid = findLastDigitIndex(val)
        toFocus && toFocus[Math.min(lastDigid + 1, length() - 1)].focus()
    } else if (event.key === 'Enter') {
        if (modelValue.value && modelValue.value.match(/^\d+$/)) {
            emit('input', modelValue.value)
        }
    }
    function next() {
        if (toFocus && toFocus[n + 1]) {
            toFocus[n + 1].focus()
            return true
        }
        return false
    }
    function prev() {
        if (toFocus && toFocus[n - 1]) {
            toFocus[n - 1].focus()
            return true
        }
        return false
    }
}

const emit = defineEmits<{
    (event: 'input', pin: string): void
}>()

watch(modelValue, () => {
    if (!modelValue.value) {
        focus()
    }
})

function findLastDigitIndex(str: string) {
    for (let i = str.length - 1; i >= 0; i--) {
        if (str[i] >= '0' && str[i] <= '9') {
            return i;
        }
    }
    return -1;
}

function onPaste(event: ClipboardEvent) {
    event.preventDefault()
    const toFocus = focusableRef.value as HTMLElement[]
    const digits = event.clipboardData?.getData('text').match(/\d/g)
    if (digits) {
        modelValue.value = digits.join('').slice(0, length())
        if (modelValue.value.length < length()) {
            const index = modelValue.value.length
            modelValue.value = (modelValue.value + filler.repeat(length())).slice(0, length())
            toFocus && toFocus[index].focus()
        } else {
            nextTick(() => {
                if (modelValue.value && modelValue.value.match(/^\d+$/)) {
                    emit('input', modelValue.value)
                }
            })
        }
    }
}

</script>

<template>
    <div class="oo-form-entry" :class="classes">

        <oo-label :class="{ 'oo-required': !optional }" :id="id + '-label'" v-if="!!label">{{ label }}</oo-label>
        <div class="oo-pin"
        :class="{ ['oo-pin-' + length()]: true, disabled: disabledState }"
        :id="id"
        :aria-labelledby="id + '-label'">
            <div ref="focusableRef"
            class="oo-input-like"
            :class="{ disabled: disabledState }"
            v-for="n in length()"
            :key="n + ''"
            @keydown="onInput"
            @paste="onPaste"
            @blur="onBlur"
            @focus="focused = true"
            :data-n="n"
            :tabindex="disabledState ? '' : '0'"
            :disabled="disabledState"
            :contenteditable="!disabledState"
            inputmode="numeric"
            :aria-label="`${ label }: digit number ${ n }`">
                <div class="oo-pin-flipper" :class="{ 'flipped': modelValue && modelValue[n - 1].match(/\d/) }" aria-hidden="true">
                    <span class="oo-pin-filler"></span>
                    <span class="oo-pin-value" v-if="!!modelValue">{{ modelValue[n - 1] }}</span>
                </div>
            </div>
        </div>
        <oo-bottom-slot
            :hint="hint"
            :disabled="!!disabledState"
            :error="(validation.error as string)"
        />
    </div>
</template>

<style>

.oo-pin-flipper {
    width: 100%;
    height: 100%;
    position: absolute;
    transform-style: preserve-3d;
    transition: transform .2s;
}

.oo-pin-flipper.flipped {
    transform: rotateY(180deg);
}

.oo-pin-filler, .oo-pin-value {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border-radius: var(--oo-border-radius);
    overflow: hidden;
    background-color: var(--oo-c-background-2); 
    transition: background-color 0.5s ease;
}

.oo-pin-value {
    transform: rotateY(180deg);
}

.oo-pin {
    display: flex;
    justify-content: flex-start;
}

.oo-pin .oo-input-like {
    width: auto;
    flex-grow: 1;
    height: 40px;
    position: relative;
    margin-right: 4px;
    padding: 0;
    text-align: center;
    font-size: 20px;
    cursor: text;
    perspective: 300px; 
    background-color: var(--oo-c-background);
    caret-color: transparent;
    cursor: text;
}

.oo-pin.disabled .oo-input-like {
    cursor: default;
}

span.oo-pin-label {
    text-align: center;
    width: 100%;
    display: inline-block;
    padding: 10px 0;
}

.oo-pin-5 .oo-input-like:nth-child(3) {
    margin-right: 20px;
}
.oo-pin-5 .oo-input-like:nth-child(3):after {
    content: "-";
    position: absolute;
    right: -14px;
    top: 2px;
}

.oo-pin-5 .oo-input-like:nth-child(3), .oo-pin-6 .oo-input-like:nth-child(3), .oo-pin-7 .oo-input-like:nth-child(3), .oo-pin-9 .oo-input-like:nth-child(3), .oo-pin-9 .oo-input-like:nth-child(6) {
    margin-right: 20px;
}
.oo-pin-5 .oo-input-like:nth-child(3):after, .oo-pin-6 .oo-input-like:nth-child(3):after, .oo-pin-7 .oo-input-like:nth-child(3):after, .oo-pin-9 .oo-input-like:nth-child(3):after, .oo-pin-9 .oo-input-like:nth-child(6):after {
    content: "-";
    position: absolute;
    right: -14px;
    top: 2px;
}
.oo-pin-8 .oo-input-like:nth-child(4) {
    margin-right: 20px;
}
.oo-pin-8 .oo-input-like:nth-child(4):after {
    content: "-";
    position: absolute;
    right: -14px;
    top: 2px;
}

.oo-pin span {
    padding: 0 4px;
}

.oo-pin:not(.disabled) .oo-input-like:focus span {
    background-color: var(--oo-c-neutral);
    color: white;
}
.oo-pin p {
    display: none;
}
</style>
