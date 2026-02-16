# ATScript Custom Annotations Skill

## Overview

This skill covers how to create custom annotations for ATScript. ATScript annotations are metadata attached to interfaces, types, and properties in `.as` files. Custom annotations extend the built-in annotation system with domain-specific metadata.

**Important:** ATScript is a separate language with `.as` files — it is NOT TypeScript decorators. Custom annotations are defined in `atscript.config.js` using the `AnnotationSpec` class from `@atscript/core`.

---

## What ATScript Annotations Are

ATScript annotations are metadata that follow the `@namespace.name` syntax (e.g., `@meta.label`, `@expect.min`, `@ui.hidden`).

### Built-in Annotation Namespaces

- `@meta.*` — Descriptive metadata (label, description, placeholder, sensitive, readonly, id, isKey, documentation)
- `@expect.*` — Validation constraints (minLength, maxLength, min, max, int, pattern)

### Custom Annotations

Custom annotations add new namespaces (e.g., `@ui.*`, `@api.*`, `@db.*`, `@auth.*`) defined in the project's `atscript.config.js`.

---

## Configuration Location

Custom annotations are defined under the `annotations` key in `atscript.config.js`, organized by namespace.

```js
// atscript.config.js
import { defineConfig, AnnotationSpec } from '@atscript/core'
import ts from '@atscript/typescript'

export default defineConfig({
  rootDir: 'src',
  plugins: [ts()],
  annotations: {
    // Namespace → annotation definitions
    namespaceName: {
      annotationName: new AnnotationSpec({
        /* options */
      }),
    },
  },
})
```

---

## AnnotationSpec Constructor Options

| Option          | Type                                                 | Default        | Description                                                                         |
| --------------- | ---------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------- |
| `description`   | `string`                                             | —              | Shown in IntelliSense hover tooltips                                                |
| `nodeType`      | `string[]`                                           | (unrestricted) | Valid targets: `'interface'`, `'type'`, `'prop'`                                    |
| `argument`      | `{ name: string, type: string, optional?: boolean }` | —              | Defines the annotation's argument (type can be `'string'`, `'number'`, `'boolean'`) |
| `multiple`      | `boolean`                                            | `false`        | Whether the annotation can appear more than once on the same node                   |
| `mergeStrategy` | `'replace' \| 'append'`                              | `'replace'`    | How annotation values merge during type inheritance                                 |

### Merge Strategy Behavior

- **`replace`** (default): During inheritance, the child's annotation value overwrites the parent's.
- **`append`**: Values accumulate across the inheritance chain into an array.

### nodeType Restrictions

- `'interface'` — annotation can only be placed on interface declarations
- `'type'` — annotation can only be placed on type declarations
- `'prop'` — annotation can only be placed on properties
- Omitting `nodeType` allows the annotation on any node.

### Argument Types

The `argument.type` must be one of:

- `'string'` — String values
- `'number'` — Numeric values
- `'boolean'` — Boolean values

---

## Complete Configuration Example

```js
// atscript.config.js
import { defineConfig, AnnotationSpec } from '@atscript/core'
import ts from '@atscript/typescript'

export default defineConfig({
  rootDir: 'src',
  plugins: [ts()],
  annotations: {
    ui: {
      hidden: new AnnotationSpec({
        description: 'Hide this field in the UI',
        nodeType: ['prop'],
      }),
      column: new AnnotationSpec({
        description: 'Table column width in pixels',
        argument: { name: 'width', type: 'number' },
      }),
      tag: new AnnotationSpec({
        description: 'UI display tag',
        multiple: true,
        mergeStrategy: 'append',
        argument: { name: 'value', type: 'string' },
      }),
      component: new AnnotationSpec({
        description: 'Custom UI component name to render this field',
        nodeType: ['prop'],
        argument: { name: 'name', type: 'string' },
      }),
    },
    api: {
      deprecated: new AnnotationSpec({
        description: 'Mark as deprecated in API',
        argument: { name: 'message', type: 'string', optional: true },
      }),
      version: new AnnotationSpec({
        description: 'API version this field was introduced',
        argument: { name: 'version', type: 'string' },
      }),
    },
    db: {
      collection: new AnnotationSpec({
        description: 'Database collection name',
        nodeType: ['interface'],
        argument: { name: 'name', type: 'string' },
      }),
      index: new AnnotationSpec({
        description: 'Create database index on this field',
        nodeType: ['prop'],
        multiple: true,
        mergeStrategy: 'append',
        argument: { name: 'type', type: 'string' },
      }),
      unique: new AnnotationSpec({
        description: 'Field must have unique values',
        nodeType: ['prop'],
      }),
    },
    auth: {
      role: new AnnotationSpec({
        description: 'Required role to access this resource',
        multiple: true,
        mergeStrategy: 'append',
        argument: { name: 'role', type: 'string' },
      }),
      scope: new AnnotationSpec({
        description: 'Required OAuth scope',
        multiple: true,
        mergeStrategy: 'append',
        argument: { name: 'scope', type: 'string' },
      }),
    },
  },
})
```

