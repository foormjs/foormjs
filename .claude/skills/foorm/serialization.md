# Backend-Driven Forms (Serialization)

ATScript annotated types can be serialized to JSON on the backend and deserialized on the frontend to create fully functional forms — without shipping `.as` files to the client.

This enables **backend-controlled forms** where the server decides what fields to show, what validators to apply, and what options to offer.

## The Flow

```
Backend                          Network              Frontend
────────────────────────         ─────────            ────────────────────────
import { MyForm } from           JSON response        deserializeAnnotatedType()
  './form.as'                    ──────────►          → annotated type
serializeAnnotatedType(MyForm)                        createFoormDef(type)
→ JSON-safe object                                    → FoormDef
                                                      useFoorm / OoForm
                                                      → rendered form
```

## Backend: Serialize

```ts
import { serializeAnnotatedType } from '@atscript/typescript/utils'
import { RegistrationForm } from './forms/registration.as'

// Serialize the annotated type to a JSON-safe object
const serialized = serializeAnnotatedType(RegistrationForm)

// Send as JSON response
app.get('/api/form/registration', (req, res) => {
  res.json(serialized)
})
```

### Filtering Annotations

Strip internal/sensitive annotations before sending to the client:

```ts
const serialized = serializeAnnotatedType(RegistrationForm, {
  ignoreAnnotations: ['db.collection', 'meta.sensitive', 'internal.notes'],
})
```

## Frontend: Deserialize and Render

```ts
import { deserializeAnnotatedType } from '@atscript/typescript/utils'
import { createFoormDef, createFormData } from '@foormjs/atscript'

// Fetch the serialized type from the backend
const response = await fetch('/api/form/registration')
const serialized = await response.json()

// Deserialize into a live annotated type
const type = deserializeAnnotatedType(serialized)

// Create form definition and data — same as with .as imports
const def = createFoormDef(type)
const data = createFormData(type, def.fields)
```

### With Vue

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { deserializeAnnotatedType } from '@atscript/typescript/utils'
import { createFoormDef, createFormData } from '@foormjs/atscript'
import { OoForm } from '@foormjs/vue'
import type { FoormDef } from '@foormjs/atscript'

const def = ref<FoormDef>()
const formData = ref<Record<string, unknown>>({})

onMounted(async () => {
  const res = await fetch('/api/form/registration')
  const serialized = await res.json()
  const type = deserializeAnnotatedType(serialized)

  def.value = createFoormDef(type)
  formData.value = createFormData(type, def.value.fields)
})
</script>

<template>
  <OoForm v-if="def" :def="def" :form-data="formData" @submit="handleSubmit" />
</template>
```

**Note:** When using deserialized types with Vue, use `createFoormDef` + `createFormData` directly instead of `useFoorm()`, since the type isn't available at setup time.

---

## Validation with Deserialized Types

Deserialized types retain full validation capabilities:

```ts
const type = deserializeAnnotatedType(serialized)

// ATScript validator (direct)
const validator = type.validator()
validator.validate(data) // throws ValidatorError on failure

// Foorm validator (with foorm-specific handling)
const def = createFoormDef(type)
const validate = getFormValidator(def)
const errors = validate({ data }) // Record<string, string> — empty = passed
```

Both `@expect.*` constraints and `@foorm.validate` function strings survive serialization and work on the frontend.

---

## JSON Schema (alternative approach)

For interop with non-ATScript backends, ATScript supports JSON Schema round-tripping:

```ts
import { fromJsonSchema, buildJsonSchema } from '@atscript/typescript/utils'

// Backend sends a JSON Schema
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 3 },
    email: { type: 'string', format: 'email' },
    age: { type: 'number', minimum: 18 },
  },
  required: ['name', 'email'],
}

// Convert to annotated type
const type = fromJsonSchema(schema)

// Use with foorm
const def = createFoormDef(type)
```

**Limitation:** JSON Schema round-tripping preserves type structure and `@expect.*` constraints but loses foorm-specific annotations (`@foorm.validate`, `@foorm.fn.*`, `@meta.label`, etc.). Use ATScript serialization for full fidelity.

---

## Manual Type Building (no .as files)

Build annotated types programmatically for fully dynamic forms:

```ts
import { defineAnnotatedType } from '@atscript/typescript/utils'

const formType = defineAnnotatedType('object')
  .annotate('foorm.title', 'Dynamic Form')
  .annotate('foorm.submit.text', 'Send')
  .prop(
    'name',
    defineAnnotatedType()
      .designType('string')
      .annotate('meta.label', 'Full Name')
      .annotate('foorm.validate', '(v) => !!v || "Required"').$type
  )
  .prop(
    'email',
    defineAnnotatedType().designType('string').tag('email').annotate('meta.label', 'Email').$type,
    { optional: true }
  ).$type

const def = createFoormDef(formType)
```

---

## Use Cases

### 1. Server-Defined Forms

The server controls which forms exist and what fields they contain. The frontend is a generic renderer.

### 2. Role-Based Forms

Server serializes different forms (or uses `ignoreAnnotations`) based on user role.

### 3. A/B Testing

Server sends different form variants with different fields, validators, or labels.

### 4. Multi-Tenant Forms

Each tenant gets custom form schemas stored in a database, serialized and sent to the frontend.

### 5. Form Builder

A visual form builder saves form definitions as serialized ATScript types, then renders them at runtime.
