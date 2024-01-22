import { FtringsPool } from '@prostojs/ftring'
import { StringOrFtring, TFoormEntry, TFoormValidatorFn, TFoormFnScope, TFoormFn, TFtring, TFoormEntryExecutable, TFoormMetaExecutable } from './types'
import { isFtring } from './utils'

export interface TFoormSubmit<S = TFtring, B = TFtring> {
    text: string | S
    disabled?: boolean | B
}

export interface TFoormOptions {
    title?: StringOrFtring
    entries: TFoormEntry[]
    submit?: TFoormSubmit
    context?: Record<string, unknown>
}

export class Foorm {
    protected entries: TFoormEntry[]

    protected submit?: TFoormSubmit

    protected title?: StringOrFtring

    protected context: Record<string, unknown>

    private fns!: FtringsPool<string | boolean, TFoormFnScope>

    constructor(opts?: TFoormOptions) {
        this.entries = opts?.entries || []
        this.submit = opts?.submit
        this.title = opts?.title || ''
        this.context = opts?.context || {}
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

    public setContext<T extends Record<string, unknown>>(context: T) {
        this.context = context
    }

    /**
     * Normalizes form metadata and removes all the functions
     * from validators.
     *
     * @param replaceContext a context to be transported along with metadata
     * @returns form metadata without functions
     */
    public transportable<T extends Record<string, unknown>>(
        replaceContext?: T,
        replaceValues?: Record<string, unknown>,
    ): Required<TFoormOptions> & { context?: Record<string, unknown> } {
        return {
            title: this.title ?? '',
            submit: this.submit ?? { text: 'Submit' },
            context: replaceContext || this.context,
            entries: this.entries.map((e) => ({
                ...e,
                value: replaceValues ? replaceValues[e.field] as typeof e.value : e.value,
                validators: (e.validators || []).filter((v) => isFtring(v)),
            })),
        }
    }

    protected normalizeEntry<T, O>(
        e: TFoormEntry<T, O>
    ): TFoormEntry<T, O> & {
        name: string
        label: string | TFtring
        type: string
    } {
        return {
            ...e,
            name: e.name || e.field,
            label: e.label || e.field,
            type: e.type || 'text',
        }
    }

    /**
     * Evaluates all the ftrings into functions, makes it ready for execution
     *
     * @returns form metadata with functions
     */
    public executable(): TFoormMetaExecutable {
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
            context: this.context,
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

    createFormData<T extends Record<string, unknown>>(): T {
        const data: T = {} as T
        for (const entry of this.entries) {
            if (entry.type !== 'action') {
                data[entry.field as keyof T] = (entry.value ||
                    undefined) as T[keyof T]
            }
        }
        return data
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

    supportsAltAction(altAction: string) {
        return !!this.entries.find((e) => e.altAction === altAction)
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
                const scope: TFoormFnScope<unknown> = {
                    v: data[key],
                    context: this.context,
                    entry: {
                        field: evalEntry.field,
                        type: evalEntry.type,
                        component: evalEntry.component,
                        name: evalEntry.name,
                        length: evalEntry.length,
                    },
                    data,
                }
                if (scope.entry) {
                    if (typeof evalEntry.disabled === 'function') {
                        scope.entry.disabled = evalEntry.disabled =
                            evalEntry.disabled(scope)
                    } else {
                        scope.entry.disabled = evalEntry.disabled
                    }
                    if (typeof evalEntry.optional === 'function') {
                        scope.entry.optional = evalEntry.optional =
                            evalEntry.optional(scope)
                    } else {
                        scope.entry.optional = evalEntry.optional
                    }
                    if (typeof evalEntry.hidden === 'function') {
                        scope.entry.hidden = evalEntry.hidden =
                            evalEntry.hidden(scope)
                    } else {
                        scope.entry.hidden = evalEntry.hidden
                    }
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const result = validate<any>({
                    v: data[key],
                    context: this.context,
                    validators: value.validators,
                    entry: scope.entry,
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

export function validate<T = string>(opts: TFoormFnScope<T> & {
    validators: TFoormValidatorFn<T>[]
}) {
    for (const validator of opts.validators || []) {
        const result = validator({
            v: opts.v,
            context: opts.context,
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
    fns: FtringsPool<string | boolean, TFoormFnScope>
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
    fns: FtringsPool<string | boolean, TFoormFnScope>
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
