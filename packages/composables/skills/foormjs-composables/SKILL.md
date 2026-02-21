---
name: foormjs-composables
description: '@foormjs/composables — Framework-agnostic form composables for field registration, validation timing, and form state management. Use when working with useFoormForm, useFoormField, custom form state, validation strategies, or field registration lifecycle.'
---

# @foormjs/composables

Framework-agnostic form composables that manage form state, field registration, validation timing, and error handling. Used internally by `@foormjs/vue` — import directly only when building custom form integrations or non-Vue adapters.

## How to use this skill

Read the domain file that matches the task. Do not load all files — only what you need.

| Domain              | File                 | Load when...                                                                                                |
| ------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------- |
| Core concepts & API | [core.md](core.md)   | Understanding form/field composables, validation timing strategies, provide/inject keys, field registration |
| Types reference     | [types.md](types.md) | Type definitions for TFoormState, TFoormRule, TFoormFieldRegistration, UseFoormFieldOptions                 |

## Quick reference

```ts
import { useFoormForm, useFoormField } from '@foormjs/composables'
import type { TFoormState, TFoormRule } from '@foormjs/composables'

// Form-level (provides __foorm_form, __foorm_form_data, __foorm_form_context)
const { submit, clearErrors, reset, setErrors } = useFoormForm({
  formData,
  formContext,
  firstValidation,
  submitValidator,
})

// Field-level (injects from parent form)
const { model, error, onBlur } = useFoormField({
  getValue,
  setValue,
  rules,
  path,
  resetValue,
})
```
