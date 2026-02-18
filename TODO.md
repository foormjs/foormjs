# TODO

## Demo Playground

- [ ] **Add form variations using `annotate` with custom `action` and `paragraph` components**
      In `packages/vue/src/App.vue`, add new form instances that use the `annotate` keyword on existing schemas (e.g. `E2eTestForm`, `NestedForm`) to override `foorm.action` and `foorm.paragraph` fields with `@foorm.component`. Create matching custom components in `app-components/` (e.g. `custom-action-button.vue`, `custom-paragraph.vue`) and wire them through the `components` prop. This exercises the component-override path for phantom field types, which currently only has coverage for regular fields (`CustomStarInput`) and array add/variant (`CustomAddButton`, `CustomVariantPicker`).

## Shared Composable for oo-* Components

- [ ] **Unify injected state into a single `useFoormContext()` composable**
      `oo-field.vue`, `oo-group.vue`, and `oo-array.vue` each independently inject `__foorm_form`, `__foorm_path_prefix`, and root form data (via `useRootFormData`). Extract a single `useFoormContext()` composable that returns:
      - `foormState` — injected `__foorm_form` with throw guard
      - `rootFormData` — the getter from `useRootFormData()`
      - `pathPrefix` — injected `__foorm_path_prefix` with computed default
      - `joinPath(segment)` — shared path concatenation (`prefix ? prefix + '.' + segment : segment`, with `undefined` handling)
      - `formContext` — derived `(foormState.value.formContext ?? {}) as Record<string, unknown>`
      This replaces the duplicated inject+guard blocks in `oo-field.vue` (lines 59-72) and `oo-group.vue`, the duplicated `absolutePath`/`absoluteFieldPath` path-join logic, and the repeated `(foormState.value.formContext ?? {}) as Record<string, unknown>` expression.

- [ ] **Extract `useFoormValidator()` composable for cached validator pattern**
      Both `oo-field.vue` and `oo-group.vue` duplicate the same pattern: create `foormValidatorPlugin()`, lazily construct a `Validator` instance, and call `validate()` with form data/context. Extract into a shared composable:
      ```ts
      useFoormValidator(prop, opts?) → { validate(value, externalCtx?) → true | string }
      ```
      This removes ~15 lines of identical setup from each component.

## Code Deduplication Across oo-* Components

- [ ] **Audit and extract remaining shared patterns**
      Beyond the composable extractions above, look for:
      - `TFoormFnScope` construction — the `{ v, data: rootFormData(), context: formContext, entry }` object literal appears in `oo-field.vue` (baseScope computed), `oo-group.vue` (title resolution scope), and `oo-form.vue` (ctx computed). A `buildScope(v, rootFormData, formContext, entry?)` helper could unify this.
      - `resolveFieldComponent()` in `oo-group.vue` — if array or future components also need component resolution from `components`/`types` props, this could become a shared utility.
      - Template patterns — `oo-group.vue` renders fields via a `v-for` with conditional `<oo-array>` / `<oo-field>` / nested `<oo-group>` branching. If this pattern repeats (e.g. in future layout components), consider a shared field-dispatch composable or component.
