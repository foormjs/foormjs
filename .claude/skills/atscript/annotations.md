# ATScript Custom Annotations Skill

## Overview

This skill covers how to create custom annotations for ATScript. ATScript annotations are metadata attached to interfaces, types, and properties in `.as` files. Custom annotations extend the built-in annotation system with domain-specific metadata.

**Important:** ATScript is a separate language with `.as` files — it is NOT TypeScript decorators. Custom annotations are defined in `atscript.config.js` using the `AnnotationSpec` class from `@atscript/core`.

---

## What ATScript Annotations Are

ATScript annotations are metadata that follow the `@namespace.name` syntax (e.g., `@meta.label`, `@expect.min`, `@ui.hidden`).

### Built-in Annotation Namespaces

- `@meta.*` — Descriptive metadata (label, description, documentation, placeholder, sensitive, readonly, id, isKey)
- `@expect.*` — Validation constraints (minLength, maxLength, min, max, int, pattern) — all except `@expect.int` accept an optional custom error message as the last argument
- `@emit.*` — Code generation directives (e.g., `@emit.jsonSchema` to force build-time JSON Schema embedding)

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
    // Namespace -> annotation definitions
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
| `defType`       | `string[]`                                           | (unrestricted) | Restrict to specific underlying types (e.g., `['string']`, `['number']`, `['array']`) |
| `argument`      | `object \| object[]`                                 | —              | Single or array of argument definitions: `{ name, type, optional?, description?, values? }` |
| `multiple`      | `boolean`                                            | `false`        | Whether the annotation can appear more than once on the same node                   |
| `mergeStrategy` | `'replace' \| 'append'`                              | `'replace'`    | How annotation values merge during type inheritance                                 |
| `validate`      | `(mainToken, args, doc) => TMessages \| undefined`   | —              | Advanced: custom AST-level validation (plugin use)                                  |
| `modify`        | `(mainToken, args, doc) => void`                     | —              | Advanced: mutate the AST after annotation is applied (plugin use)                   |

### Argument Definition

```typescript
interface TAnnotationArgument {
  name: string
  type: 'string' | 'number' | 'boolean'
  optional?: boolean
  description?: string
  values?: string[]  // Allowed values (shown in IntelliSense, validated at parse time)
}
```

The `argument` field can be a single object or an **array** for multi-argument annotations.

### Merge Strategy Behavior

- **`replace`** (default): During inheritance, the child's annotation value overwrites the parent's.
- **`append`**: Values accumulate across the inheritance chain into an array.

### nodeType Restrictions

