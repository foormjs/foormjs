/* eslint-disable no-inner-declarations */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  TComputed,
  TFoormEntry,
  TFoormEntryOptions,
  TFoormFnScope,
  TFoormMetaExecutable,
} from './types'
import { evalParameter } from './utils'

export interface TFoormOptions<D, C> {
  title?: TComputed<string, D, C>
  entries: Array<TFoormEntry<any, D, C, TFoormEntryOptions>>
  submit?: TFoormMetaExecutable<D, C>['submit']
  context?: C
}

export class Foorm<D = any, C = any> {
  protected entries: Array<TFoormEntry<any, D, C, TFoormEntryOptions>>

  protected submit?: TFoormMetaExecutable<D, C>['submit']

  protected title?: TComputed<string, D, C>

  protected context: C

  // private fns!: FNPool<string | boolean, TFoormFnScope>

  constructor(opts?: TFoormOptions<D, C>) {
    this.entries = opts?.entries || []
    this.submit = opts?.submit
    this.title = opts?.title || ''
    this.context = opts?.context || ({} as C)
  }

  public addEntry<V>(entry: TFoormEntry<V, D, C, TFoormEntryOptions>) {
    this.entries.push(entry as TFoormEntry<unknown, D, C, TFoormEntryOptions>)
  }

  public setTitle(title: string) {
    this.title = title
  }

  public setSubmit(submit: TFoormMetaExecutable<D, C>['submit']) {
    this.submit = submit
  }

  public setContext(context: C) {
    this.context = context
  }

  getDefinition() {
    return {
      title: this.title,
      submit: this.submit || ({ text: 'Submit' } as TFoormMetaExecutable<D, C>['submit']),
      context: this.context,
      entries: this.entries,
    }
  }

  protected normalizeEntry<V, O extends TFoormEntryOptions>(
    e: TFoormEntry<V, D, C, O>
  ): TFoormEntry<V, D, C, O> & {
    name: string
    label: TComputed<string, D, C>
    type: string
  } {
    return {
      ...e,
      name: e.name || e.field,
      label: (e.label || e.field) as string,
      type: e.type || 'text',
    }
  }

  public executable(): TFoormMetaExecutable<D, C> {
    return {
      title: this.title || '',
      submit: this.submit || ({ text: 'Submit' } as TFoormMetaExecutable<D, C>['submit']),
      context: this.context,
      entries: this.entries.map(e => this.normalizeEntry(e)),
    }
  }

  createFormData<T extends Record<string, unknown>>(): T {
    const data: T = {} as T
    for (const entry of this.entries) {
      if (entry.type !== 'action') {
        data[entry.field as keyof T] = (entry.value || undefined) as T[keyof T]
      }
    }
    return data
  }

  prepareValidators(_validators: TFoormEntry<any, D, C, TFoormEntryOptions>['validators']) {
    const validators =
      _validators || ([] as Required<TFoormEntry<any, D, C, TFoormEntryOptions>>['validators'])
    validators.unshift((v, _d, _c, entry) => entry.optional || !!v || 'Required')
    return validators
  }

  supportsAltAction(altAction: string) {
    return !!this.entries.some(e => e.altAction === altAction)
  }

  getFormValidator(): (inputs: Record<string, unknown>) => {
    passed: boolean
    errors: Record<string, string>
  } {
    const entries = this.executable().entries
    const fields: Record<
      string,
      {
        entry: TFoormEntry<any, D, C, TFoormEntryOptions>
        validators: TFoormEntry<any, D, C, TFoormEntryOptions>['validators']
      }
    > = {}
    for (const entry of entries) {
      if (entry.field) {
        const validators = this.prepareValidators(entry.validators)
        fields[entry.field] = {
          entry,
          validators,
        }
        fields[entry.field].validators = validators
      }
    }
    return (data: Record<string, unknown>) => {
      let passed = true
      const errors: Record<string, string> = {}
      for (const [key, value] of Object.entries(fields)) {
        const evalEntry = { ...value.entry }
        const scope: TFoormFnScope<any, D, C> = {
          v: data[key],
          context: this.context,
          entry: {
            field: evalEntry.field,
            type: evalEntry.type!,
            component: evalEntry.component,
            name: evalEntry.name!,
            length: evalEntry.length,
          },
          data: data as D,
        }

        if (scope.entry) {
          scope.entry.disabled = evalParameter<boolean>(evalEntry.disabled as boolean, scope, true)
          scope.entry.optional = evalParameter<boolean>(evalEntry.optional as boolean, scope, true)
          scope.entry.hidden = evalParameter<boolean>(evalEntry.hidden as boolean, scope, true)
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = validate<any, D, C>({
          v: data[key],
          context: this.context,
          validators: value.validators,
          entry: scope.entry,
          data: data as D,
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

export function validate<V, D, C>(
  opts: TFoormFnScope<V, D, C> & {
    validators: TFoormEntry<any, D, C, TFoormEntryOptions>['validators']
  }
) {
  for (const validator of opts.validators || []) {
    const result = evalParameter(
      validator,
      {
        v: opts.v,
        context: opts.context,
        data: opts.data,
        entry: opts.entry,
      },
      true
    )
    if (result !== true) {
      return {
        passed: false,
        error: result || 'Wrong value',
      }
    }
  }
  return { passed: true }
}
