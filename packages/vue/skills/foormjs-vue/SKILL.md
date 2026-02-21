---
name: foormjs-vue
description: '@foormjs/vue — Vue 3 form rendering via OoForm. Use when building forms with OoForm component, creating custom type components or named components, using useFoormArray/useFoormUnion composables, or working with the types/components props.'
---

# @foormjs/vue

Vue 3 form rendering powered by OoForm. You provide a `types` map (field type → Vue component) and optionally a `components` map (name → Vue component), and OoForm renders the entire form tree through a unified OoField renderer.

## How to use this skill

Read the domain file that matches the task. Do not load all files — only what you need.

| Domain                     | File                                         | Load when...                                                                                                                                             |
| -------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OoForm setup & API         | [core.md](core.md)                           | Setting up OoForm, `types` vs `components` props, events, slots, `useFoorm`, `createDefaultTypes`, validation timing                                     |
| Creating custom components | [custom-components.md](custom-components.md) | Building custom type components for any field kind — responsibility matrix, `TFoormComponentProps`, complete examples for leaf/structural/phantom fields |
| Array & union composables  | [composables.md](composables.md)             | `useFoormArray`, `useFoormUnion`, `useConsumeUnionContext`, `formatIndexedLabel`                                                                         |
| Rendering architecture     | [rendering.md](rendering.md)                 | OoField internals, component resolution, nesting levels, provide/inject keys, allStatic optimization                                                     |
| Default components         | [defaults.md](defaults.md)                   | Built-in OoInput, OoSelect, OoObject, OoArray, OoUnion — what each renders, internal helpers, overriding patterns                                        |

## Quick reference

```ts
import { OoForm, useFoorm, createDefaultTypes } from '@foormjs/vue'
import type { TFoormComponentProps, TFoormTypeComponents } from '@foormjs/vue'

const { def, formData } = useFoorm(MyForm)

// Use defaults
const types = createDefaultTypes()

// Or override specific types
const types = { ...createDefaultTypes(), text: MyInput, select: MySelect }
```

```vue
<OoForm
  :def="def"
  :form-data="formData"
  :types="types"
  :components="{ StarRating: MyStarRating }"
  @submit="onSubmit"
  @change="onChange"
/>
```

**Two ways to provide custom components:**

- `types` prop — maps field type strings (`@foorm.type` or auto-inferred) to components. Every field always has a type.
- `components` prop — maps named components (`@foorm.component`) to components. Per-field override, takes priority over `types`.

**Writing `.as` form schemas:** Forms are defined in `.as` files with `@foorm.*` annotations. See the `@foormjs/atscript` skill's `schema.md` for the full guide — field types, validation, options, arrays, unions, nested groups, computed properties.
