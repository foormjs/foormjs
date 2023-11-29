import { computed, ref, watchEffect, watch, onMounted, nextTick } from 'vue'
import type { Ref } from 'vue'
import { validate, TDynamicFn, TDynamicFnCtx } from 'foorm'
import type { TFeProps, TFeActionProps } from '../components/fe'

export function useEntryRefs(v: Ref<unknown> | undefined, entry: TFeProps) {
    const disabledState = useFnAsComputed(entry.disabled, { v: v?.value, entry, inputs: entry.inputs })
    const classes = computed(() => {
        const o: Record<string, boolean> = {}
        if (typeof entry.classes === 'function') {
            o[entry.classes({ v: v?.value, entry, inputs: entry.inputs }) as string] = true
        } else if (typeof entry.classes === 'object') {
            for (const [key, value] of Object.entries(entry.classes)) {
                o[key] = !!value({ v: v?.value, entry, inputs: entry.inputs })
            }
        }
        return Object.assign({ focused: focused.value, disabled: disabledState.value, error: !validation.value.passed }, o)
    })

    if (v) {
        updateValue()
        watch(() => entry.value, updateValue)
    }
    function updateValue() {
        if (typeof entry.value !== 'undefined' && v) {
            v.value = entry.value
        }
    }

    const validationActive = ref(false)
    if (v) {
        watchEffect(() => {
            if (validationActive.value && entry.enableValidation) {
                validation.value = validate({ v: v.value, inputs: entry.inputs, validators: entry.validators || [] })
            }
        })
    }
    const validation = ref<ReturnType<typeof validate>>({ error: '', passed: true })
    updatePropsError()
    watch(() => entry.error, updatePropsError)
    function updatePropsError() {
        if (entry.error) {
            validation.value.passed = false
            validation.value.error = entry.error
        } else {
            validation.value.passed = true
            validation.value.error = ''
        }
    }

    const focused = ref(false)
    function check() { validationActive.value = true  }
    function onBlur() {
        focused.value = false
        check()
    }
    const focusableRef = ref<HTMLElement | HTMLElement[]>()
    onMounted(() => {
        if (entry.focusable && entry.autoFocus) {
            focus()
        }
    })
    function focus() {
        void nextTick(() => {
            if (focusableRef.value) {
                let toFocus
                if (Array.isArray(focusableRef.value)) {
                    toFocus = focusableRef.value[0]
                } else {
                    toFocus = focusableRef.value
                }
                if (typeof toFocus.focus === 'function') {
                    toFocus.focus()
                }
            }
        })
    }
    return {
        disabledState,
        classes,
        validation,
        focused,
        check,
        onBlur,
        focusableRef,
        focus,
    }
}

function useFnAsComputed<T>(fn: TDynamicFn<T> | undefined, ctx: TDynamicFnCtx) {
    return computed<T>(() => (!!fn && fn(ctx)) as T)
}

export function useActionRefs(action: TFeActionProps) {
    const disabledState = useFnAsComputed(action.disabled, { action, inputs: action.inputs })
    const classes = computed(() => {
        const o: Record<string, boolean> = {}
        if (typeof action.classes === 'function') {
            o[action.classes({ action, inputs: action.inputs }) as string] = true
        } else if (typeof action.classes === 'object') {
            for (const [key, value] of Object.entries(action.classes)) {
                o[key] = !!value({ action, inputs: action.inputs })
            }
        }
        return Object.assign({ disabled: disabledState.value }, o)
    })

    return {
        disabledState,
        classes,
    }
}
