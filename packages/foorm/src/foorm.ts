import { FtringsPool } from '@prostojs/ftring'
import { TDynamicFnCtx, TDynamicFn, TFoormEntry, TFoormEntryUI } from './types'

export class Foorm {
    public title: string

    public defaultAction: string

    protected type = 'foorm'

    private fns!: FtringsPool<ReturnType<TDynamicFn>, TDynamicFnCtx>

    protected entries: TFoormEntry[]

    constructor(opts?: { title: string, entries?: TFoormEntry[], defaultAction?: string }) {
        this.title = opts?.title || ''
        this.defaultAction = opts?.defaultAction || ''
        this.entries = opts?.entries || []
    }

    getField(name: string) {
        return this.entries.find(e => e.field === name)
    }

    setValue(field: string, value: unknown) {
        const entry = this.entries.find(e => e.field === field)
        if (entry) entry.value = value
    }

    getEntries(): TFoormEntry[] {
        return this.entries
    }

    setEntries(entries: TFoormEntry[]) {
        this.entries = entries
    }

    getFormValidator(): ((inputs: Record<string, unknown>) => { passed: boolean, errors: Record<string, string> }) {
        if (!this.fns) this.fns = new FtringsPool()
        const fields: Record<string, { entry: TFoormEntry, validators: TDynamicFn[] }> = {}
        for (const entry of this.entries) {
            if (entry.validators && entry.field) {
                fields[entry.field] = {
                    entry,
                    validators: entry.validators.map(v => this.fns.getFn(v)),
                }
                if (!entry.optional) fields[entry.field].validators.unshift(this.fns.getFn('!!v || "Required"'))
            }
        }
        return (inputs: Record<string, unknown>) => {
            let passed = true
            const errors: Record<string, string> = {}
            for (const [key, value] of Object.entries(fields)) {
                const result = validate({
                    v: inputs[key],
                    validators: value.validators,
                    entry: value.entry,
                    inputs,
                })
                if (!result.passed) {
                    passed = false
                    if (!errors[key]) {
                        errors[key] = result.error || 'Wrong value'
                    }
                }
            }
            return {
                passed,
                errors,
            }
        }
    }

    genUIEntries(): TFoormEntryUI[] {
        if (!this.fns) this.fns = new FtringsPool()
        let autoFocusAttached = false
        const uiEntries: TFoormEntryUI[] = []
        for (const entry of this.entries) {
            const uiEntry = Object.assign({}, entry) as TFoormEntryUI

            // apply autofocus to the first focusable element of this form
            if (!autoFocusAttached && entry.focusable) {
                autoFocusAttached = true
                uiEntry.autoFocus = true
            }

            // create dynamic validators
            if (entry.validators) {
                uiEntry.validators = entry.validators.map(v => this.fns.getFn(v))
                if (!entry.optional) uiEntry.validators.unshift(this.fns.getFn('!!v || "Required"'))
            }
            // create dynamic classes
            if (entry.classes) {
                if (typeof entry.classes === 'string') {
                    uiEntry.classes = this.fns.getFn(entry.classes)
                } else {
                    uiEntry.classes = {}
                    for (const [key, value] of Object.entries(entry.classes)) {
                        uiEntry.classes[key] = this.fns.getFn(value)
                    }
                }
            }
            // create dynamic disabled
            if (entry.disabled) {
                uiEntry.disabled = this.fns.getFn(entry.disabled)
            }

            uiEntries.push(uiEntry)

            // assign next focus on enter
            let next: TFoormEntryUI | undefined = undefined
            for (let i = uiEntries.length - 1; i >= 0; i--) {
                const uiEntry = uiEntries[i]
                uiEntry.id = [uiEntry.field, uiEntry.action || '', uiEntry.type, i].join('-')
                if (uiEntry.nextFocusable) {
                    if (next) {
                        uiEntry.next = next
                    }
                    next = uiEntry
                }
            }
        }

        return uiEntries
    }
}

export function validate(opts: {
    v: unknown,
    inputs?: Record<string, unknown>
    entry?: TFoormEntry
    validators: TDynamicFn[]
}) {
    for (const validator of (opts.validators || [])) {
        const result = validator({ v: opts.v || '', inputs: opts.inputs, entry: opts.entry })
        if (result !== true) {
            return {
                passed: false,
                error: (result || 'Wrong value'),
            }
        }
    }
    return { passed: true }
}
