# ATScript Knowledge Skill

## Overview

ATScript is a universal type and metadata description language designed for multi-language code generation. It extends TypeScript's type system with rich metadata capabilities, runtime type information, validation, serialization, and JSON Schema generation.

**Key Capabilities:**

- Type definitions with runtime metadata
- Annotation-driven validation
- Serialization/deserialization
- JSON Schema generation (including round-trip with `fromJsonSchema`)
- Type-safe validators with TypeScript type guards
- Ad-hoc annotations (mutating and non-mutating)
- Phantom types for non-data UI elements
- Cross-language code generation via plugin system

**Official Documentation:** https://atscript.moost.org

---

## .as File Syntax

ATScript files use the `.as` extension and contain type definitions with annotations.

### Basic Interface Definition

```atscript
export interface User {
    id: string.uuid
    email: string.email
    name: string
    age: number.int.positive
}
```

### Interface with Annotations

```atscript
@meta.description 'User entity'
export interface User {
    @meta.id
    @meta.readonly
    id: string.uuid

    @meta.label 'Email Address'
    @meta.placeholder 'user@example.com'
    email: string.email

    @meta.label 'Full Name'
    @expect.minLength 2, 'Name must be at least 2 characters'
    @expect.maxLength 100
    name: string

    @meta.label 'Age'
    @expect.min 0
    @expect.max 150
    age: number.int.positive

    @meta.sensitive
    password: string
}
```

### Nested Objects and Optional Properties

```atscript
@mongo.collection 'users'
export interface User {
    id: string
    profile: {
        name: string
        avatar?: string  // Optional
    }
    settings: {
        theme: 'light' | 'dark'
    }
}
```

### Wildcard and Pattern Properties

```atscript
export interface Config {
    name: string
    bio?: string
    [*]: string                     // Wildcard - any string props
    [/^x-.*/]: string              // Pattern - props starting with x-
    [/^social_.*/]: string         // social_twitter, social_github, etc.
}
```

### Type Aliases

```atscript
@expect.minLength 3
@expect.maxLength 20
export type Username = string

export type Status = 'pending' | 'success' | 'error'
export type ID = string | number
```

### Arrays, Tuples, and Complex Types

```atscript
export interface Data {
    tags: string[]                      // Array
    matrix: number[][]                  // 2D array
    tuple: [string, number]             // Tuple
    coords: [number, number, number]    // 3-tuple
}
```

### Intersection Types

```atscript
interface Timestamped {
    createdAt: string
}

interface Post {
    title: string
} & Timestamped  // Has both title and createdAt
```

### Self-References and Type References

```atscript
import { Address } from './address'

export interface User {
    address: Address
    friends: User[]          // Self-reference
    manager?: User          // Optional reference
}
```

### Export and Import Rules

```atscript
// Only named exports - NO default exports
export interface User { ... }
export type UserID = string

// Only named imports - NO namespace/rename syntax
import { User, UserID } from './user'  // omit .as extension

// TypeScript files MUST include .as extension
// import { User } from './user.as'
```

---

## Primitives

### Basic Primitive Types

- `string` - Text values
- `number` - Numeric values
- `boolean` - True/false values
- `null` - Null value
- `undefined` - Undefined value
- `void` - No value

### Semantic Type Extensions

Primitives use dot notation for type refinement and implicit validation.

#### String Extensions

| Extension         | Description             | Validation Pattern                       |
| ----------------- | ----------------------- | ---------------------------------------- |
| `string.email`    | Email format            | `^[^\s@]+@[^\s@]+\.[^\s@]+$`             |
| `string.phone`    | Phone number format     | `^\+?[0-9\s-]{10,15}$`                   |
| `string.date`     | Common date formats     | YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY, etc. |
| `string.isoDate`  | ISO 8601 date with time | `2024-01-15T10:30:00Z`                   |
| `string.uuid`     | UUID format             | `^[0-9a-f]{8}-...-[0-9a-f]{12}$`         |
| `string.required` | Non-blank string        | Implicitly adds `@meta.required`         |

#### Number Extensions

| Extension          | Description              | Implicit constraint |
| ------------------ | ------------------------ | ------------------- |
| `number.int`       | Integer values           | `@expect.int`       |
| `number.positive`  | Values >= 0              | `@expect.min 0`     |
| `number.negative`  | Values <= 0              | `@expect.max 0`     |
| `number.single`    | Single-precision float   | —                   |
| `number.double`    | Double-precision float   | —                   |
| `number.timestamp` | Unix timestamp (integer) | `@expect.int`       |