---

## Usage in .as Files

After defining annotations in config, use them in `.as` files with the `@namespace.name` syntax:

```atscript
@db.collection 'users'
@api.version '2.0'
export interface User {
    @ui.hidden
    @db.index 'btree'
    @db.unique
    internalId: string

    @ui.column 200
    @ui.tag 'primary'
    @ui.tag 'searchable'
    @db.index 'text'
    name: string

    @ui.component 'email-input'
    @api.deprecated 'Use contactEmail instead'
    @db.unique
    email: string.email

    @auth.role 'admin'
    @auth.role 'editor'
    permissions: string[]
}
```

### Annotation Argument Syntax

- **Flag annotations** (no argument): `@ui.hidden`
- **String arguments**: `@ui.tag 'value'` or `@ui.component "email-input"`
- **Number arguments**: `@ui.column 200`
- **Boolean arguments**: `@feature.enabled true`
- **Multiple arguments** (like `@expect.pattern`): `@expect.pattern "^[A-Z]", "i", "Must start with uppercase"`

---

## Runtime Metadata Access

Custom annotations are accessible at runtime through the generated type's metadata:

```typescript
import { User } from './user.as'

// Access interface-level metadata
User.metadata.get('db.collection') // 'users'
User.metadata.get('api.version') // '2.0'

// Access property-level metadata
const nameProp = User.type.props.get('name')
nameProp?.metadata.get('ui.column') // 200
nameProp?.metadata.get('ui.tag') // ['primary', 'searchable'] (array because multiple + append)
nameProp?.metadata.get('db.index') // ['text']

const emailProp = User.type.props.get('email')
emailProp?.metadata.get('api.deprecated') // 'Use contactEmail instead'
emailProp?.metadata.get('ui.component') // 'email-input'
emailProp?.metadata.has('db.unique') // true

const permissionsProp = User.type.props.get('permissions')
permissionsProp?.metadata.get('auth.role') // ['admin', 'editor']
```

### Metadata API

```typescript
// Get annotation value (returns undefined if not set)
metadata.get(key: string): any

// Check if annotation exists
metadata.has(key: string): boolean

// Get all annotation keys
metadata.keys(): IterableIterator<string>
```

### Return Value Types

- **Single-value annotations** return the scalar value directly (`string`, `number`, or `boolean`)
- **Annotations with `multiple: true` and `mergeStrategy: 'append'`** return an array of values
- **Flag annotations** (no argument) return `true` when present (check with `.has()`)

---

## Inheritance Behavior

Annotations propagate through type inheritance:

1. **Type → Property**: A property using an annotated type inherits those annotations
2. **Interface inheritance**: Child interfaces inherit parent annotations
3. **Priority** (lowest to highest): Final type annotations → Referenced property annotations → Current property annotations

The `mergeStrategy` controls how inherited values combine:

- `replace`: child overwrites parent
- `append`: values accumulate into an array

### Example

```atscript
@ui.tag 'base'
export type UserId = string.uuid

export interface BaseEntity {
    @ui.tag 'entity'
    id: UserId
}

export interface User extends BaseEntity {
    @ui.tag 'user'
    id: UserId
}
```

With `mergeStrategy: 'append'`, the `id` property in `User` has:

```typescript
User.type.props.get('id')?.metadata.get('ui.tag')
// ['base', 'entity', 'user']
```

With `mergeStrategy: 'replace'`, only the last value is kept:

```typescript
User.type.props.get('id')?.metadata.get('ui.tag')
// 'user'
```

---

## Common Patterns

### Flag Annotations (No Argument)

**Definition:**

```js
hidden: new AnnotationSpec({
  description: 'Hide this field in the UI',
  nodeType: ['prop'],
})
```

**Usage:**

```atscript
@ui.hidden
password: string
```

**Runtime Access:**