- `'interface'` — annotation can only be placed on interface declarations
- `'type'` — annotation can only be placed on type declarations
- `'prop'` — annotation can only be placed on properties
- Omitting `nodeType` allows the annotation on any node.

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
      endpoint: new AnnotationSpec({
        description: 'Define an API endpoint',
        nodeType: ['interface'],
        argument: [
          { name: 'method', type: 'string', values: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
          { name: 'path', type: 'string', description: 'URL path pattern' },
        ],
      }),
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
@api.endpoint 'GET', '/api/users'
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
- **Multi-argument**: `@api.endpoint 'GET', '/api/users'`
- **With error messages**: `@expect.minLength 3, 'Too short'`

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

### Return Value Types

- **Single-value annotations** return the scalar value directly (`string`, `number`, or `boolean`)
- **Annotations with `multiple: true` and `mergeStrategy: 'append'`** return an array of values
- **Flag annotations** (no argument) return `true` when present (check with `.has()`)

---

## Inheritance Behavior

Annotations propagate through type inheritance:

1. **Type -> Property**: A property using an annotated type inherits those annotations
2. **Interface inheritance**: Child interfaces inherit parent annotations
3. **Priority** (lowest to highest): Final type annotations -> Referenced property annotations -> Current property annotations

The `mergeStrategy` controls how inherited values combine:

- `replace`: child overwrites parent
- `append`: values accumulate into an array

For repeatable annotations (`multiple: true`) with `replace` strategy, the **entire set** is replaced, not individual values.

---

## Ad-hoc Annotations (Related Feature)

Ad-hoc annotations let you attach metadata to an existing type without modifying its original definition. Two forms:

- **Mutating**: `annotate User { @meta.label 'Name' \n name }` — modifies in-place
- **Non-mutating**: `export annotate User as UserForm { ... }` — creates standalone alias

See the ATScript Basics skill for full details on ad-hoc annotations.

---

## Common Patterns

### Flag Annotations (No Argument)

```js
hidden: new AnnotationSpec({
  description: 'Hide this field in the UI',
  nodeType: ['prop'],
})
```

Usage: `@ui.hidden` — Runtime: `prop.metadata.has('ui.hidden')` returns `true/false`

### Single-Value Annotations

```js
label: new AnnotationSpec({
  description: 'Display label for this field',
  argument: { name: 'text', type: 'string' },
})
```

Usage: `@ui.label 'Full Name'` — Runtime: `prop.metadata.get('ui.label')` returns `'Full Name'`

### Multi-Argument Annotations

```js
endpoint: new AnnotationSpec({
  description: 'Define an API endpoint',
  nodeType: ['interface'],
  argument: [
    { name: 'method', type: 'string', values: ['GET', 'POST', 'PUT', 'DELETE'] },
    { name: 'path', type: 'string' },
  ],
})
```

Usage: `@api.endpoint 'GET', '/api/users'`

### Repeatable Annotations (Accumulate Values)

```js
role: new AnnotationSpec({
  description: 'Required role to access this field',
  multiple: true,
  mergeStrategy: 'append',
  argument: { name: 'role', type: 'string' },
})
```

Usage: `@auth.role 'admin'` + `@auth.role 'editor'` -> `['admin', 'editor']`

### Enumerated Values

```js
rounding: new AnnotationSpec({
  description: 'Rounding strategy',
  argument: {
    name: 'strategy',
    type: 'string',
    values: ['ceil', 'floor', 'round', 'bankers'],
    description: 'The rounding strategy to apply',
  },
})
```

The `values` array provides IntelliSense autocompletion and parse-time validation.

### Optional Argument Annotations

```js
deprecated: new AnnotationSpec({
  description: 'Mark field as deprecated',
  argument: { name: 'message', type: 'string', optional: true },
})
```

Usage: `@api.deprecated` or `@api.deprecated 'Use newField instead'`

---

## Post-Configuration Step

After adding or modifying custom annotations, **regenerate the type declaration file** for IntelliSense:

```bash
npx asc -f dts
```

This updates `atscript.d.ts` so the IDE recognizes the new annotations with full autocompletion and hover documentation.

---

## Workflow for Creating Custom Annotations

1. **Understand the requirement**: What metadata needs to be captured? On what nodes?
2. **Choose a namespace**: Group related annotations under a meaningful namespace (e.g., `ui`, `api`, `db`, `auth`).
3. **Define each annotation** using `AnnotationSpec` with appropriate options.
4. **Add to `atscript.config.js`** under the `annotations` key.
5. **Run `npx asc -f dts`** to regenerate type declarations.
6. **Show usage examples** in `.as` files.
7. **Show runtime access** via the `metadata.get()` API.

---

## Important Notes

1. **ATScript is NOT TypeScript decorators** — No `reflect-metadata` or decorator-based patterns.
2. **Annotations are defined purely in `atscript.config.js`** — No TypeScript code needed.
3. **`argument.type`** must be one of: `'string'`, `'number'`, `'boolean'`.
4. **`argument` can be an array** for multi-argument annotations.
5. **`values`** on arguments provide IntelliSense completion and parse-time validation.
6. **`defType`** restricts annotations to specific underlying types (e.g., string-only fields).
7. **Always run `npx asc -f dts`** after config changes for IntelliSense.
8. **Unknown annotations** cause errors by default. Set `unknownAnnotation: 'allow'` or `'warn'` in config during prototyping.
9. **Namespace naming** — avoid conflicts with built-in namespaces (`meta`, `expect`, `emit`).
