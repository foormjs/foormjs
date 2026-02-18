# Getting Started with foormjs

## Installation

### Vue Project (most common)

```bash
pnpm add @foormjs/vue @foormjs/atscript @atscript/core @atscript/typescript
pnpm add -D unplugin-atscript @vitejs/plugin-vue
```

### Non-Vue / Server-Side (core only)

```bash
pnpm add @foormjs/atscript @atscript/typescript
```

`@atscript/typescript` is a peer dependency — it provides the runtime type system, validators, and serialization utilities.

---

## Project Setup

### 1. ATScript Configuration

Create `atscript.config.ts` in your project root:

```ts
import { defineConfig } from '@atscript/core'
import ts from '@atscript/typescript'
import { foormPlugin } from '@foormjs/atscript/plugin'

export default defineConfig({
  rootDir: 'src',
  plugins: [ts(), foormPlugin()],
})
```

`foormPlugin()` registers all `@foorm.*` annotations and primitives. Optional config:

```ts
foormPlugin({
  extraTypes: ['color', 'rating', 'date-range'], // Custom field types for @foorm.type autocomplete
  components: ['StarRating', 'ColorPicker'], // Custom component names for @foorm.component autocomplete
})
```

### 2. Vite Configuration

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import atscript from 'unplugin-atscript/vite'

export default defineConfig({
  plugins: [atscript(), vue()],
})
```

**Important:** `atscript()` must come before `vue()` in the plugins array.

### 3. TypeScript Configuration

Add `atscript.d.ts` to your tsconfig for annotation autocomplete:

```json
{
  "include": ["src/**/*", "atscript.d.ts"]
}
```

Generate it (run once, and again after changing `atscript.config.ts`):

```bash
npx asc -f dts
```

### 4. VSCode Extension (recommended)

Install the [ATScript VSCode extension](https://atscript.moost.org/packages/vscode) for `.as` file syntax highlighting, autocomplete, and diagnostics.

---

## First Form

### 1. Create a `.as` schema

```
// src/forms/login.as
@foorm.title 'Sign In'
@foorm.submit.text 'Log In'
export interface LoginForm {
    @meta.label 'Email'
    @meta.placeholder 'you@example.com'
    @foorm.autocomplete 'email'
    @meta.required 'Email is required'
    @foorm.order 1
    email: string.email

    @meta.label 'Password'
    @foorm.type 'password'
    @meta.required 'Password is required'
    @foorm.order 2
    password: string
}
```

### 2. Use in Vue

```vue
<script setup lang="ts">
import { OoForm, useFoorm } from '@foormjs/vue'
import { LoginForm } from './forms/login.as'

const { def, formData } = useFoorm(LoginForm)

function handleSubmit(data: typeof formData) {
  console.log('Login:', data) // { email: string, password: string }
}
</script>

<template>
  <OoForm :def="def" :form-data="formData" first-validation="on-blur" @submit="handleSubmit" />
</template>
```

This renders a working form with default HTML inputs, blur-triggered validation, and type-safe submit data.

---

## Folder Structure (recommended)

```
src/
  forms/
    login.as              # Form schemas
    registration.as
    profile-edit.as
  components/
    form-fields/
      MyTextInput.vue     # Your custom field components
      MySelect.vue
      MyCheckbox.vue
  atscript.d.ts           # Generated — do not edit
atscript.config.ts        # ATScript + foorm plugin config
vite.config.ts
```

---

## What Gets Generated

When you import from a `.as` file:

```ts
import { LoginForm } from './forms/login.as'
```

`LoginForm` is an ATScript annotated type object with:

- `LoginForm.type` — type structure (props map with metadata)
- `LoginForm.metadata` — top-level annotations (`foorm.title`, etc.)
- `LoginForm.validator()` — creates an ATScript Validator instance

The `unplugin-atscript` Vite plugin handles the compilation transparently. A `.as.d.ts` file is generated alongside each `.as` file for TypeScript type inference.