```typescript
prop.metadata.has('ui.hidden') // true/false
```

---

### Single-Value Annotations

**Definition:**

```js
label: new AnnotationSpec({
  description: 'Display label for this field',
  argument: { name: 'text', type: 'string' },
})
```

**Usage:**

```atscript
@ui.label 'Full Name'
name: string
```

**Runtime Access:**

```typescript
prop.metadata.get('ui.label') // 'Full Name'
```

---

### Numeric Annotations

**Definition:**

```js
priority: new AnnotationSpec({
  description: 'Display priority (higher = more important)',
  argument: { name: 'value', type: 'number' },
})
```

**Usage:**

```atscript
@ui.priority 10
importantField: string
```

**Runtime Access:**

```typescript
prop.metadata.get('ui.priority') // 10
```

---

### Repeatable Annotations (Accumulate Values)

**Definition:**

```js
role: new AnnotationSpec({
  description: 'Required role to access this field',
  multiple: true,
  mergeStrategy: 'append',
  argument: { name: 'role', type: 'string' },
})
```

**Usage:**

```atscript
@auth.role 'admin'
@auth.role 'editor'
sensitiveData: string
```

**Runtime Access:**

```typescript
prop.metadata.get('auth.role') // ['admin', 'editor']
```

---

### Optional Argument Annotations

**Definition:**

```js
deprecated: new AnnotationSpec({
  description: 'Mark field as deprecated',
  argument: { name: 'message', type: 'string', optional: true },
})
```

**Usage:**

```atscript
@api.deprecated
oldField: string

@api.deprecated 'Use newField instead'
anotherOldField: string
```

**Runtime Access:**

```typescript
prop.metadata.get('api.deprecated') // true or 'Use newField instead'
```

---

### Interface-Only Annotations

**Definition:**

```js
entity: new AnnotationSpec({
  description: 'Mark as database entity',
  nodeType: ['interface'],
  argument: { name: 'collection', type: 'string' },
})
```

**Usage:**

```atscript
@db.entity 'users'
export interface User {
  id: string
}
```

This annotation can ONLY be placed on interface declarations. Using it on properties or types will cause a validation error.

---

### Property-Only Annotations

**Definition:**

```js
computed: new AnnotationSpec({
  description: 'Field is computed and should not be stored',
  nodeType: ['prop'],
})
```

**Usage:**

```atscript
export interface Product {
  price: number
  quantity: number

  @db.computed
  total: number
}
```

---

## Post-Configuration Step

After adding or modifying custom annotations, **regenerate the type declaration file** for IntelliSense:

```bash
npx asc -f dts
```

This updates `atscript.d.ts` so the IDE recognizes the new annotations with full autocompletion and hover documentation.

**Important:** Always run this command after changing `atscript.config.js` annotations.

---

## Workflow for Creating Custom Annotations

### 1. Understand the Requirement

- What metadata needs to be captured?
- On what nodes (interfaces, types, properties)?
- Does it need an argument? What type?
- Should it appear multiple times?
- How should it behave during inheritance?

### 2. Choose a Namespace

Group related annotations under a meaningful namespace:

- `ui.*` — UI-related metadata (labels, components, visibility)
- `api.*` — API versioning, deprecation, documentation
- `db.*` — Database mappings, indexes, constraints
- `auth.*` — Authorization and authentication
- `validation.*` — Custom validation rules
- `doc.*` — Documentation metadata
- `feature.*` — Feature flags

### 3. Define Each Annotation

Create an `AnnotationSpec` with appropriate options:

```js
annotationName: new AnnotationSpec({
  description: 'Clear description for IntelliSense',
  nodeType: ['prop'], // Optional: restrict to specific nodes
  argument: { name: 'value', type: 'string' }, // Optional
  multiple: false, // Can it appear multiple times?
  mergeStrategy: 'replace', // How to merge during inheritance
})
```

### 4. Add to atscript.config.js

```js
export default defineConfig({
  rootDir: 'src',
  plugins: [ts()],
  annotations: {
    yourNamespace: {
      yourAnnotation: new AnnotationSpec({
        /* ... */
      }),
    },
  },
})
```

### 5. Run Type Generation

```bash
npx asc -f dts
```

### 6. Use in .as Files

```atscript
export interface YourType {
  @yourNamespace.yourAnnotation 'value'
  field: string
}
```

### 7. Access at Runtime

