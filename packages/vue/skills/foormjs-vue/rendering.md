# Rendering Architecture — @foormjs/vue

> OoField internals, component resolution, nesting levels, provide/inject keys, and the allStatic optimization.

## Rendering Chain

```
OoForm (provides context, renders rootField)
  └── OoField(def.rootField) → types['object'] → OoObject
        └── OoIterator (iterates def.fields)
              ├── OoField (leaf) → types['text'] → OoInput / your component
              ├── OoField (object with @foorm.title) → types['object'] → OoObject
              │     └── OoIterator → OoField ...
              ├── OoField (array) → types['array'] → OoArray
              │     └── OoField (per item via useFoormArray) → ...
              ├── OoField (union) → types['union'] → OoUnion
              │     └── OoField (selected variant) → ...
              └── OoField (tuple) → types['tuple'] → OoTuple
                    └── OoField (per position) → ...
```

## OoField — Universal Renderer

`OoField` is the core of the rendering pipeline. For each field it:

1. **Injects** types, components, errors, action handler, change handler from parent OoForm
2. **Resolves component**: `@foorm.component` → `components[name]`, else → `types[field.type]`
3. **Resolves all field props** (label, placeholder, disabled, hidden, options, etc.)
4. **Tracks nesting level** via `__foorm_level` inject/provide
5. **Renders** via `<component :is="resolvedComponent" v-bind="componentProps" />`

### Two-Path Optimization

OoField detects whether a field has any computed annotations:

- **`allStatic` fast path** — no `@foorm.fn.*` or `@foorm.validate` annotations. All props resolved once at setup, no Vue `computed()` refs created. Significantly reduces reactive overhead.
- **Dynamic path** — per-property static/dynamic detection. Only properties with `@foorm.fn.*` become computed refs; static props remain plain values.

The `allStatic` flag is set by `createFoormDef` via `hasComputedAnnotations()`.

### Lazy Scope Construction

OoField builds scopes in two phases (dual-scope pattern):

1. **`baseScope`** — `{ v, data, context }` — resolves constraints (disabled, hidden, readonly)
2. **`fullScope`** — `{ v, data, context, entry }` — resolves display props (label, placeholder, options)

This prevents circular dependency: options can reference constraint state via `entry.disabled`.

### Component Resolution Order

1. `@foorm.component` annotation value → lookup in `components` prop
2. `types[field.type]` → lookup in `types` prop
3. If not found → renders error div: `[label] No component for type "X"`

## OoIterator

Iterates `def.fields` and renders `<OoField>` per field. Used by object and tuple components.

```vue
<OoIterator :def="objectDef" />

<!-- With path prefix (for array items) -->
<OoIterator :def="objectDef" path-prefix="[0]" />

<!-- With remove props (passed through to child fields) -->
<OoIterator
  :def="objectDef"
  :on-remove="onRemove"
  :can-remove="canRemove"
  :remove-label="removeLabel"
/>
```

**Props:**

- `def: FoormDef` — form definition to iterate
- `pathPrefix?: string` — custom path segment (e.g., `[0]` for array items)
- `onRemove?`, `canRemove?`, `removeLabel?` — passed through to child `OoField`

## Nesting Level Tracking

`OoField` manages nesting depth via `__foorm_level` inject/provide:

- Root object = level 0 (inject default: -1, increments for object/array/tuple types)
- Each nested object/array/tuple increments the level
- **Union fields do NOT increment** — prevents double-counting (union → inner object would be +2 otherwise)

Level-aware rendering in default components:

- Level 0: title rendered as `<h2>`, no left border
- Level > 0: title rendered as `<h3>`, left border + padding

## Provide/Inject Keys

### Set by OoForm

| Key                      | Type                                     | Description                      |
| ------------------------ | ---------------------------------------- | -------------------------------- |
| `__foorm_root_data`      | `ComputedRef<TFormData>`                 | Reactive form data               |
| `__foorm_path_prefix`    | `ComputedRef<string>`                    | Current path prefix ('' at root) |
| `__foorm_types`          | `ComputedRef<TFoormTypeComponents>`      | Type-to-component map            |
| `__foorm_components`     | `ComputedRef<Record<string, Component>>` | Named component map              |
| `__foorm_errors`         | `ComputedRef<Record<string, string>>`    | External errors                  |
| `__foorm_action_handler` | `(name, data) => void`                   | Action event forwarder           |
| `__foorm_change_handler` | `(type, path, value) => void`            | Change event emitter             |

### Set by OoField

| Key                   | Type                  | Description               |
| --------------------- | --------------------- | ------------------------- |
| `__foorm_path_prefix` | `ComputedRef<string>` | Updated path for children |
| `__foorm_level`       | `number`              | Incremented nesting level |

### Set by useFoormForm (from @foormjs/composables)

| Key                    | Type                     | Description                       |
| ---------------------- | ------------------------ | --------------------------------- |
| `__foorm_form`         | `TFoormState`            | Form state (validation, registry) |
| `__foorm_form_data`    | `ComputedRef<TFormData>` | Form data wrapper                 |
| `__foorm_form_context` | `ComputedRef<TContext>`  | External context                  |

### Set by useFoormUnion

| Key             | Type                 | Description                     |
| --------------- | -------------------- | ------------------------------- |
| `__foorm_union` | `TFoormUnionContext` | Variant state + change function |

## useFoormContext (Internal)

Internal composable used by default components to access form state and build scopes.

```ts
const {
  foormState, // TFoormState
  rootFormData, // () => Record<string, unknown>
  pathPrefix, // ComputedRef<string>
  formContext, // ComputedRef<Record<string, unknown>>
  joinPath, // (segment | fn) => ComputedRef<string>
  buildPath, // (segment) => string
  getByPath, // (path) => unknown
  setByPath, // (path, value) => void
  buildScope, // (v?, entry?) => TFoormFnScope
} = useFoormContext('MyComponent')
```

Not publicly exported — use `getByPath`/`setByPath` from `@foormjs/atscript` directly in custom components.

## Change Events

OoField and composables emit change events via `__foorm_change_handler`:

| Source        | Type             | When                                      |
| ------------- | ---------------- | ----------------------------------------- |
| OoField       | `'update'`       | On blur, if value changed since last blur |
| useFoormArray | `'array-add'`    | After `addItem()`                         |
| useFoormArray | `'array-remove'` | After `removeItem()`                      |
| useFoormUnion | `'union-switch'` | After `changeVariant()`                   |

Note: `'update'` fires on blur (not on every keystroke) to reduce noise.

## Best Practices

- Use `OoIterator` in custom object components — don't manually iterate `objectDef.fields`
- Pass through `onRemove`/`canRemove`/`removeLabel` from your component to `OoField` or `OoIterator`
- Don't access provide/inject keys directly in custom components — use the composables (`useFoormArray`, etc.)
- The `allStatic` optimization is automatic — no action needed from custom components

## Gotchas

- Union fields provide `__foorm_path_prefix` but NOT an incremented `__foorm_level` — prevents double nesting visuals
- `OoIterator` provides its own `__foorm_path_prefix` — nested iterators correctly stack path segments
- `__foorm_level` defaults to `-1` when injected, so the first object/array increments it to `0`
- Change events are batched per-field — multiple rapid changes to the same field only emit once on blur
- Missing component for a field type renders an error div, not an exception — check console for warnings