#### Combining Extensions

```atscript
age: number.int.positive       // Positive integers only
price: number.double.positive  // Positive double-precision
score: number.int.negative     // Negative integers
```

#### Boolean Extensions

```atscript
alwaysOn: boolean.true       // Must be true
disabled: boolean.false      // Must be false
agreeToTerms: boolean.required  // Must be true (implicitly adds @meta.required)
```

### Phantom Type

The `phantom` primitive is for non-data elements that are discoverable via runtime type traversal but invisible to the data type, validation, and schema. Useful for UI forms where paragraphs, buttons, or links appear between fields.

```atscript
export interface LoginForm {
    @meta.label 'Email'
    email: string.email

    @meta.label 'Password'
    password: string

    @meta.label 'Forgot password?'
    @component 'link'
    @href '/reset-password'
    forgotPassword: phantom

    @meta.label "Don't have an account? Sign up"
    @component 'link'
    @href '/signup'
    signUp: phantom
}
```

**Behavior:**

- **TypeScript type** - phantom props are emitted as comments; absent from generated class
- **Runtime** - present in `type.props` Map with `designType: 'phantom'`
- **Validation** - skipped entirely
- **JSON Schema / Serialization** - excluded
- **MongoDB** - ignored during index and schema traversal

### Custom Phantom Namespaces

You can define entirely new primitive namespaces with `type: 'phantom'` to create families of non-data UI elements:

```javascript
// atscript.config.js
primitives: {
  ui: {
    type: 'phantom',
    isContainer: true,  // Cannot use 'ui' directly, must use ui.action etc.
    documentation: 'Non-data UI elements for form rendering',
    extensions: {
      action: { documentation: 'An action element (button, link)' },
      divider: { documentation: 'A visual divider between form sections' },
      paragraph: { documentation: 'A block of informational text' },
    },
  },
}
```

Extensions inherit `type` from their parent, so all `ui.*` subtypes are automatically phantom.

---

## Annotations

### Where to Apply

Annotations can be applied on interfaces, properties, or types:

```atscript
@meta.description 'User entity'    // Interface annotation
export interface User {
    @meta.id                       // Property annotation
    id: string
}

@expect.minLength 3                // Type annotation
export type Username = string
```

### Annotation Syntax

```atscript
@meta.label 'User Name'           // With single argument
@meta.sensitive                   // Flag (no argument)
@expect.pattern "^[A-Z]", "i"     // Multiple arguments
@expect.minLength 5, 'Too short'  // With custom error message
@meta.documentation 'Line 1'      // Repeatable
@meta.documentation 'Line 2'
```

### Core Annotations

#### Meta Annotations (`@meta.*`)

| Annotation                      | Description                                                                |
| ------------------------------- | -------------------------------------------------------------------------- |
| `@meta.label 'text'`            | Human-readable label                                                       |
| `@meta.id` or `@meta.id 'name'` | Marks identifier field                                                     |
| `@meta.isKey`                   | Key field in arrays for lookups                                            |
| `@meta.description 'text'`      | Field description                                                          |
| `@meta.documentation 'text'`    | Multi-line docs (repeatable)                                               |
| `@meta.placeholder 'text'`      | UI placeholder text                                                        |
| `@meta.sensitive`               | Marks sensitive data (e.g., passwords)                                     |
| `@meta.readonly`                | Read-only field                                                            |
| `@meta.required 'msg'`          | Required: non-blank string or `true` boolean. Assignable to boolean props. |

#### Validation Annotations (`@expect.*`)

| Annotation                                | Applies To    | Description                      |
| ----------------------------------------- | ------------- | -------------------------------- |
| `@expect.minLength 5, 'msg'`              | string, array | Minimum length                   |
| `@expect.maxLength 100, 'msg'`            | string, array | Maximum length                   |
| `@expect.min 0, 'msg'`                    | number        | Minimum value                    |
| `@expect.max 100, 'msg'`                  | number        | Maximum value                    |
| `@expect.int`                             | number        | Must be integer                  |
| `@expect.pattern 'regex', 'flags', 'msg'` | string        | Regex match (repeatable, append) |