```typescript
import { YourType } from './your-type.as'

const prop = YourType.type.props.get('field')
const value = prop?.metadata.get('yourNamespace.yourAnnotation')
```

---

## Real-World Examples

### Example 1: UI Framework Integration

**Goal:** Create annotations for dynamic form generation

**Configuration:**

```js
annotations: {
  ui: {
    label: new AnnotationSpec({
      description: 'Display label for form field',
      nodeType: ['prop'],
      argument: { name: 'text', type: 'string' },
    }),
    placeholder: new AnnotationSpec({
      description: 'Placeholder text for input field',
      nodeType: ['prop'],
      argument: { name: 'text', type: 'string' },
    }),
    component: new AnnotationSpec({
      description: 'Custom component to render this field',
      nodeType: ['prop'],
      argument: { name: 'name', type: 'string' },
    }),
    hidden: new AnnotationSpec({
      description: 'Hide field in UI',
      nodeType: ['prop'],
    }),
    order: new AnnotationSpec({
      description: 'Display order in form',
      nodeType: ['prop'],
      argument: { name: 'value', type: 'number' },
    }),
  },
}
```

**Usage:**

```atscript
export interface UserForm {
  @ui.hidden
  id: string.uuid

  @ui.label 'Full Name'
  @ui.placeholder 'Enter your full name'
  @ui.order 1
  name: string

  @ui.label 'Email Address'
  @ui.placeholder 'user@example.com'
  @ui.component 'email-input'
  @ui.order 2
  email: string.email
}
```

**Runtime Usage:**

```typescript
function generateForm(type: TAtscriptAnnotatedType) {
  const fields = []
  const objectType = type.type as TAtscriptObjectType

  for (const [name, prop] of objectType.props) {
    if (prop.metadata.has('ui.hidden')) continue

    fields.push({
      name,
      label: prop.metadata.get('ui.label') || name,
      placeholder: prop.metadata.get('ui.placeholder') || '',
      component: prop.metadata.get('ui.component') || 'text-input',
      order: prop.metadata.get('ui.order') || 999,
    })
  }

  return fields.sort((a, b) => a.order - b.order)
}
```

---

### Example 2: Database ORM Integration

**Goal:** Map ATScript types to database schemas

**Configuration:**

```js
annotations: {
  db: {
    collection: new AnnotationSpec({
      description: 'Database collection/table name',
      nodeType: ['interface'],
      argument: { name: 'name', type: 'string' },
    }),
    column: new AnnotationSpec({
      description: 'Database column name',
      nodeType: ['prop'],
      argument: { name: 'name', type: 'string' },
    }),
    index: new AnnotationSpec({
      description: 'Create index on this field',
      nodeType: ['prop'],
      multiple: true,
      mergeStrategy: 'append',
      argument: { name: 'type', type: 'string' },
    }),
    unique: new AnnotationSpec({
      description: 'Field must have unique values',
      nodeType: ['prop'],
    }),
    autoIncrement: new AnnotationSpec({
      description: 'Auto-increment this field',
      nodeType: ['prop'],
    }),
  },
}
```

**Usage:**

```atscript
@db.collection 'users'
export interface User {
  @db.autoIncrement
  @db.index 'primary'
  id: number.int

  @db.column 'user_email'
  @db.unique
  @db.index 'btree'
  email: string.email

  @db.column 'full_name'
  @db.index 'text'
  name: string
}
```

---

### Example 3: API Documentation

**Goal:** Generate OpenAPI/Swagger documentation

**Configuration:**

```js
annotations: {
  api: {
    endpoint: new AnnotationSpec({
      description: 'API endpoint path',
      nodeType: ['interface'],
      argument: { name: 'path', type: 'string' },
    }),
    summary: new AnnotationSpec({
      description: 'API endpoint summary',
      argument: { name: 'text', type: 'string' },
    }),
    deprecated: new AnnotationSpec({
      description: 'Mark as deprecated',
      argument: { name: 'message', type: 'string', optional: true },
    }),
    example: new AnnotationSpec({
      description: 'Example value for documentation',
      nodeType: ['prop'],
      argument: { name: 'value', type: 'string' },
    }),
    version: new AnnotationSpec({
      description: 'API version this was introduced',
      argument: { name: 'version', type: 'string' },
    }),
  },
}
```

**Usage:**

```atscript
@api.endpoint '/api/users'
@api.summary 'User management endpoint'
@api.version '2.0'
export interface User {
  @api.example '123e4567-e89b-12d3-a456-426614174000'
  id: string.uuid

  @api.example 'john.doe@example.com'
  email: string.email

  @api.deprecated 'Use displayName instead'
  name: string
}
```

