# TODO — Vuiless Migration & Optimization

## 1. Migrate vue package to use internal vuiless

**Status**: Not started

The `@foormjs/vue` currently depends on the external npm package `vuiless-forms@^0.0.3`. The local `packages/vuiless/` is the in-monorepo port under the name `@foormjs/vuiless`.

### What needs to happen

- Replace `"vuiless-forms": "^0.0.3"` with `"@foormjs/vuiless": "workspace:^"` in `packages/vue/package.json`
- Update all imports in vue components (`oo-form.vue`, `oo-field.vue`, `oo-group.vue`, `oo-array.vue`) from `'vuiless-forms'` to `'@foormjs/vuiless'`
- Update `packages/vue/vite.config.ts` — replace `'vuiless-forms'` in the rollup externals with `'@foormjs/vuiless'`
- Add `packages/vuiless` to `pnpm-workspace.yaml` if not already there
- Wire up build scripts — `scripts/build` needs to know about the vuiless package (or it stays vite-only via `customBuild: true`)

### Concerns

- **Version divergence**: The external `vuiless-forms@0.0.3` might have slight API differences from the local port. Need to verify the local `@foormjs/vuiless` types and exports are a 1:1 match. Quick comparison shows they look identical (same `VuilessForm`, `VuilessField`, same types), but need to verify with the build + tests.
- **Dev dependency mismatch**: The local vuiless uses newer tooling versions (vite 7, typescript 5.9, vue-tsc 3) while the vue package uses older ones (vite 5, typescript 5.4, vue-tsc 2). This shouldn't matter for the published output but watch for tsconfig conflicts.
- **Peer dependency**: vuiless currently only has `vue` as a dependency. No ATScript awareness — good, clean separation is maintained.

---

## 2. Add "error" emit to VuilessForm

**Status**: Not started

Currently `VuilessForm` only emits `submit(data)`. When validation fails on submit, it silently returns (line 61 `return`). Need to emit an `error` event with the list of errors.

### Design

```ts
// VuilessForm emits:
(e: 'submit', data: TFormData): void
(e: 'error', errors: TVuilessFieldError[]): void  // NEW

// Error structure:
interface TVuilessFieldError {
  instance: ComponentInstance  // the field's Vue instance
  error: string | boolean      // the validation result
}
```

### Implementation in VuilessForm.onSubmit()

```ts
function onSubmit() {
  firstSubmitHappened.value = true
  const errors: TVuilessFieldError[] = []
  if (props.firstValidation !== 'none') {
    for (const [instance, { validate }] of fieldsRegistry.entries()) {
      const result = validate()
      if (result !== true) {
        errors.push({ instance, error: result })
      }
    }
  }
  if (errors.length > 0) {
    emit('error', errors)
    return
  }
  emit('submit', props.formData)
}
```

### Concerns

- **Error identity**: Errors are keyed by `ComponentInstance` which is an opaque Vue internal. This isn't useful for consumers who want to map errors to field names/paths. Consider adding an optional `name`/`id` to the registration callbacks so the error list can carry field identifiers. But that would bloat the vuiless API which is meant to be generic (not foorm-aware). Two options:
  - **(a)** Keep vuiless generic — errors keyed by instance. OoForm can map instances to field paths if needed.
  - **(b)** Extend `TVuilessFieldCallbacks` with an optional `name?: string` so fields can self-identify.
  - Recommend **(b)** — minimal addition, useful beyond foorm.
- **Forwarding in OoForm**: `oo-form.vue` wraps `VuilessForm`. Need to also forward the `@error` event from VuilessForm, or transform it (e.g., map instances to ATScript paths and emit a foorm-flavored error object). OoForm should probably emit its own `error` event with path-keyed errors matching `getFormValidator` output shape: `Record<string, string>`.

---

## 3. Optimization analysis — vuiless structure for oo-form/oo-field

**Status**: Analysis needed

### Current overhead/redundancy

1. **Double provide/inject cycle**: `VuilessForm` provides `'vuiless'` → `VuilessField` injects it. But `OoField` also injects `'vuiless'` directly for `formData`/`formContext` access. The `VuilessField` inject is redundant in the OoField context — OoField already has everything it needs from the vuiless state.

2. **VuilessField's `model` computed**: VuilessField creates a `model.v` computed wrapping `defineModel()`. But OoField doesn't use `defineModel` — it does `getModel()`/`setModel()` with dot-path access and passes `:model-value`/`@update:model-value`. So VuilessField's internal `defineModel` → `modelValue.value` round-trip is an extra reactive layer on top of OoField's own path-based access.

3. **VuilessField's `touched`/`blur`/`submitError` state**: Each VuilessField instance maintains its own refs. For a form with 50 fields, that's 150 extra refs. The state management is minimal but it's overhead per field.