All `@expect.*` annotations except `@expect.int` accept an optional custom error message as the last argument.

### Annotation Inheritance

- **Type -> Property**: A property using an annotated type inherits those annotations. Property annotations take priority.
- **Property references**: Merge order (lowest to highest): Final type -> Referenced property -> Current property.

### Merge Strategies

- **`replace`** (default): higher-priority annotation replaces lower-priority entirely.
- **`append`**: values accumulate into an array (e.g., `@expect.pattern` uses append).

For repeatable annotations (`multiple: true`):

- **replace**: higher-priority set replaces the entire array
- **append**: values from both sides concatenate

---

## Ad-hoc Annotations

Ad-hoc annotations let you attach metadata to an existing type without modifying its original definition.

### Mutating (modifies in-place)

```atscript
import { User } from './user'

annotate User {
    @meta.label 'Full Name'
    name
    @meta.label 'Email Address'
    email
}
```

Cannot be exported. Modifies `User`'s metadata in-place.

### Non-mutating (creates alias)

```atscript
import { User } from './user'

export annotate User as UserForm {
    @meta.label 'Full Name'
    name
    @meta.label 'Email Address'
    email
}
```

Creates a standalone `UserForm` with its own class and metadata. `User` remains unchanged.

### Deep Property Chains

```atscript
annotate User {
    @meta.label 'Street Address'
    address.street
    @meta.label 'City'
    address.city
}
```

### Top-level Annotations

```atscript
@meta.description 'User registration form'
annotate User as RegistrationForm {
    @meta.label 'Username'
    name
}
```

### Annotating Primitive Types

```atscript
export type Username = string | number

@meta.label 'User Name'
annotate Username {}

@meta.label 'Form Name'
export annotate Username as FormName {}
```

---

## TypeScript Integration

### Importing Generated Types

```typescript
import { Product } from './product.as'
import { User } from './models/user.as'
```

### Static Properties on Generated Types

```typescript
Product.type // Type structure (TAtscriptTypeDef)
Product.metadata // Top-level annotations (TMetadataMap)
Product.validator() // Creates validator instance
Product.optional // Optional flag (if applicable)
```

### Runtime Type Structure

```typescript
interface TAtscriptAnnotatedType<T = TAtscriptTypeDef, DataType = InferDataType<T>> {
  __is_atscript_annotated_type: true
  type: T // Type definition
  metadata: TMetadataMap // Annotation values
  validator: (opts?) => Validator
  optional?: boolean
}
```

---

## Accessing Metadata

```typescript
import { User } from './user.as'

// Top-level metadata
const description = User.metadata.get('meta.description')

// Property metadata
const userType = User.type as TAtscriptObjectType
for (const [propName, propDef] of userType.props) {
  const label = propDef.metadata.get('meta.label')
  const placeholder = propDef.metadata.get('meta.placeholder')
  const isSensitive = propDef.metadata.has('meta.sensitive')
}
```

### Metadata Map API

```typescript
metadata.get(key: string): any        // Get annotation value
metadata.has(key: string): boolean    // Check if annotation exists
metadata.keys(): IterableIterator<string>  // Get all keys
```

---

## Type Walking and Traversal

### Type Kinds

| Kind             | Interface              | Description                                 |
| ---------------- | ---------------------- | ------------------------------------------- |
| `''`             | `TAtscriptTypeFinal`   | Primitives/literals (`designType`, `value`) |
| `'object'`       | `TAtscriptTypeObject`  | Named `props` Map, `propsPatterns`          |
| `'array'`        | `TAtscriptTypeArray`   | Element type in `of`                        |
| `'union'`        | `TAtscriptTypeComplex` | Alternatives in `items`                     |
| `'intersection'` | `TAtscriptTypeComplex` | Combined types in `items`                   |
| `'tuple'`        | `TAtscriptTypeComplex` | Positional types in `items`                 |

Each type also carries a `tags` set with semantic labels like `'email'`, `'uuid'`, `'positive'`.

### forAnnotatedType() — Type-Safe Dispatch

```typescript
import { forAnnotatedType } from '@atscript/typescript/utils'

const description = forAnnotatedType(someType, {
  final: d => `primitive: ${d.type.designType}`,
  object: d => `object with ${d.type.props.size} props`,
  array: d => `array`,
  union: d => `union of ${d.type.items.length}`,
  intersection: d => `intersection of ${d.type.items.length}`,
  tuple: d => `tuple of ${d.type.items.length}`,
  phantom: d => `phantom element`, // optional handler
})
```