---

## Important Notes

1. **ATScript is NOT TypeScript decorators**
   - Do NOT use `reflect-metadata`, `createAnnotation`, or any decorator-based patterns
   - Annotations are defined purely in `atscript.config.js`
   - No TypeScript code is needed to define annotations

2. **Argument Types**
   - The `argument.type` must be one of: `'string'`, `'number'`, `'boolean'`
   - Complex types (objects, arrays) are not supported as annotation arguments

3. **Type Declaration Updates**
   - Always run `npx asc -f dts` after config changes
   - This updates IntelliSense so the IDE recognizes new annotations

4. **Unknown Annotations**
   - By default, unknown annotations cause errors
   - Set `unknownAnnotation: 'allow'` or `'warn'` in config during prototyping:
     ```js
     export default defineConfig({
       unknownAnnotation: 'warn', // or 'allow'
       // ...
     })
     ```

5. **Namespace Naming**
   - Use clear, short namespace names (e.g., `ui`, `db`, `api`)
   - Avoid conflicts with built-in namespaces (`meta`, `expect`)

6. **Boolean Arguments**
   - For flag-like behavior, prefer annotations without arguments
   - Use `.has()` to check for presence instead of `.get()`

---

## Best Practices

### 1. Use Descriptive Names

```js
// Good
@ui.hidden
@api.deprecated
@db.unique

// Avoid
@ui.h
@api.dep
@db.u
```

### 2. Group Related Annotations

```js
// Good: Related annotations under same namespace
ui: {
  label: new AnnotationSpec({ /* ... */ }),
  placeholder: new AnnotationSpec({ /* ... */ }),
  component: new AnnotationSpec({ /* ... */ }),
}

// Avoid: Scattered across namespaces
ui: { label: ... },
form: { placeholder: ... },
render: { component: ... },
```

### 3. Restrict Node Types When Appropriate

```js
// Good: Restricts collection to interfaces only
collection: new AnnotationSpec({
  nodeType: ['interface'],
  // ...
})

// Bad: Allowing on properties doesn't make sense
collection: new AnnotationSpec({
  // No nodeType restriction
})
```

### 4. Use Meaningful Descriptions

```js
// Good: Clear, helpful description
label: new AnnotationSpec({
  description: 'Human-readable label shown in forms and tables',
  // ...
})

// Avoid: Vague or missing description
label: new AnnotationSpec({
  description: 'Label',
  // ...
})
```

### 5. Choose Appropriate Merge Strategies

```js
// Use 'append' for accumulating values
tags: new AnnotationSpec({
  multiple: true,
  mergeStrategy: 'append',
  // ...
})

// Use 'replace' for single-value overrides
label: new AnnotationSpec({
  mergeStrategy: 'replace',
  // ...
})
```

---

## Troubleshooting

### IntelliSense Not Showing New Annotations

**Solution:** Run `npx asc -f dts` to regenerate type declarations

### Unknown Annotation Error

**Problem:** Using an annotation not defined in config

**Solution:**

1. Add the annotation to `atscript.config.js`
2. Or set `unknownAnnotation: 'allow'` in config temporarily

### Annotation Not Accessible at Runtime

**Problem:** `metadata.get()` returns `undefined`

**Possible causes:**

1. Typo in annotation name
2. Annotation not applied in `.as` file
3. Wrong property/interface accessed

**Solution:**

```typescript
// Check if annotation exists first
if (prop.metadata.has('ui.label')) {
  const label = prop.metadata.get('ui.label')
}
```

### Annotation Applied to Wrong Node Type

**Problem:** Trying to use property annotation on interface

**Solution:** Check `nodeType` restriction in annotation definition

---

## Quick Reference

### Define Annotation

```js
// atscript.config.js
annotations: {
  namespace: {
    name: new AnnotationSpec({
      description: 'Description',
      nodeType: ['prop'],
      argument: { name: 'value', type: 'string' },
      multiple: false,
      mergeStrategy: 'replace',
    }),
  },
}
```

### Use in .as File

```atscript
@namespace.name 'value'
field: string
```

### Access at Runtime

```typescript
prop.metadata.get('namespace.name') // 'value'
prop.metadata.has('namespace.name') // true
```

### Update IntelliSense

```bash
npx asc -f dts
```
