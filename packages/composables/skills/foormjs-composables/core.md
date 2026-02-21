# Core Concepts & API — @foormjs/composables

> Form state management, field registration, validation timing strategies, and provide/inject architecture.

## Concepts

`@foormjs/composables` provides two Vue composables that manage the form–field contract:

- **`useFoormForm`** — Form-level state: field registry, submit/reset/error flow, validation timing
- **`useFoormField`** — Field-level state: model binding, validation rules, blur tracking, error display

Communication happens via Vue's `provide`/`inject`. The form provides state and data; fields inject them and register/unregister automatically on mount/unmount.

**Key design decisions:**

- Field registration uses `symbol` IDs — each field instance is unique
- Validation timing is configurable per form (not per field)
- Error priority: external (server) > submit > live validation
- Reset is two-phase: reset values first, clear errors on next tick

## Installation

```bash
pnpm add @foormjs/composables
```

Peer dependency: `vue@^3.5.0`

Typically consumed indirectly via `@foormjs/vue`. Import directly only when building custom form integrations.

## API Reference

### `useFoormForm(opts)`

Manages form-level state. Call once per form instance.

```ts
import { useFoormForm } from '@foormjs/composables'
import type { TFoormSubmitValidator } from '@foormjs/composables'

const { clearErrors, reset, submit, setErrors, foormState } = useFoormForm({
  formData: reactiveFormData,
  formContext: reactiveContext,
  firstValidation: computed(() => 'on-blur'),
  submitValidator: () => validateAll(),
})
```

**Options:**

| Option            | Type                                       | Description                                       |
| ----------------- | ------------------------------------------ | ------------------------------------------------- |
| `formData`        | `MaybeRef<TFormData>`                      | Reactive form data                                |
| `formContext`     | `MaybeRef<TContext>`                       | External context for validators                   |
| `firstValidation` | `MaybeRef<TFoormState['firstValidation']>` | Validation timing strategy                        |
| `submitValidator` | `TFoormSubmitValidator`                    | Custom whole-form validator (overrides per-field) |

**Return value:**

| Property      | Type                                       | Description                                                        |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| `clearErrors` | `() => void`                               | Clear all field errors (submit + external)                         |
| `reset`       | `() => Promise<void>`                      | Reset all fields to initial values, then clear errors on next tick |
| `submit`      | `() => true \| { path, message }[]`        | Validate and submit; returns `true` or error array                 |
| `setErrors`   | `(errors: Record<string, string>) => void` | Set external errors by field path                                  |
| `foormState`  | `reactive<TFoormState>`                    | Reactive form state object                                         |

**Submit behavior:**

1. Sets `foormState.firstSubmitHappened = true`
2. If `submitValidator` provided → calls it, returns errors or `true`
3. Otherwise → iterates registered fields' `callbacks.validate()`, collects errors
4. Returns `true` if all pass, or `{ path, message }[]` array

**Provides (via Vue `provide()`):**

| Key                    | Type                     | Description                                                  |
| ---------------------- | ------------------------ | ------------------------------------------------------------ |
| `__foorm_form`         | `TFoormState`            | Reactive form state (validation config, register/unregister) |
| `__foorm_form_data`    | `ComputedRef<TFormData>` | Form data wrapper                                            |
| `__foorm_form_context` | `ComputedRef<TContext>`  | External context wrapper                                     |

### `useFoormField(opts)`

Manages single field state. Call once per field instance. Automatically registers with the parent form (if present).

```ts
import { useFoormField } from '@foormjs/composables'

const { model, error, onBlur } = useFoormField({
  getValue: () => data.email,
  setValue: v => {
    data.email = v
  },
  rules: [emailRule],
  path: () => 'email',
  resetValue: '',
})
```

**Options (`UseFoormFieldOptions`):**

