---
name: foorm
description: foormjs — ATScript-first validatable forms for Vue. Use when building forms with .as schemas, using OoForm/OoField components, creating custom field components, setting up foorm in a Vue project, or working with backend-driven forms via serialization.
---

# foormjs Skill

foormjs provides ATScript-first validatable forms for Vue. Define forms declaratively in `.as` schema files — fields, labels, validators, computed properties, options — then render with your own UI components via renderless wrappers.

## Sub-Files

| File                 | When to Read                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `getting-started.md` | Project setup, installation, ATScript config, Vite config, first form                                                        |
| `schema.md`          | Writing `.as` form schemas — annotations, primitives, computed properties, validators, options, attrs, arrays, nested groups |
| `vue-components.md`  | `OoForm`, `OoField`, `OoGroup`, `OoArray`, `useFoorm`, slots, events, custom components, arrays, nested groups               |
| `core-api.md`        | `@foormjs/atscript` package API — `createFoormDef`, `getFormValidator`, resolve utilities, array/group types                 |
| `serialization.md`   | Backend-driven forms — serializing/deserializing annotated types, sending schemas over the wire                              |

## Packages

| Package                    | npm                    | Description                                                                                  |
| -------------------------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| `@foormjs/atscript`        | `@foormjs/atscript`    | Core form model — definitions, validation, metadata resolution                               |
| `@foormjs/atscript/plugin` | `@foormjs/atscript`    | ATScript plugin — registers `@foorm.*` annotations and primitives for IDE/build              |
| `@foormjs/composables`     | `@foormjs/composables` | Framework-agnostic form composables (`useFoormForm`, `useFoormField`)                        |
| `@foormjs/vue`             | `@foormjs/vue`         | Renderless Vue components — `OoForm`, `OoField`, `OoGroup`, `OoArray`, `useFoorm` composable |

## How It Works

```
.as schema file          @foormjs/atscript       @foormjs/vue
─────────────────    ─────────────────────    ─────────────────────
@foorm.title '...'   createFoormDef(type)     useFoorm(Type)
@meta.label '...'    → FoormDef { fields }    → { def, formData }
@foorm.validate      getFormValidator(def)
email: string.email  → (data) => { passed }   <OoForm :def :form-data>
                                                → renders OoField per field
                                                → your components via slots/props
```

1. **Define** — Write an annotated interface in a `.as` file
2. **Process** — `@atscript/typescript` compiles it into an annotated type with metadata maps
3. **Create** — `createFoormDef()` / `useFoorm()` turns it into a form definition with ordered fields
4. **Render** — `OoForm` iterates fields, resolves metadata on demand, renders your components
5. **Validate** — `getFormValidator()` creates a reusable validator combining `@expect.*` + `@foorm.validate`

## Quick Reference

```bash
# Install (Vue project)
pnpm add @foormjs/vue @foormjs/atscript @atscript/core @atscript/typescript
pnpm add -D unplugin-atscript @vitejs/plugin-vue
```

```ts
// atscript.config.ts
import { defineConfig } from '@atscript/core'
import ts from '@atscript/typescript'
import { foormPlugin } from '@foormjs/atscript/plugin'

export default defineConfig({
  rootDir: 'src',
  plugins: [ts(), foormPlugin()],
})
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import atscript from 'unplugin-atscript/vite'

export default defineConfig({
  plugins: [atscript(), vue()],
})
```

```vue
<script setup lang="ts">
import { OoForm, useFoorm } from '@foormjs/vue'
import { MyForm } from './forms/my-form.as'

const { def, formData } = useFoorm(MyForm)
</script>

<template>
  <OoForm :def="def" :form-data="formData" @submit="handleSubmit" />
</template>
```

## Key Caveats

- **ATScript is required** — forms are defined in `.as` files, not TypeScript. The `unplugin-atscript` Vite plugin must be installed for `.as` imports to work.
- **`@foormjs/atscript/plugin`** is build-time only — import it in `atscript.config.ts`, never in runtime code.
- **`@foorm.fn.*` functions are strings** — they're compiled at runtime via `new Function()`. This means no imports, no closures — only pure expressions using `v`, `data`, `context`, `entry`.
- **Component resolution priority**: `@foorm.component` (named) > `components` prop > `types` prop > built-in defaults.
- **Phantom fields** (`foorm.action`, `foorm.paragraph`) are excluded from form data, validation, and TypeScript types — they only exist in the rendered field list.
- **`@foorm.order`** controls field rendering order. Fields without it appear in schema declaration order.
- **Optional fields** use `?:` in the schema. Non-optional fields are required by the foorm validator.
- **Arrays** (`type[]`) are supported for primitives, objects, and unions. Use `@foorm.array.add.label`, `@foorm.array.remove.label` for button labels. Use `@expect.minLength`/`@expect.maxLength` for array size constraints.
- **Nested groups** — use `@foorm.title` on a nested object field to render it as a titled, visually grouped section. Without `@foorm.title`, nested objects flatten into the parent form.
- **`@foorm.title`** works at three levels: interface-level (form title as `<h2>`), field-level on objects (group title as `<h3>`), field-level on arrays (array section title as `<h3>`).
