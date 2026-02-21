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

## AI Agent Skills

`@foormjs/composables` ships an AI agent skill for Claude Code, Cursor, Windsurf, Codex, and other compatible agents. The skill teaches your agent the library's APIs, patterns, and best practices so it can help you write correct code without hallucinating.

**Install the skill into your agent:**

```bash
# Project-local (recommended — version-locked, commits with your repo)
npx @foormjs/composables setup-skills

# Global (available across all your projects)
npx @foormjs/composables setup-skills --global
```

Restart your agent after installing.

**Auto-update on install** — to keep the skill in sync whenever you upgrade the package, add this to your project's `package.json`:

```jsonc
{
  "scripts": {
    "postinstall": "npx @foormjs/composables setup-skills --postinstall",
  },
}
```

## Composables

### `useFoormForm(options)`

Manages form state: field registry, submit handling, and validation state. Provides state to child fields via three inject keys: `__foorm_form` (TFoormState), `__foorm_form_data` (form data), `__foorm_form_context` (external context).

**Options:**

| Option            | Type                                       | Description                      |
| ----------------- | ------------------------------------------ | -------------------------------- |
| `formData`        | `MaybeRef<TFormData>`                      | Reactive form data object        |
| `formContext`     | `MaybeRef<TContext>`                       | External context passed to rules |
| `firstValidation` | `MaybeRef<TFoormState['firstValidation']>` | When to start showing errors     |
| `submitValidator` | `TFoormSubmitValidator`                    | Validator called on submit       |

**Returns:**

| Property      | Type                                                | Description                              |
| ------------- | --------------------------------------------------- | ---------------------------------------- |
| `clearErrors` | `() => void`                                        | Clears all field errors and touch state  |
| `reset`       | `() => void`                                        | Resets all fields and clears errors      |
| `submit`      | `() => true \| { path: string; message: string }[]` | Validates and returns result             |
| `setErrors`   | `(errors: Record<string, string>) => void`          | Sets external errors on fields           |
| `foormState`  | `reactive<TFoormState>`                             | Reactive form state (provided to fields) |

### `useFoormField(options)`

Manages a single field's validation state, touch tracking, and error display. Injects `TFoormState` from the nearest parent `useFoormForm` via `inject('__foorm_form')`, and form data/context from `__foorm_form_data` / `__foorm_form_context`.

**Options:**

| Option       | Type                   | Description                                                                  |
| ------------ | ---------------------- | ---------------------------------------------------------------------------- |
| `getValue`   | `() => unknown`        | Getter for the current value                                                 |
| `setValue`   | `(v: unknown) => void` | Setter for the current value                                                 |
| `rules`      | `TFoormRule[]`         | Validation rules array                                                       |
| `path`       | `() => string`         | Field path for error matching                                                |
| `resetValue` | `TValue`               | Value to set on reset (default: `''`). Use `[]` for arrays, `{}` for objects |

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

### `TFoormState`

The state object provided to child fields via `inject('__foorm_form')`:

```ts
interface TFoormState {
  firstSubmitHappened: boolean
  firstValidation: 'on-change' | 'touched-on-blur' | 'on-blur' | 'on-submit' | 'none'
  register: (id: symbol, registration: TFoormFieldRegistration) => void
  unregister: (id: symbol) => void
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