| Option       | Type                  | Description                       |
| ------------ | --------------------- | --------------------------------- |
| `getValue`   | `() => TValue`        | Getter for field value            |
| `setValue`   | `(v: TValue) => void` | Setter for field value            |
| `rules`      | `TFoormRule[]`        | Validation rules array            |
| `path`       | `() => string`        | Function returning field path     |
| `resetValue` | `TValue`              | Value to reset to (default: `''`) |

**Return value:**

| Property | Type                               | Description                                          |
| -------- | ---------------------------------- | ---------------------------------------------------- |
| `model`  | `ComputedRef<TValue>`              | Computed with getter/setter; setter marks as touched |
| `error`  | `ComputedRef<string \| undefined>` | Current error message (respects timing)              |
| `onBlur` | `() => void`                       | Call on blur to trigger validation timing            |

**Injects (from parent form):**

| Key                    | Type                     | Fallback                           |
| ---------------------- | ------------------------ | ---------------------------------- |
| `__foorm_form`         | `TFoormState`            | undefined (field works standalone) |
| `__foorm_form_data`    | `ComputedRef<TFormData>` | computed(undefined)                |
| `__foorm_form_context` | `ComputedRef<TContext>`  | computed(undefined)                |

**Registration lifecycle:**

- On setup: registers with form via `foormState.register(symbol, { path, callbacks })`
- Callbacks: `validate()`, `clearErrors()`, `reset()`, `setExternalError(msg?)`
- On unmount: unregisters via `foormState.unregister(symbol)`
- If no form context (standalone field): still works, just no form-level coordination

## Validation Timing

The `firstValidation` option controls when errors first appear for each field:

| Value               | Behavior                                                      |
| ------------------- | ------------------------------------------------------------- |
| `'on-change'`       | Show errors immediately as the user types (default)           |
| `'touched-on-blur'` | Show errors after the field loses focus AND has been modified |
| `'on-blur'`         | Show errors when the field loses focus                        |
| `'on-submit'`       | No errors until form submit                                   |
| `'none'`            | Never auto-validate (manual only)                             |

After `foormState.firstSubmitHappened` becomes `true`, all fields show errors on change regardless of this setting.

## Error Priority

The `error` computed resolves in this order (first non-empty wins):

1. **External error** — set via `setErrors()` (e.g., server-side validation)
2. **Submit error** — set during `submit()` validation pass
3. **Live validation** — from `rules` evaluation (only if `isValidationActive`)
4. `undefined` — no error

External errors are cleared when the field value changes. Submit errors are cleared on next change after display.

## Common Patterns

### Pattern: Custom submit validator (bypass per-field iteration)

```ts
const { submit } = useFoormForm({
  formData,
  submitValidator: () => {
    // Use ATScript's getFormValidator instead of per-field rules
    return getFormValidator(def)({ data: formData.value })
  },
})
```

### Pattern: Server-side error display

```ts
const { setErrors } = useFoormForm({ formData })

async function handleSubmit(data: Record<string, unknown>) {
  const result = await api.submit(data)
  if (result.errors) {
    setErrors(result.errors) // { email: 'Already taken', ... }
  }
}
```

### Pattern: Standalone field (no form)

```ts
// useFoormField works without a parent form — just no form-level coordination
const { model, error, onBlur } = useFoormField({
  getValue: () => inputValue.value,
  setValue: v => {
    inputValue.value = v
  },
  rules: [v => v.length > 0 || 'Required'],
  path: () => 'standalone',
})
```

## Gotchas

- `useFoormForm` must be called in a component that's an ancestor of all field components (provide/inject scope)
- `reset()` is async — it resets values, waits a tick, then clears errors (order matters for watchers)
- `model.value` setter marks the field as `touched` — programmatic value changes via `setValue` do too
- Rules receive the unwrapped value, not the reactive ref — `(v, data, context) => boolean | string`
- `TFoormRule` returns `true` for pass, `string` for error — not `false` for error
- Fields unregister on unmount — dynamic fields (v-if) re-register when shown again