The optional `phantom` handler intercepts phantom types before `final`. If omitted, phantoms fall through to `final`.

### flattenAnnotatedType() — Flat Map of All Paths

```typescript
import { flattenAnnotatedType } from '@atscript/typescript/utils'

const flatMap = flattenAnnotatedType(Product)
// Map { '' -> root, 'name' -> string, 'address.street' -> string, 'tags' -> array, ... }
```

Options: `onField`, `topLevelArrayTag`, `excludePhantomTypes`.

### defineAnnotatedType() — Build Types at Runtime

```typescript
import { defineAnnotatedType } from '@atscript/typescript/utils'

const userType = defineAnnotatedType('object')
  .prop('name', defineAnnotatedType().designType('string').$type)
  .prop('age', defineAnnotatedType().designType('number').$type)
  .annotate('meta.label', 'User').$type

userType.validator().validate({ name: 'Alice', age: 30 })
```

### Type Guards

- `isAnnotatedType(value)` — checks if a value is a `TAtscriptAnnotatedType`
- `isAnnotatedTypeOfPrimitive(type)` — checks if type resolves to a primitive shape
- `isPhantomType(def)` — checks if `kind === ''` and `designType === 'phantom'`

---

## Validation

### Basic Validation

```typescript
import { Product } from './product.as'
const validator = Product.validator()
```

### Throwing Mode

```typescript
try {
  validator.validate(data)
} catch (error) {
  console.error(error.message) // First error message
  console.error(error.errors) // All errors: { path, message, details? }[]
}
```

### Safe Mode (Type Guard)

```typescript
if (validator.validate(data, true)) {
  // TypeScript narrows data to Product type
  console.log(data.name, data.price)
} else {
  console.log('Errors:', validator.errors)
}
```

### Validator Options

```typescript
const validator = Product.validator({
  partial: true, // true | 'deep' | (type, path) => boolean
  unknownProps: 'strip', // 'error' (default) | 'ignore' | 'strip'
  errorLimit: 10,
  skipList: new Set(['metadata', 'audit.createdBy']),
  replace: (type, path) => (path === 'status' ? customStatusType : type),
})
```

| Option         | Values                                            | Description                          |
| -------------- | ------------------------------------------------- | ------------------------------------ |
| `partial`      | `false`, `true`, `'deep'`, `(type, path) => bool` | Control required property validation |
| `unknownProps` | `'error'`, `'ignore'`, `'strip'`                  | Handle undefined properties          |
| `errorLimit`   | `number`                                          | Max validation errors (default: 10)  |
| `skipList`     | `Set<string>`                                     | Property paths to skip               |
| `replace`      | `(type, path) => type`                            | Dynamic type overriding              |

### Validator Plugins

Plugins intercept validation, returning `true` (accept), `false` (reject), or `undefined` (fall through):

```typescript
import type { TValidatorPlugin } from '@atscript/typescript/utils'

const requireNonEmpty: TValidatorPlugin = (ctx, def, value) => {
  if (def.type.kind === '' && def.type.designType === 'string') {
    if (typeof value === 'string' && value.trim() === '') {
      ctx.error('String must not be empty')
      return false
    }
  }
  return undefined
}

const validator = Product.validator({ plugins: [requireNonEmpty] })
```

### External Context

```typescript
validator.validate(data, true, { role: 'admin' })

// Plugin accesses context via ctx.context
const roleAware: TValidatorPlugin = (ctx, def, value) => {
  if ((ctx.context as any)?.role === 'admin') return true
  return undefined
}
```

### Error Handling

```typescript
import { ValidatorError } from '@atscript/typescript/utils'

try {
  validator.validate(data)
} catch (e) {
  if (e instanceof ValidatorError) {
    for (const err of e.errors) {
      console.log(err.path) // e.g. "address.city"
      console.log(err.message)
      console.log(err.details) // Nested errors for unions
    }
  }
}
```

### Creating Validators Manually

```typescript
import { Validator, deserializeAnnotatedType } from '@atscript/typescript/utils'

const type = deserializeAnnotatedType(jsonData)
const validator = new Validator(type)
validator.validate(someValue)
```

---

## JSON Schema

### Enabling JSON Schema

