## Persist variants when switching

When user has union with multiple variants and switches from one to another, we have to persist the state of previous variant data in case if user switches back to it.
We can persist it in oo-union component, but it will be better if we persist it somehow in the core, so users when developing custom union component can have persisted data when switching variants.

## Change events

Each change (field input (blur), add/remove item, switch variant) should emit an event from form with:

- formData
- change path
- new value

(to let some room for undo/redo flows in future)


## Bugs

- **`__foorm_form_context` never provided** — `oo-form.vue` provides 5 inject keys but not `__foorm_form_context`. `use-foorm-context.ts` injects it and falls back to `{}`. All `@foorm.fn.*` functions receiving `context` get an empty object instead of the actual form context. Fix: add `provide('__foorm_form_context', computed(() => props.formContext))` to `oo-form.vue`.
- **`OoField` in `oo-union.vue` has no `:key`** — When variant changes, Vue reuses the same `OoField` instance. `isStructured`, `myLevel`, and `provide()` calls in `oo-field.vue` are computed once at setup and become stale. Switching between a structured variant (object) and a leaf variant (string) causes incorrect nesting levels and missing path prefix provides. Fix: add `:key="localUnionIndex"` to the `<OoField>` in `oo-union.vue`.
- **`oo-tuple.vue` missing `onRemove` passthrough** — `OoStructuredHeader` receives title/level/optional props but not `:on-remove`, `:can-remove`, `:remove-label`. Tuple fields used as array items won't have a remove button in their header.

## Performance

- **`getItemField` creates new object per render cycle** — `use-foorm-array.ts` spreads `field.itemField` into a new object on every `getItemField(index)` call inside `v-for`. Each `OoField` sees a new `field` prop reference, triggering unnecessary updates. Memoize per-index with a `Map<number, FoormFieldDef>` cache.
- **`foormValidatorPlugin()` allocated fresh on every call** — `getFormValidator` and `createFieldValidator` in `validate.ts` each call `foormValidatorPlugin()` creating a new closure. The plugin is stateless — hoist to a module-level constant.

## Cleanup

- **`hasComputedAnnotations` casts metadata to `Map`** while other access uses `TMetadataAccessor` duck-type — fragile if ATScript internals change (same cast now also in `oo-field.vue`'s `hasFn` scan).
- **Dead `index.html`** + `dev`/`preview` scripts in `packages/composables` — leftover scaffold from removed demo files.
- **`oo-form.vue` submit button CSS** still inline rather than in `oo-defaults.css`.
- **`fnAnnotation`/`fnTopAnnotation`** validate hooks are identical — could accept a `mode` flag to unify into a single factory.