4. **VuilessField's `error` computed**: It recomputes on every dependency change (modelValue watch + isValidationActive). OoField's `vuilessRule` already does ATScript validation. The VuilessField `error` computed is the bridge that controls *when* to show errors (touch/blur/submit policy) — this is the actual value vuiless provides.

5. **Registry Map keyed by ComponentInstance**: Using Vue instances as Map keys works but is fragile. If a field's setup runs before the parent's provide (race conditions in async components), the inject could be undefined. Current code guards with `if (vuiless?.value)` but silently skips registration.

### Possible optimizations

#### A. Flatten VuilessField into OoField (most aggressive)

**Pros:**
- Eliminate one component layer per field (less VNode overhead)
- Remove double-inject of `'vuiless'`
- Remove redundant `defineModel()` reactive wrapper
- Single validation flow instead of two-layer (ATScript validator → vuiless rule wrapper)

**Cons:**
- Lose separation of concerns — vuiless validation timing logic (`on-change`, `on-blur`, etc.) gets mixed into foorm field logic
- Vuiless is designed to be reusable outside foorm — flattening defeats that
- More complex OoField component

**Verdict**: Too aggressive. Vuiless being a separate package is a feature, not a bug.

#### B. Make VuilessField thinner / more composable

Instead of `VuilessField` being a component with `defineModel`, make the core logic a composable:

```ts
// useVuilessField(options) — composable approach
function useVuilessField(opts: { validate: () => string | boolean }) {
  const vuiless = inject('vuiless')
  const touched = ref(false)
  const blur = ref(false)
  const submitError = ref<string>()
  // ... same logic, no defineModel overhead
  return { error, onBlur, register, unregister }
}
```

**Pros:**
- OoField can use the composable directly, skip the extra component
- No `defineModel` overhead — OoField already manages its own model
- Vuiless still exists as a package, VuilessField still works for non-foorm usage
- Dual export: `VuilessField` component (for standalone) + `useVuilessField` composable (for integration)

**Cons:**
- Two APIs to maintain in vuiless
- Registration lifecycle needs manual `onUnmounted` handling in the consumer

**Verdict**: Good middle ground. Export both `VuilessField` (component) and `useVuilessField` (composable) from vuiless. OoField uses the composable.

#### C. Batch validation instead of per-field validate() calls

Currently `onSubmit()` iterates all fields calling `validate()` one by one. For large forms this is synchronous and linear. Not a real bottleneck (validation is fast) but could matter for forms with 100+ fields with computed validators.

**Verdict**: Not worth it right now. Keep it simple.

### Recommendation

Go with **B** — add a `useVuilessField` composable to vuiless, use it from OoField. This removes one component layer per field without losing vuiless as a standalone package.

---

## 4. Replace vuiless field-by-field submit validation with ATScript full-type validation

**Status**: Analysis needed

### Current state — two validation systems

| | Vuiless (field-by-field) | ATScript (`getFormValidator`) |
|---|---|---|
| **Trigger** | `VuilessForm.onSubmit()` iterates registry | Called manually by consumers |
| **Scope** | Registered fields only | Entire type tree |
| **Validators** | `@foorm.validate` + `@expect.*` via `vuilessRule` bridge | Same, via `foormValidatorPlugin` |
| **Skip disabled/hidden** | OoField checks `getFieldMeta('foorm.disabled')` | Plugin option `skipDisabledHidden: true` |
| **Required check** | Plugin does it (field is non-optional + empty) | Plugin option `checkRequired: true` |
| **Result shape** | `boolean \| string` per field, no aggregation | `{ passed, errors: Record<path, message> }` |

### The idea

On submit, instead of walking the vuiless field registry and calling each field's `validate()`, call `getFormValidator(def)(data)` once. This validates the entire form through ATScript's type system in one pass.

### Pros

- **Single source of truth**: One validation path, not two parallel systems
- **Validates unregistered fields**: If a field isn't mounted (conditional render, lazy tab), vuiless misses it. ATScript validates the full type tree regardless of what's mounted.
- **Consistent error format**: ATScript returns `Record<path, message>` which maps cleanly to foorm fields
- **Performance**: One traversal of the type tree vs N separate `new Validator(prop)` calls
- **Simpler OoField**: No need to create per-field `Validator` instances or `foormValidatorPlugin` per field — validation is centralized

### Cons / Concerns

- **Disabled/hidden state lives in Vue**: The ATScript validator plugin resolves `disabled`/`hidden` from raw metadata or compiled `foorm.fn.*` strings. But the actual runtime state (which fields are disabled/hidden) is computed in OoField's Vue reactivity. If a field's `disabled` depends on another field's value, the ATScript validator evaluates the fn string independently — this should produce the same result since both read the same `data`. But there's no guarantee of exact parity with Vue's computed resolution. **Risk: low but nonzero.**

