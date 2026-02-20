# foormjs Code Review TODO

## High Severity

### 1. `watch(model, ..., { deep: true })` — unnecessary for object/array fields

**File:** `packages/composables/src/composables/use-foorm-field.ts:33-41`

For **primitives** (string, number, boolean), `deep: true` is a no-op — Vue's `traverse()` returns immediately for non-object values, so there's zero overhead. The concern is specifically for **object and array fields**: `deep: true` recursively walks the entire nested structure on every reactive tick just to set `touched = true` and clear errors.

For structured fields (objects, arrays, tuples), the watcher is also somewhat pointless since those fields don't have meaningful "value changed" semantics at the container level — changes happen at leaf fields, which have their own watchers.

**Fix:** Accept an optional `deep` flag in `UseFoormFieldOptions` (default `false`). In `oo-field.vue`, pass `deep: true` only for fields where it's actually useful — or don't pass it for structured fields at all since they delegate validation to children.

---

## Medium Severity

### 4. `foormState` computed allocates a new object every tick

**File:** `packages/composables/src/composables/use-foorm-form.ts:28-33`

The `computed` creates a fresh `{ firstSubmitHappened, firstValidation, register, unregister }` object every time `firstSubmitHappened` changes. Since it's `provide`d to every field, this invalidates all dependents.

**Fix:** Use `reactive()` with in-place property mutation, or split stable functions (`register`/`unregister`) from changing state (`firstSubmitHappened`/`firstValidation`) into separate provides.

---

### 5. `createVariant` hardcodes `type: 'object'`, ignoring `@foorm.type`

**File:** `packages/atscript/src/runtime/create-foorm.ts:239-247`

When building union variants for an object type with `@foorm.component`, the inline `itemField` hardcodes `type: 'object'`, bypassing `getFieldMeta(prop, 'foorm.type')` that `createFieldDef` performs.

**Fix:** Use `createFieldDef('', def)` instead of the inline object literal.

---

### 6. Union variant picker markup duplicated verbatim

**Files:** `packages/vue/src/components/default/oo-field-shell.vue:74-100`, `oo-structured-header.vue:37-65`

The SVG button, dropdown menu, and selection logic are copy-pasted between the two components.

**Fix:** Extract into a shared `OoVariantPicker.vue` component.

---

### 7. Entry-building logic duplicated between validator-plugin and oo-field

**Files:** `packages/atscript/src/runtime/validator-plugin.ts:42-72`, `packages/vue/src/components/oo-field.vue:302-311`

Both build the same `TFoormFieldEvaluated` entry with the dual-scope pattern (base scope -> entry -> full scope).

**Fix:** Extract a shared `buildFieldEntry(def, baseScope, path)` utility in `@foormjs/atscript` runtime utils.

---

### 8. `componentProps` computed rebuilds entire object on any dependency change

**File:** `packages/vue/src/components/oo-field.vue:487-518`

A single `computed` with ~25 properties + `...unwrap(attrs)` spread. Any change to `mergedError`, `classes`, or `attrs` triggers full rebuild.

**Fix:** Separate static props from dynamic ones, or accept this as an inherent cost of the single-component rendering model.

---

### ~~9. Repeated small patterns across default components~~ ✅

Resolved: Extracted `useConsumeUnionContext()` composable and `formatIndexedLabel()` utility into `use-foorm-context.ts`. Unified remove button default to `'Remove'`.

---

## Low Severity

### 10. `emptyScope` allocated per `OoField` instance

**File:** `packages/vue/src/components/oo-field.vue:177-182`

**Fix:** Hoist to module-level singleton.

### 11. `path.split('.').pop()` allocates array for last segment

**File:** `packages/atscript/src/runtime/create-foorm.ts:116`

**Fix:** `path.slice(path.lastIndexOf('.') + 1)`.

### 12. `[...tags].find(...)` spreads Set into array

**File:** `packages/atscript/src/runtime/create-foorm.ts:169-170`

**Fix:** `for...of` with early `break`.

### 13. `Object.keys(result).length > 0` in `resolveAttrs`

**File:** `packages/atscript/src/runtime/utils.ts:237`

**Fix:** Track with a boolean flag during the loop.

### 14. Default `computed(() => '')` created per `useFoormContext` call

**File:** `packages/vue/src/composables/use-foorm-context.ts:25-28`

**Fix:** Module-level `const EMPTY_PREFIX = computed(() => '')`.

### 15. `shallowRef + watch` instead of `computed` in `useFoormUnion`

**File:** `packages/vue/src/composables/use-foorm-union.ts:66-69`

**Fix:** Replace with `computed(() => buildInnerField())`.

### ~~16. `isValidationActive` redundant outer `if` guard~~ ✅

Resolved: Simplified to early return with `default: return false` in switch.

### ~~17. `opts.firstValidation` defaulted in two places~~ ✅

Resolved: `submit()` now reads `foormState.firstValidation` (already synced and defaulted via `watchEffect`) instead of re-reading from opts.
