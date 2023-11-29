import { FtringsPool } from '@prostojs/ftring'
import { TDynamicFnCtx, TDynamicFn, TFoormEntry, TFoormEntryUI, TFoormAction, TFoormUiMetadata, TFoormActionUI } from './types'

export class Foorm {
    public title: string

    protected type = 'foorm'

    private fns!: FtringsPool<ReturnType<TDynamicFn>, TDynamicFnCtx>

    protected entries: TFoormEntry[]
    
    protected actions: TFoormAction[]

    constructor(opts?: { title: string, entries?: TFoormEntry[], actions?: TFoormAction[] }) {
        this.title = opts?.title || ''
        this.entries = opts?.entries || []
        this.actions = opts?.actions || []
    }

    getField(name: string) {
        return this.entries.find(e => e.field === name)
    }

    setValue(field: string, value: unknown) {
        const entry = this.entries.find(e => e.field === field)
        if (entry) entry.value = value
    }

    getEntries(): TFoormEntry[] {
        this.entries.forEach(e => {
            if (!e.validators) e.validators = []
        })
        return this.entries
    }

    setEntries(entries: TFoormEntry[]) {
        this.entries = entries
    }

    getActions(): TFoormAction[] {
        return this.actions
    }

    setActions(actions: TFoormAction[]) {
        this.actions = actions
    }

    getFormValidator(): ((inputs: Record<string, unknown>) => { passed: boolean, errors: Record<string, string> }) {
        if (!this.fns) this.fns = new FtringsPool()
        const fields: Record<string, { entry: TFoormEntry, validators: TDynamicFn[] }> = {}
        for (const entry of this.getEntries()) {
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
        for (const entry of this.getEntries()) {
            const uiEntry = Object.assign({}, entry) as TFoormEntryUI

            // apply autofocus to the first focusable element of this form
            if (!autoFocusAttached && entry.focusable) {
                autoFocusAttached = true
                uiEntry.autoFocus = true
            }

            // create dynamic validators
            if (entry.validators) {
                uiEntry.validators = entry.validators.map(v => this.fns.getFn(v))
            }
            if (!uiEntry.validators) uiEntry.validators = []
            if (!entry.optional) uiEntry.validators.unshift(entry.type === 'multi-select' ? this.fns.getFn('(!!v && !!v.length) || "Required"') : this.fns.getFn('!!v || "Required"'))
            // create dynamic classes
            if (entry.classes) {
                uiEntry.classes = evalFtringObject(entry.classes, this.fns)
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
                uiEntry.id = [uiEntry.field, uiEntry.type, i].join('-')
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

    genUiActions(): TFoormActionUI[] {
        const uiActions: TFoormActionUI[] = []
        for (const action of this.getActions()) {
            uiActions.push({
                classes: action.classes && evalFtringObject(action.classes, this.fns) || undefined,
                text: action.text,
                type: action.type,
                action: action.action,
                isDefault: action.isDefault,
                disabled: action.disabled ? this.fns.getFn(action.disabled) : undefined
            })
        }
        return uiActions
    }

    getUiMetadata(): TFoormUiMetadata {
        return {
            title: this.title,
            entries: this.genUIEntries(),
            actions: this.genUiActions(),
        }
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

function evalFtringObject(o: string | Record<string, string>, ftring: FtringsPool<ReturnType<TDynamicFn>, TDynamicFnCtx>): ((__ctx__: TDynamicFnCtx) => string | boolean) | Record<string, (__ctx__: TDynamicFnCtx) => string | boolean> {
    let result: ((__ctx__: TDynamicFnCtx) => string | boolean) | Record<string, (__ctx__: TDynamicFnCtx) => string | boolean>
    if (typeof o === 'string') {
        result = ftring.getFn(o)
    } else {
        result = {}
        for (const [key, value] of Object.entries(o)) {
            result[key] = ftring.getFn(value)
        }
    }
    return result
}
