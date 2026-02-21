---
name: foormjs-atscript
description: '@foormjs/atscript — foorm annotations and form model for ATScript. Use when seeing .as files with @foorm.* annotations, working with foorm forms, configuring foormPlugin in atscript.config.ts, or validating form data.'
---

# @foormjs/atscript

Provides `@foorm.*` annotations for ATScript `.as` files and a framework-agnostic runtime that converts annotated types into form definitions with validation. The `foormPlugin()` registers all annotations and primitives; the runtime resolves metadata on demand.

## How to use this skill

Read the domain file that matches the task. Do not load all files — only what you need.

| Domain                           | File                           | Load when...                                                                                                                                |
| -------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Writing form schemas             | [schema.md](schema.md)         | Writing `.as` files — annotations, field types, validation, options, arrays, unions, nested groups, computed properties, ad-hoc annotations |
| Core concepts & form definitions | [core.md](core.md)             | Creating form definitions, form data, backend-driven forms (serialization/deserialization), manual type building                            |
| Field metadata resolution        | [resolve.md](resolve.md)       | Resolving field properties (labels, disabled, options, attrs), the dual-scope pattern, `buildFieldEntry`                                    |
| Validation                       | [validation.md](validation.md) | Form/field validation, `getFormValidator`, `createFieldValidator`, `foormValidatorPlugin`, custom validators                                |
| ATScript plugin & annotations    | [plugin.md](plugin.md)         | Configuring `atscript.config.ts`, `foormPlugin()`, full annotation reference (`@foorm.*`), foorm primitives, IDE autocomplete               |
| Types reference                  | [types.md](types.md)           | Type definitions for FoormDef, FoormFieldDef, scope types, union variants, type guards                                                      |

## Quick reference

```ts
// Runtime (main entry — @foormjs/atscript)
import {
  createFoormDef,
  createFormData,
  getFormValidator,
  resolveFieldProp,
} from '@foormjs/atscript'

// Build-time plugin (atscript.config.ts only — never import at runtime)
import { foormPlugin } from '@foormjs/atscript/plugin'

// Create form def + data
const def = createFoormDef(MyForm)
const formData = createFormData(MyForm, def.fields)

// Validate
const validate = getFormValidator(def)
const errors = validate({ data: formData.value })
```

## Annotation Quick Reference

Forms are defined in `.as` files with `@foorm.*` annotations. See [plugin.md](plugin.md) for the full reference.

**Form-level:** `@foorm.title`, `@foorm.submit.text`, `@foorm.fn.title`, `@foorm.fn.submit.text`, `@foorm.fn.submit.disabled`

**Field-level static:** `@foorm.type`, `@foorm.component`, `@foorm.order`, `@foorm.hidden`, `@foorm.disabled`, `@foorm.readonly`, `@foorm.value`, `@foorm.autocomplete`, `@foorm.altAction`

**Field-level multi:** `@foorm.options` (label, value), `@foorm.attr` (name, value), `@foorm.validate` (fn string)

**Field-level computed (`@foorm.fn.*`):** `label`, `description`, `hint`, `placeholder`, `disabled`, `hidden`, `readonly`, `value`, `classes`, `styles`, `options`, `attr`

**Array:** `@foorm.array.add.label`, `@foorm.array.remove.label`, `@foorm.array.sortable`

**Primitives:** `foorm.select`, `foorm.radio`, `foorm.checkbox`, `foorm.action` (phantom), `foorm.paragraph` (phantom)