- **Computed validators with `entry` scope**: The `foormValidatorPlugin` builds an `entry` object for `@foorm.validate` fn strings. In OoField, this `entry` includes the Vue-resolved `disabled`, `hidden`, `readonly`, `optional`. The ATScript whole-form validator builds its own `entry` from raw metadata. If there are edge cases where Vue-resolved values differ from metadata-resolved values, validation results could diverge. **Risk: low — both use the same resolution logic, just different reactive layers.**

- **vuiless's role shrinks to validation timing only**: If submit validation moves to ATScript, vuiless only handles:
  - `firstValidation` modes (on-change, on-blur, on-submit, etc.)
  - `touched`/`blur` state per field
  - Field registration for `clearErrors()`/`reset()`
  - This is still valuable — UX timing is important. But vuiless no longer "validates" on submit.

- **Error distribution after whole-form validation**: After `getFormValidator` returns path-keyed errors, those need to be distributed back to individual fields for display. Two approaches:
  - **(a)** Pass errors as `errors` prop on `OoForm` → propagate through `OoGroup` → each `OoField` reads its error from the map. This already works via the `errors?: Record<string, string | undefined>` prop on OoForm.
  - **(b)** Use vuiless's `submitError` mechanism to push errors back to fields. Would need a `setError(error: string)` callback in the registry.
  - Current `errors` prop approach **(a)** is simpler and already exists. The ATScript whole-form validator returns `Record<path, message>` which maps directly.

- **Breaking the vuiless contract**: VuilessForm's `onSubmit` currently calls `validate()` on each field. If we skip that and do ATScript validation instead, VuilessField's `submitError` ref won't get set. The field's `error` computed won't show errors (because `submitError` is the trigger for `on-submit` mode before `firstSubmitHappened`). **This is the main conflict.**

### Proposed approach

Add an optional `validateFn` prop to `VuilessForm`:

```ts
// VuilessForm props:
validateFn?: (data: TFormData) => Record<string, string> | undefined
```

When `validateFn` is provided:
1. `onSubmit()` calls `validateFn(data)` instead of iterating the field registry
2. If it returns errors, emit `'error'` event with the error map, set `firstSubmitHappened = true`
3. Store errors in a reactive `formErrors` ref, provide it to children
4. VuilessField checks both its own validation AND the form-level error for its name/path
5. If no errors, emit `'submit'`

When `validateFn` is NOT provided:
- Existing behavior unchanged (field-by-field registry iteration)

### Integration with OoForm

```ts
// oo-form.vue
const validator = getFormValidator(props.def, { context: props.formContext })
const validateFn = (data) => {
  const { passed, errors } = validator(data)
  return passed ? undefined : errors
}
// <VuilessForm :validate-fn="validateFn" ...>
```

### Concern: error propagation to VuilessField

This is the hardest part. VuilessField needs to know about its error to display it. Options:

1. **Provide `formErrors` from VuilessForm**: A reactive `Map/Record` of field errors. VuilessField injects and checks `formErrors[fieldId]`. Requires fields to have an identifier (ties into the `name` discussion from item 2).
2. **Keep per-field validation for display, use whole-form for submit gate**: Don't change when errors show (VuilessField's `error` computed still works via `isValidationActive`). Only change the submit gate. But then you're still running per-field validation on blur/change AND whole-form on submit — two systems again.
3. **Hybrid**: Use ATScript whole-form validation on submit. If errors are found, distribute them via the `errors` prop mechanism that OoForm already supports. VuilessField doesn't need to know — OoField handles error display from the errors prop. VuilessForm still sets `firstSubmitHappened = true` so interactive validation activates normally.

**Recommendation**: Option 3 (hybrid). On submit:
1. OoForm calls `getFormValidator(def)(data)`
2. If errors: store in a reactive ref, pass as `errors` prop to OoGroup/OoField, emit `'error'` event. Set `firstSubmitHappened` so field-by-field validation activates for subsequent edits.
3. If no errors: emit `'submit'`
4. VuilessForm's own field-by-field submit validation is bypassed (via `validateFn` prop or by handling submit at the OoForm level instead of relying on vuiless's `@submit`)

This keeps vuiless generic, adds ATScript-powered submit validation at the OoForm layer, and field-by-field reactive validation continues to work for the UX timing (show errors on blur/change after first submit attempt).

---

## Priority order

1. **Item 1** (migrate imports) — mechanical, unblocks everything else
2. **Item 2** (error emit) — small addition, useful immediately
3. **Item 3** (composable optimization) — medium effort, nice perf win
4. **Item 4** (ATScript submit validation) — largest change, biggest value, depends on 1-3