Control via TypeScript plugin option in configuration:

```javascript
plugins: [ts()] // false (default) - no overhead
plugins: [ts({ jsonSchema: 'lazy' })] // Computed on first call, cached
plugins: [ts({ jsonSchema: 'bundle' })] // Pre-computed at build time
```

### Usage

```typescript
import { Product } from './product.as'
import { buildJsonSchema } from '@atscript/typescript/utils'

// Option 1: from generated type (requires jsonSchema: 'lazy' or 'bundle')
const schema = Product.toJsonSchema()

// Option 2: standalone function (always works regardless of config)
const schema = buildJsonSchema(Product)
```

### Per-Interface Override

```atscript
@emit.jsonSchema
export interface ApiResponse {
    status: string
    message: string
}
```

`@emit.jsonSchema` forces build-time embedding for a specific interface, regardless of global settings.

### Converting FROM JSON Schema

```typescript
import { fromJsonSchema, buildJsonSchema } from '@atscript/typescript/utils'

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 3 },
    age: { type: 'number', minimum: 0 },
  },
  required: ['name', 'age'],
}

const type = fromJsonSchema(schema)
type.validator().validate({ name: 'Alice', age: 30 }) // passes

// Round-trip
const roundTripped = buildJsonSchema(type)
```

`fromJsonSchema` supports: objects, arrays, tuples, unions (`anyOf`/`oneOf`), intersections (`allOf`), primitives, literals (`const`), enums, and constraints. Does NOT support `$ref` (dereference beforehand).

---

## Serialization

### Basic Serialization/Deserialization

```typescript
import { serializeAnnotatedType, deserializeAnnotatedType } from '@atscript/typescript/utils'

const serialized = serializeAnnotatedType(Product)
const json = JSON.stringify(serialized)

const restored = deserializeAnnotatedType(JSON.parse(json))
restored.validator().validate(data) // Fully functional
```

### Annotation Filtering

```typescript
const schema = serializeAnnotatedType(User, {
  ignoreAnnotations: ['mongo.collection', 'meta.sensitive'],
})
```

---

## Configuration

### atscript.config.js

```javascript
import { defineConfig } from '@atscript/core'
import ts from '@atscript/typescript'

export default defineConfig({
  rootDir: 'src',
  format: 'dts', // Default output format: 'dts' | 'js'
  unknownAnnotation: 'error', // 'error' | 'warn' | 'allow'
  plugins: [ts({ jsonSchema: 'lazy' })],
  annotations: {
    /* custom annotations */
  },
  primitives: {
    /* custom primitives */
  },
})
```

### The `atscript.d.ts` File

Generated by `npx asc -f dts`. Declares global `AtscriptMetadata` interface and `AtscriptPrimitiveTags` type for IntelliSense. Add to `tsconfig.json`:

```json
{
  "include": ["src/**/*", "atscript.d.ts"]
}
```

Re-generate after config changes (adding plugins, annotations, primitives).

---

## Package Information

### Core Packages

- `@atscript/core` - Core types, AnnotationSpec, defineConfig, plugin interfaces
- `@atscript/typescript` - TypeScript integration, code generation, runtime
- `@atscript/typescript/utils` - Utilities: serialization, traversal, validators, JSON Schema

### Import Patterns

```typescript
// Generated types
import { User, Product } from './models.as'

// Utilities
import {
  serializeAnnotatedType,
  deserializeAnnotatedType,
  forAnnotatedType,
  flattenAnnotatedType,
  defineAnnotatedType,
  buildJsonSchema,
  fromJsonSchema,
  isAnnotatedType,
  isPhantomType,
  Validator,
  ValidatorError,
} from '@atscript/typescript/utils'

// Config and plugin types
import { defineConfig, AnnotationSpec } from '@atscript/core'
import type { TAtscriptPlugin, TValidatorPlugin } from '@atscript/core'
```

---

## Additional Resources

- **Documentation:** https://atscript.moost.org
- **TypeScript Package:** https://atscript.moost.org/packages/typescript
- **Validation Guide:** https://atscript.moost.org/packages/typescript/validation
- **Serialization Guide:** https://atscript.moost.org/packages/typescript/serialization
- **JSON Schema:** https://atscript.moost.org/packages/typescript/json-schema
- **Ad-hoc Annotations:** https://atscript.moost.org/packages/typescript/ad-hoc-annotations
