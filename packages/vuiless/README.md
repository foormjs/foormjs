# @foormjs/vuiless

Renderless Vue form components with validation. Provides `VuilessForm` and `VuilessField` — headless wrappers that manage form state, field registration, and validation without rendering any UI.

This is the low-level validation layer used internally by `@foormjs/vue`. Most users should use `@foormjs/vue` directly.

## Install

```bash
pnpm add @foormjs/vuiless
# or
npm install @foormjs/vuiless
```

Requires `vue@^3.5` as a peer dependency.

## Components

### `VuilessForm`

Renders a `<form>` element. Manages a field registry, handles submit, and provides validation state to child `VuilessField` instances via `provide`/`inject`.

**Props:**

| Prop              | Type                                                                  | Default       | Description                         |
| ----------------- | --------------------------------------------------------------------- | ------------- | ----------------------------------- |
| `formData`        | `TFormData`                                                           | (required)    | Reactive form data object           |
| `formContext`     | `TContext`                                                            | `undefined`   | External context passed to rules    |
| `firstValidation` | `'on-change' \| 'touched-on-blur' \| 'on-blur' \| 'on-submit' \| 'none'` | `'on-change'` | When to start showing errors        |

**Events:**

| Event    | Payload    | Description                              |
| -------- | ---------- | ---------------------------------------- |
| `submit` | `formData` | Emitted on valid submit (no field errors) |

**Slot Scope:**

| Property      | Type         | Description                            |
| ------------- | ------------ | -------------------------------------- |
| `clearErrors` | `() => void` | Clears all field errors and touch state |
| `reset`       | `() => void` | Resets all fields and clears errors    |

```vue
<VuilessForm :form-data="data" first-validation="on-blur" @submit="onSubmit" v-slot="{ clearErrors, reset }">
  <!-- VuilessField children auto-register -->
</VuilessForm>
```

### `VuilessField`

Renderless field wrapper. Manages a single field's validation state, touch tracking, and error display. Registers with the nearest parent `VuilessForm`.

**Props:**

| Prop         | Type                                    | Description                      |
| ------------ | --------------------------------------- | -------------------------------- |
| `modelValue` | `TValue`                                | Field value (v-model)            |
| `rules`      | `TVuilessRule<TValue, TFormData, TContext>[]` | Validation rules array     |

**Slot Scope:**

| Property      | Type                       | Description                                |
| ------------- | -------------------------- | ------------------------------------------ |
| `onBlur`      | `() => void`               | Call on field blur to trigger validation    |
| `error`       | `string \| undefined`      | Current validation error message           |
| `model`       | `ComputedRef<TValue>`      | Writable computed ref for v-model binding  |
| `formData`    | `TFormData`                | Form data from parent VuilessForm          |
| `formContext` | `TContext \| undefined`    | Context from parent VuilessForm            |

```vue
<VuilessField v-model="data.email" :rules="[isRequired, isEmail]" v-slot="{ onBlur, error, model }">
  <input v-model="model.value" @blur="onBlur" />
  <span v-if="error">{{ error }}</span>
</VuilessField>
```

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

Rules are evaluated:
- On value change (if `firstValidation` is `'on-change'` and field has been touched)
- On blur (if `firstValidation` is `'on-blur'` or `'touched-on-blur'`)
- On submit (always, regardless of `firstValidation`)

## Types

```ts
import type {
  TVuilessState,
  TVuilessRule,
  TVuilessFieldValidator,
  TVuilessFieldCallbacks,
  TVuilessFieldRegisterFn,
} from '@foormjs/vuiless'
```

### `TVuilessState<TFormData, TContext>`

The state object provided to child fields via `inject('vuiless')`:

```ts
interface TVuilessState<TFormData, TContext> {
  firstSubmitHappened: boolean
  firstValidation: 'on-change' | 'touched-on-blur' | 'on-blur' | 'on-submit' | 'none'
  register: TVuilessFieldRegisterFn
  unregister: (instance: ComponentInstance) => void
  formData: TFormData
  formContext?: TContext
}
```

### `TVuilessRule<TValue, TFormData, TContext>`

```ts
type TVuilessRule<TValue, TFormData, TContext> = (
  v: TValue,
  data?: TFormData,
  context?: TContext
) => boolean | string
```

## License

MIT
