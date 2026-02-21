# Types Reference — @foormjs/composables

> Type definitions for form state, validation rules, field registration, and composable options.

## Types

### TFoormState

Reactive form state object — provided via `__foorm_form` inject key.

```ts
interface TFoormState {
  firstSubmitHappened: boolean
  firstValidation: 'on-change' | 'touched-on-blur' | 'on-blur' | 'on-submit' | 'none'
  register: (id: symbol, registration: TFoormFieldRegistration) => void
  unregister: (id: symbol) => void
}
```

- `firstSubmitHappened` — set to `true` on first submit; after this, all fields show errors on change
- `firstValidation` — validation timing strategy for the form
- `register`/`unregister` — field lifecycle management (called by `useFoormField`)

### TFoormRule

Validation rule function.

```ts
type TFoormRule<TValue = any, TFormData = any, TContext = any> = (
  v: TValue,
  data?: TFormData,
  context?: TContext
) => boolean | string
```

Returns `true` for pass, `string` for error message. Rules are called with the current field value, form data, and context.

### TFoormFieldCallbacks

Callbacks provided by each field during registration.

```ts
interface TFoormFieldCallbacks {
  validate: () => boolean | string
  clearErrors: () => void
  reset: () => void
  setExternalError: (msg?: string) => void
}
```

- `validate()` — run field validation, returns `true` or error string
- `clearErrors()` — reset touched/blur state and clear all error refs
- `reset()` — reset field value to `resetValue`
- `setExternalError(msg?)` — set/clear external error (server-side)

### TFoormFieldRegistration

Field registration structure stored in form's internal registry.

```ts
interface TFoormFieldRegistration {
  path: () => string // Function returning field path (reactive)
  callbacks: TFoormFieldCallbacks
}
```

The `path` is a function (not a string) so it stays reactive when paths change dynamically (e.g., array item reordering).

### TFoormSubmitValidator

Custom whole-form validator function.

```ts
type TFoormSubmitValidator = () => Record<string, string>
```

Returns `Record<string, string>` keyed by field path. Empty object = all passed. When provided to `useFoormForm`, this replaces the default per-field iteration strategy.

### UseFoormFieldOptions

Options for `useFoormField()`.

```ts
interface UseFoormFieldOptions<TValue = any, TFormData = any, TContext = any> {
  getValue: () => TValue
  setValue: (v: TValue) => void
  rules?: TFoormRule<TValue, TFormData, TContext>[]
  path: () => string
  resetValue?: TValue // Defaults to ''
}
```

## Provide/Inject Keys

| Key                    | Type                     | Provider       | Consumer                                  |
| ---------------------- | ------------------------ | -------------- | ----------------------------------------- |
| `__foorm_form`         | `TFoormState`            | `useFoormForm` | `useFoormField`, `@foormjs/vue` internals |
| `__foorm_form_data`    | `ComputedRef<TFormData>` | `useFoormForm` | `useFoormField`, `@foormjs/vue` internals |
| `__foorm_form_context` | `ComputedRef<TContext>`  | `useFoormForm` | `useFoormField`, `@foormjs/vue` internals |
