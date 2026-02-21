# ATScript Plugin (Build-time) — @foormjs/atscript

> Configuring `foormPlugin()` in `atscript.config.ts`, registered annotations, foorm primitives, and IDE autocomplete.

## Concepts

The `foormPlugin()` is an ATScript plugin that registers all `@foorm.*` annotations and foorm primitives with the ATScript compiler. It's used in `atscript.config.ts` for:

- IDE autocomplete and validation of `@foorm.*` annotations
- Registering foorm primitive types (`foorm.select`, `foorm.radio`, etc.)
- Function string validation (compile-time syntax checking)

**Import path:** `@foormjs/atscript/plugin` — never import at runtime.

## API Reference

### `foormPlugin(opts?): TAtscriptPlugin`

```ts
import { foormPlugin } from '@foormjs/atscript/plugin'

// Basic usage
foormPlugin()

// With custom types and components for IDE autocomplete
foormPlugin({
  extraTypes: ['color', 'rating', 'date-range'],
  components: ['StarRating', 'ColorPicker'],
})
```

**`TFoormPluginOptions`:**

- `extraTypes?: string[]` — additional field type values beyond built-ins. These should match the custom keys in your runtime `types` map (e.g., `{ date: MyDatePicker }` → add `'date'` here). Enables IDE autocomplete and validation for `@foorm.type`.
- `components?: string[]` — custom component names. These should match the keys in your runtime `components` map (e.g., `{ StarRating: MyStarRating }` → add `'StarRating'` here). Enables IDE autocomplete and validation for `@foorm.component`. When omitted, `@foorm.component` accepts any string without validation.

### `atscript.config.ts` setup

```ts
import { defineConfig } from '@atscript/core'
import ts from '@atscript/typescript'
import { foormPlugin } from '@foormjs/atscript/plugin'

export default defineConfig({
  rootDir: 'src',
  plugins: [ts(), foormPlugin()],
})
```

### Exported objects

- `annotations` — the full `TAnnotationsTree` spec tree (for advanced customization)
- `primitives` — the foorm primitive type definitions

## Registered Annotations

### Form-level

| Annotation                  | Args          | nodeType              |
| --------------------------- | ------------- | --------------------- |
| `@foorm.title`              | `string`      | interface, type, prop |
| `@foorm.submit.text`        | `string`      | interface, type       |
| `@foorm.submit.disabled`    | (none)        | interface, type       |
| `@foorm.fn.title`           | `string` (fn) | interface, type, prop |
| `@foorm.fn.submit.text`     | `string` (fn) | interface, type       |
| `@foorm.fn.submit.disabled` | `string` (fn) | interface, type       |

### Field-level static

| Annotation            | Args                            | nodeType              |
| --------------------- | ------------------------------- | --------------------- |
| `@foorm.type`         | `string` (enum: built-in types) | prop, type            |
| `@foorm.component`    | `string`                        | prop, interface, type |
| `@foorm.autocomplete` | `string`                        | prop, type            |
| `@foorm.altAction`    | `id: string`, `label?: string`  | prop, type            |
| `@foorm.value`        | `string`                        | prop, type            |
| `@foorm.order`        | `number`                        | prop, type            |
| `@foorm.hidden`       | (none)                          | prop, type            |
| `@foorm.disabled`     | (none)                          | prop, type            |
| `@foorm.readonly`     | (none)                          | prop, type            |

### Multi-value

| Annotation        | Args                              | nodeType   |
| ----------------- | --------------------------------- | ---------- |
| `@foorm.options`  | `label: string`, `value?: string` | prop, type |
| `@foorm.attr`     | `name: string`, `value: string`   | prop, type |
| `@foorm.validate` | `fn: string`                      | prop, type |

### Field-level computed (`@foorm.fn.*`)

All receive a function string `(v, data, context, entry) => result`:

| Annotation              | Returns                                   |
| ----------------------- | ----------------------------------------- |
| `@foorm.fn.label`       | `string`                                  |
| `@foorm.fn.description` | `string`                                  |
| `@foorm.fn.hint`        | `string`                                  |
| `@foorm.fn.placeholder` | `string`                                  |
| `@foorm.fn.disabled`    | `boolean`                                 |
| `@foorm.fn.hidden`      | `boolean`                                 |
| `@foorm.fn.readonly`    | `boolean`                                 |
| `@foorm.fn.value`       | `any`                                     |
| `@foorm.fn.classes`     | `string \| Record<string, boolean>`       |
| `@foorm.fn.styles`      | `string \| Record<string, string>`        |
| `@foorm.fn.options`     | `TFoormEntryOptions[]`                    |
| `@foorm.fn.attr`        | multi, args: `name: string`, `fn: string` |

### Array annotations

| Annotation                  | Args     | nodeType |
| --------------------------- | -------- | -------- |
| `@foorm.array.add.label`    | `string` | prop     |
| `@foorm.array.remove.label` | `string` | prop     |
| `@foorm.array.sortable`     | (none)   | prop     |

## Registered Primitives

All under the `foorm` namespace (phantom container type):

| Primitive         | Underlying Type | Description                     |
| ----------------- | --------------- | ------------------------------- |
| `foorm.action`    | phantom         | Action button, not a data field |
| `foorm.paragraph` | phantom         | Read-only static content        |
| `foorm.select`    | `string`        | Dropdown select field           |
| `foorm.radio`     | `string`        | Radio button group              |
| `foorm.checkbox`  | `boolean`       | Boolean checkbox toggle         |

**Phantom types** are excluded from TypeScript data types, form data, validation, and serialization.

## Built-in Type Values

The `@foorm.type` annotation accepts these built-in values:

```
text, password, number, select, textarea, checkbox, radio, date, paragraph, action
```

Add more via `extraTypes` option:

```ts
foormPlugin({ extraTypes: ['color', 'rating', 'date-range'] })
```

## Compile-time Validation

The plugin validates function strings at compile time:

- `@foorm.fn.*` and `@foorm.validate` strings are parsed with `new Function()` during compilation
- Syntax errors produce IDE diagnostics with line/column info
- `@foorm.fn.title` validates target: only allowed on object/array fields (not leaf props)

## Best Practices

- Always import `foormPlugin` from `@foormjs/atscript/plugin` in `atscript.config.ts` only
- Run `npx asc -f dts` after changing `atscript.config.ts` to regenerate type declarations
- Use `extraTypes` for custom field types rather than arbitrary strings in `@foorm.type`
- Use `components` for custom component names to get IDE autocomplete for `@foorm.component`
