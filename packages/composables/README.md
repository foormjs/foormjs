# @foormjs/composables

Framework-agnostic form composables with validation. Provides `useFoormForm` and `useFoormField` — headless composables that manage form state, field registration, and validation without rendering any UI.

This is the low-level validation layer used internally by `@foormjs/vue`. Most users should use `@foormjs/vue` directly.

## Install

```bash
pnpm add @foormjs/composables
# or
npm install @foormjs/composables
```

Requires `vue@^3.5` as a peer dependency.

## Composables

### `useFoormForm(options)`

Manages form state: field registry, submit handling, and validation state. Provides `TFoormState` to child fields via `provide('__foorm_form', ...)`.

**Options:**

| Option            | Type                                          | Description                      |
| ----------------- | --------------------------------------------- | -------------------------------- |
| `formData`        | `ComputedRef<TFormData>`                      | Reactive form data object        |
| `formContext`     | `ComputedRef<TContext>`                       | External context passed to rules |
| `firstValidation` | `ComputedRef<TFoormState['firstValidation']>` | When to start showing errors     |
| `submitValidator` | `TFoormSubmitValidator`                       | Validator called on submit       |

**Returns:**

| Property      | Type                                                | Description                             |
| ------------- | --------------------------------------------------- | --------------------------------------- |
| `clearErrors` | `() => void`                                        | Clears all field errors and touch state |
| `reset`       | `() => void`                                        | Resets all fields and clears errors     |
| `submit`      | `() => true \| { path: string; message: string }[]` | Validates and returns result            |
| `setErrors`   | `(errors: Record<string, string>) => void`          | Sets external errors on fields          |

### `useFoormField(options)`

Manages a single field's validation state, touch tracking, and error display. Injects `TFoormState` from the nearest parent `useFoormForm` via `inject('__foorm_form')`.

**Options:**

| Option     | Type                        | Description                   |
| ---------- | --------------------------- | ----------------------------- |
| `getValue` | `() => unknown`             | Getter for the current value  |
| `setValue` | `(v: unknown) => void`      | Setter for the current value  |
| `rules`    | `TFoormRule[]`              | Validation rules array        |
| `path`     | `() => string \| undefined` | Field path for error matching |

**Returns:**

| Property | Type                       | Description                              |
| -------- | -------------------------- | ---------------------------------------- |
| `model`  | `Ref<unknown>`             | Writable ref for v-model binding         |
| `error`  | `Ref<string \| undefined>` | Current validation error message         |
| `onBlur` | `() => void`               | Call on field blur to trigger validation |

## Validation Rules

A rule is a function `(value, formData?, context?) => true | string`. Return `true` for pass, or an error message string.

```ts
function isRequired(v: string) {
  return !!v || 'Required'
}

function minLength(n: number) {
  return (v: string) => v.length >= n || `Must be at least ${n} characters`
}
```

## Types

```ts
import type {
  TFoormState,
  TFoormRule,
  TFoormFieldCallbacks,
  TFoormFieldRegistration,
  TFoormSubmitValidator,
  UseFoormFieldOptions,
} from '@foormjs/composables'
```

### `TFoormState<TFormData, TContext>`

The state object provided to child fields via `inject('__foorm_form')`:

```ts
interface TFoormState<TFormData, TContext> {
  firstSubmitHappened: boolean
  firstValidation: 'on-change' | 'touched-on-blur' | 'on-blur' | 'on-submit' | 'none'
  register: (reg: TFoormFieldRegistration) => void
  unregister: (reg: TFoormFieldRegistration) => void
  formData: TFormData
  formContext?: TContext
}
```

### `TFoormRule<TValue, TFormData, TContext>`

```ts
type TFoormRule<TValue, TFormData, TContext> = (
  v: TValue,
  data?: TFormData,
  context?: TContext
) => boolean | string
```

## License

MIT
