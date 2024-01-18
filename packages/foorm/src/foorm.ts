import { FtringsPool } from '@prostojs/ftring'
import { StringOrFtring, TFoormEntry, TFoormValidatorFn, TFoormFnCtx, TFoormFn, TFtring, TFoormEntryExecutable } from './types'
import { isFtring } from './utils'

export interface TFoormSubmit<S = TFtring, B = TFtring> {
    text: string | S
    disabled?: boolean | B
}

export interface TFoormOptions {
    title?: StringOrFtring
    entries: TFoormEntry[]
    submit?: TFoormSubmit
}

export class Foorm {
    protected entries: TFoormEntry[]

    protected submit?: TFoormSubmit

    protected title?: StringOrFtring

    private fns!: FtringsPool<string | boolean, TFoormFnCtx>

    constructor(opts?: TFoormOptions) {
        this.entries = opts?.entries || []
        this.submit = opts?.submit
        this.title = opts?.title || ''
    }

    public addEntry(entry: TFoormEntry) {
        this.entries.push(entry)
    }

    public setTitle(title: string) {
        this.title = title
    }

    public setSubmit(submit: TFoormSubmit) {
        this.submit = submit
    }

    public transportable(): Required<TFoormOptions> {
        return {
            title: this.title ?? '',
            submit: this.submit ?? { text: 'Submit' },
            entries: this.entries.map((e) => ({
                ...this.normalizeEntry(e),
                validators: (e.validators || []).filter((v) => isFtring(v)),
            })),
        }
    }

    protected normalizeEntry<T, O>(
        e: TFoormEntry<T, O>
    ): RequireProps<TFoormEntry<T, O>, 'label' | 'name' | 'type'> {
        return {
            ...e,
            name: e.name || e.field,
            label: e.label || e.field,
            type: e.type || 'text',
        }
    }

    public executable(): {
        title: string | TFoormFn<undefined, string>
        submit: {
            text: string | TFoormFn<undefined, string>
            disabled: boolean | TFoormFn<undefined, boolean>
        }
        entries: TFoormEntryExecutable[]
        } {
        if (!this.fns) this.fns = new FtringsPool()
        return {
            title: transformFtrings<undefined, string>(
                this.title || '',
                this.fns
            ),
            submit: {
                text: transformFtrings<undefined, string>(
                    this.submit?.text || 'Submit',
                    this.fns
                ),
                disabled: transformFtrings<undefined, boolean>(
                    this.submit?.disabled,
                    this.fns
                ),
            },
            entries: this.entries
                .map((e) => this.normalizeEntry(e))
                .map((e) => ({
                    ...e,
                    // strings
                    label: transformFtrings<unknown, string>(e.label, this.fns),
                    description: transformFtrings<unknown, string>(
                        e.description,
                        this.fns
                    ),
                    hint: transformFtrings<unknown, string>(e.hint, this.fns),
                    placeholder: transformFtrings<unknown, string>(
                        e.placeholder,
                        this.fns
                    ),
                    // strings || objects
                    classes: transformFtringsInObj(e.classes, this.fns),
                    styles: transformFtringsInObj<unknown, string, string>(
                        e.styles,
                        this.fns
                    ),
                    // booleans
                    optional: transformFtrings<unknown, boolean>(
                        e.optional,
                        this.fns
                    ),
                    disabled: transformFtrings<unknown, boolean>(
                        e.disabled,
                        this.fns
                    ),
                    hidden: transformFtrings<unknown, boolean>(
                        e.hidden,
                        this.fns
                    ),
                    validators: this.prepareValidators(
                        e.validators
                    ) as TFoormValidatorFn<unknown>[],
                })),
        }
    }

    prepareValidators(_validators: TFoormEntry['validators']) {
        const validators = (_validators || []).map((v) =>
            isFtring(v) ? this.fns.getFn(v.v) : v
        )
        validators.unshift(
            this.fns.getFn('entry.optional || !!v || "Required"')
        )
        return validators
    }

    getFormValidator(): (inputs: Record<string, unknown>) => {
        passed: boolean
        errors: Record<string, string>
        } {
        if (!this.fns) this.fns = new FtringsPool()
        const entries = this.executable().entries
        const fields: Record<
            string,
            { entry: TFoormEntryExecutable; validators: TFoormValidatorFn[] }
        > = {}
        for (const entry of entries) {
            if (entry.field) {
                fields[entry.field] = {
                    entry,
                    validators: this.prepareValidators(entry.validators),
                }
            }
            fields[entry.field].validators.unshift(
                this.fns.getFn('entry.optional || !!v || "Required"')
            )
        }
        return (data: Record<string, unknown>) => {
            let passed = true
            const errors: Record<string, string> = {}
            for (const [key, value] of Object.entries(fields)) {
                const evalEntry = { ...value.entry }
                const ctx: TFoormFnCtx<unknown> = {
                    v: data[key],
                    entry: {
                        field: evalEntry.field,
                        type: evalEntry.type,
                        component: evalEntry.component,
                        name: evalEntry.name,
                        length: evalEntry.length,
                    },
                    data,
                }
                if (ctx.entry) {
                    if (typeof evalEntry.disabled === 'function') {
                        ctx.entry.disabled = evalEntry.disabled =
                            evalEntry.disabled(ctx)
                    }
                    if (typeof evalEntry.optional === 'function') {
                        ctx.entry.optional = evalEntry.optional =
                            evalEntry.optional(ctx)
                    }
                    if (typeof evalEntry.hidden === 'function') {
                        ctx.entry.hidden = evalEntry.hidden =
                            evalEntry.hidden(ctx)
                    }
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const result = validate<any>({
                    v: data[key],
                    validators: value.validators,
                    entry: ctx.entry,
                    data,
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
}

export type TFoormExecutableMeta = ReturnType<Foorm['executable']>
export type TFoormExecutableEntry = TFoormExecutableMeta['entries'][number]

export function validate<T = string>(opts: TFoormFnCtx<T> & {
    validators: TFoormValidatorFn<T>[]
}) {
    for (const validator of opts.validators || []) {
        const result = validator({
            v: opts.v,
            data: opts.data,
            entry: opts.entry,
        })
        if (result !== true) {
            return {
                passed: false,
                error: result || 'Wrong value',
            }
        }
    }
    return { passed: true }
}

function transformFtrings<T, R>(
    value: undefined | R | TFtring | TFoormFn<T, R>,
    fns: FtringsPool<string | boolean, TFoormFnCtx>
): R | TFoormFn<T, R> {
    if (typeof value === 'undefined') return value as R
    return isFtring(value)
        ? (fns.getFn(value.v) as unknown as TFoormFn<T, R>)
        : value
}

function transformFtringsInObj<T = unknown, S = string, B = boolean>(
    value:
        | undefined
        | S
        | TFtring
        | TFoormFn<T, S>
        | Record<string, undefined | B | TFtring | TFoormFn<T, B>>,
    fns: FtringsPool<string | boolean, TFoormFnCtx>
): S | TFoormFn<T, S> | Record<string, B | TFoormFn<T, B>> {
    if (isFtring(value)) return transformFtrings<T, S>(value, fns)
    if (typeof value === 'function') return value
    if (typeof value === 'object' && value !== null) {
        const obj: Record<string, B | TFoormFn<T, B>> = {}
        for (const [key, val] of Object.entries(value)) {
            obj[key] = transformFtrings<T, B>(val as B, fns)
        }
        return obj
    }
    return value as S
}

type RequireProps<T, K extends keyof T> = T & Required<Pick<T, K>>
