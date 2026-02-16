# ATScript Knowledge Skill

## Overview

ATScript is a universal type and metadata description language designed for multi-language code generation. It extends TypeScript's type system with rich metadata capabilities, runtime type information, validation, and serialization.

**Key Capabilities:**
- Type definitions with runtime metadata
- Annotation-driven validation
- Serialization/deserialization
- JSON Schema generation
- Type-safe validators with TypeScript type guards
- Cross-language code generation

**Official Documentation:** https://atscript.moost.org

---

## .as File Syntax

ATScript files use the `.as` extension and contain type definitions with annotations.

### Basic Interface Definition

```typescript
export interface User {
    id: string.uuid
    email: string.email
    name: string
    age: number.int.positive
}
```

### Interface with Annotations

```typescript
@meta.description 'User entity'
export interface User {
    @meta.id
    @meta.readonly
    id: string.uuid

    @meta.label 'Email Address'
    @meta.placeholder 'user@example.com'
    @expect.pattern "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    email: string.email

    @meta.label 'Full Name'
    @expect.minLength 2
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

### Type Aliases

```typescript
@expect.minLength 3
export type Username = string

export type UserId = string.uuid
```

### Export Statements

```typescript
export interface Product { ... }
export type ProductId = string.uuid
```

---

## Primitives

### Basic Primitives

ATScript supports six fundamental primitive types:

1. `string` - Text values
2. `number` - Numeric values
3. `boolean` - True/false values
4. `null` - Null value
5. `undefined` - Undefined value
6. `void` - No value

### Semantic Type Extensions

Primitives can be extended using dot notation for type refinement and implicit validation.

#### String Extensions

```typescript
string.email       // Email format validation
string.phone       // Phone number format validation
string.date        // Common date formats
string.isoDate     // ISO 8601 date format
string.uuid        // UUID format
```

#### Number Extensions

```typescript
number.int         // Integer values
number.positive    // Values >= 0
number.negative    // Values <= 0
number.single      // Single-precision float
number.double      // Double-precision float
number.timestamp   // Unix timestamp
```

#### Boolean Extensions

```typescript
boolean.true       // Must be true
boolean.false      // Must be false
```

### Combining Extensions

```typescript
age: number.int.positive
price: number.double.positive
```

---

## Annotations

Annotations provide metadata for types, interfaces, and properties.

### Where to Apply Annotations

- Interfaces: `@meta.description 'User entity'`
- Properties: `@meta.label 'Email Address'`
- Type Aliases: `@expect.minLength 3`

### Annotation Syntax

```typescript
@meta.label 'User Name'           // With single argument
@meta.sensitive                   // Flag (no argument)
@expect.pattern "^[A-Z]", "i"     // Multiple arguments
```

### Built-in Meta Annotations (@meta.*)

```typescript
@meta.label 'string'         // Human-readable label
@meta.id                     // Marks identifier field
@meta.description 'string'   // Field description
@meta.placeholder 'string'   // UI placeholder text
@meta.sensitive              // Marks sensitive data (e.g., passwords)
@meta.readonly               // Read-only field
```

### Built-in Validation Annotations (@expect.*)

```typescript
@expect.minLength number     // Minimum string/array length
@expect.maxLength number     // Maximum string/array length
@expect.min number           // Minimum numeric value
@expect.max number           // Maximum numeric value
@expect.int                  // Integer validation
@expect.pattern "regex", "flags"  // Regex matching
```

### Annotation Inheritance

- Annotations can merge from type to property
- Property annotations have highest priority
- Supports different merge strategies (replace or append)

---

## TypeScript Integration

### Importing Generated Types

```typescript
import { Product } from './product.as'
import { User } from './models/user.as'
```

### Accessing Type Metadata Statically

Every generated ATScript interface has static properties:

```typescript
Product.type          // Type structure (TAtscriptTypeDef)
Product.metadata      // Top-level annotations (TMetadataMap)
Product.validator()   // Creates validator instance
Product.optional      // Optional flag (if applicable)
```

### Runtime Type Structure

```typescript
interface TAtscriptAnnotatedType<T = TAtscriptTypeDef, DataType = InferDataType<T>> {
  __is_atscript_annotated_type: true
  type: T                    // Type definition
  metadata: TMetadataMap     // Annotation values
  validator: (opts?) => Validator
  optional?: boolean
}
```

---

## Accessing Metadata

### Accessing Annotation Values

```typescript
import { User } from './user.as'

// Access top-level metadata
const description = User.metadata.get('meta.description')

// Access property metadata
const userType = User.type as TAtscriptObjectType
for (const [propName, propDef] of userType.props) {
  const label = propDef.metadata.get('meta.label')
  const placeholder = propDef.metadata.get('meta.placeholder')
  const isSensitive = propDef.metadata.has('meta.sensitive')

  console.log(`${propName}: ${label}`)
}
```

### Metadata Map API

```typescript
metadata.get(key: string): any        // Get annotation value
metadata.has(key: string): boolean    // Check if annotation exists
metadata.keys(): IterableIterator<string>  // Get all annotation keys
```

---

## Type Walking and Traversal

### Type Kinds

Types are distinguished by their `kind` property:

- `''` (empty string): Primitives and literals
- `'object'`: Named properties
- `'array'`: Element types
- `'union'`: Alternative types
- `'intersection'`: Combined types
- `'tuple'`: Positional types

### Type-Safe Traversal with forAnnotatedType()

```typescript
import { forAnnotatedType } from '@atscript/typescript/utils'

const description = forAnnotatedType(someType, {
  final: (def) => {
    // Handle primitives, literals, references
    return `primitive: ${def.type.designType}`
  },

  object: (def) => {
    // Handle object types
    const props = def.type.props
    return `object with ${props.size} properties`
  },

  array: (def) => {
    // Handle array types
    const elementType = def.type.itemType
    return `array of ${elementType.type.designType}`
  },

  union: (def) => {
    // Handle union types
    return `union of ${def.type.items.length} types`
  },

  intersection: (def) => {
    // Handle intersection types
    return `intersection of ${def.type.items.length} types`
  },

  tuple: (def) => {
    // Handle tuple types
    return `tuple of ${def.type.items.length} items`
  },
})
```

### Walking Object Properties

```typescript
import { User } from './user.as'

const userType = User.type as TAtscriptObjectType

for (const [propName, propDef] of userType.props) {
  console.log(`Property: ${propName}`)
  console.log(`  Type: ${propDef.type.designType}`)
  console.log(`  Optional: ${propDef.optional || false}`)

  // Access annotations
  const label = propDef.metadata.get('meta.label')
  const isId = propDef.metadata.has('meta.id')

  if (label) {
    console.log(`  Label: ${label}`)
  }
}
```

---

## Validation

### Basic Validation

Every generated ATScript type has a `.validator()` method:

```typescript
import { Product } from './product.as'

const validator = Product.validator()
```

### Throwing Mode (Raises Exceptions)

```typescript
try {
  validator.validate(data)
  // data passed validation
  console.log('Valid product:', data)
} catch (error) {
  console.error(error.message)  // First error message
  console.error(error.errors)   // All errors
}
```

### Safe Mode (Returns Boolean)

```typescript
if (validator.validate(data, true)) {
  // TypeScript narrows data to Product type
  console.log(data.name, data.price)
} else {
  console.log('Validation errors:', validator.errors)
}
```

### Type Guard Functionality

The `validate()` method serves as a TypeScript type guard:

```typescript
function handleRequest(body: unknown) {
  if (Product.validator().validate(body, true)) {
    // body is now typed as Product
    saveProduct(body)
  } else {
    throw new Error('Invalid product data')
  }
}
```

### Validator Options

```typescript
const validator = Product.validator({
  partial: true,           // Control required property validation
  unknownProps: 'strip',   // Handle undefined properties: 'strip' | 'allow' | 'error'
  errorLimit: 10,          // Maximum validation errors
  skipList: ['metadata'],  // Skip specific property validations
  replace: {}              // Dynamic type overriding
})
```

### Validation Errors

```typescript
try {
  validator.validate(data)
} catch (e) {
  if (e instanceof ValidatorError) {
    // Access structured error information
    for (const err of e.errors) {
      console.log(`Path: ${err.path}`)
      console.log(`Message: ${err.message}`)
    }
  }
}
```

### Annotation-Driven Validation Rules

Automatic validation from annotations:

```typescript
export interface Product {
  @expect.minLength 3
  @expect.maxLength 100
  name: string

  @expect.min 0
  @expect.max 999999
  price: number

  @expect.int
  @expect.min 0
  stock: number

  @expect.pattern "^[A-Z]{3}-\d{4}$"
  sku: string
}
```

---

## Serialization

### Basic Serialization/Deserialization

```typescript
import {
  serializeAnnotatedType,
  deserializeAnnotatedType
} from '@atscript/typescript/utils'

// Serialize to JSON-safe object
const serialized = serializeAnnotatedType(Product)
const json = JSON.stringify(serialized)

// Deserialize back to live type
const restored = deserializeAnnotatedType(JSON.parse(json))

// Restored type is fully functional
restored.validator().validate(data)
```

### Key Features

1. **Deserialized Types Are Live**
   - Can create validators
   - Work with JSON schema generation
   - Retain metadata accessibility

2. **Versioning**
   - Includes `$v` field for format version
   - Throws error if version is incompatible

3. **Annotation Filtering**
   ```typescript
   const schema = serializeAnnotatedType(User, {
     ignoreAnnotations: ['mongo.collection', 'meta.sensitive']
   })
   ```

### Practical Example: Server-Driven UI

**Server-side:**
```typescript
app.get('/api/form/user', (req, res) => {
  const schema = serializeAnnotatedType(User, {
    ignoreAnnotations: ['mongo.collection']
  })
  res.json(schema)
})
```

**Client-side:**
```typescript
onMounted(async () => {
  const res = await fetch('/api/form/user')
  const type = deserializeAnnotatedType(await res.json())

  // Dynamically build form from type metadata
  for (const [name, prop] of type.type.props) {
    fields.value.push({
      name,
      label: prop.metadata.get('meta.label') || name,
      placeholder: prop.metadata.get('meta.placeholder') || '',
      required: !prop.optional
    })
  }
})
```

---

## Common Patterns

### Dynamic Form Generation

```typescript
import { User } from './user.as'

function generateFormFields(type: TAtscriptAnnotatedType) {
  const fields = []
  const objectType = type.type as TAtscriptObjectType

  for (const [name, prop] of objectType.props) {
    fields.push({
      name,
      label: prop.metadata.get('meta.label') || name,
      placeholder: prop.metadata.get('meta.placeholder'),
      required: !prop.optional,
      readonly: prop.metadata.has('meta.readonly'),
      sensitive: prop.metadata.has('meta.sensitive'),
      type: inferInputType(prop)
    })
  }

  return fields
}

const userFields = generateFormFields(User)
```

### Validation with Error Handling

```typescript
function validateAndSave<T>(
  type: TAtscriptAnnotatedType<any, T>,
  data: unknown
): T {
  const validator = type.validator()

  if (!validator.validate(data, true)) {
    const errors = validator.errors.map(e => ({
      field: e.path,
      message: e.message
    }))
    throw new ValidationError('Invalid data', errors)
  }

  return data  // TypeScript knows data is type T
}
```

### Type-Safe API Responses

```typescript
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  const data = await response.json()

  // Validate response matches User schema
  if (User.validator().validate(data, true)) {
    return data  // TypeScript knows this is User
  }

  throw new Error('Invalid user data from API')
}
```

### Metadata-Driven Documentation

```typescript
function generateDocs(type: TAtscriptAnnotatedType) {
  const docs = []
  const description = type.metadata.get('meta.description')

  if (description) {
    docs.push(`# ${description}`)
  }

  const objectType = type.type as TAtscriptObjectType
  for (const [name, prop] of objectType.props) {
    const label = prop.metadata.get('meta.label')
    const desc = prop.metadata.get('meta.description')
    const isId = prop.metadata.has('meta.id')

    docs.push(`## ${label || name}${isId ? ' (ID)' : ''}`)
    if (desc) docs.push(desc)
  }

  return docs.join('\n\n')
}
```

---

## Best Practices

### 1. Use Semantic Types

```typescript
// Good: Semantic types provide validation
email: string.email
age: number.int.positive

// Avoid: Missing validation context
email: string
age: number
```

### 2. Leverage Annotations for UI Metadata

```typescript
export interface User {
  @meta.label 'Email Address'
  @meta.placeholder 'user@example.com'
  email: string.email
}
```

### 3. Combine Validators with Type Guards

```typescript
function processUser(data: unknown) {
  if (User.validator().validate(data, true)) {
    // TypeScript knows data is User type
    return saveUser(data)
  }
  throw new Error('Invalid user')
}
```

### 4. Use Serialization for Type Transfer

```typescript
// Share types between backend and frontend
const serialized = serializeAnnotatedType(User, {
  ignoreAnnotations: ['mongo.collection', 'internal.*']
})
```

### 5. Walk Types Safely with forAnnotatedType

```typescript
// Type-safe handling of different type structures
const result = forAnnotatedType(myType, {
  object: (def) => handleObject(def),
  array: (def) => handleArray(def),
  final: (def) => handlePrimitive(def)
})
```

### 6. Document with Annotations

```typescript
@meta.description 'User account information'
export interface User {
  @meta.description 'Unique identifier for the user'
  @meta.id
  id: string.uuid
}
```

---

## Package Information

### Core Packages

- `@atscript/typescript` - TypeScript integration and runtime
- `@atscript/validator` - Validation package
- `@atscript/typescript/utils` - Utility functions for serialization, traversal, etc.

### Import Patterns

```typescript
// Import generated types
import { User, Product } from './models.as'

// Import utilities
import {
  serializeAnnotatedType,
  deserializeAnnotatedType,
  forAnnotatedType,
  defineAnnotatedType
} from '@atscript/typescript/utils'

// Import error types
import { ValidatorError } from '@atscript/validator'
```

---

## Additional Resources

- **Documentation:** https://atscript.moost.org
- **TypeScript Package:** https://atscript.moost.org/packages/typescript
- **Validation Guide:** https://atscript.moost.org/packages/typescript/validation
- **Serialization Guide:** https://atscript.moost.org/packages/typescript/serialization

---

## Quick Reference

### Create a Type
```typescript
export interface MyType {
  @meta.label 'Field Name'
  field: string
}
```

### Validate Data
```typescript
if (MyType.validator().validate(data, true)) {
  // data is valid
}
```

### Access Metadata
```typescript
const label = MyType.type.props.get('field').metadata.get('meta.label')
```

### Serialize/Deserialize
```typescript
const json = JSON.stringify(serializeAnnotatedType(MyType))
const restored = deserializeAnnotatedType(JSON.parse(json))
```

### Walk Type Structure
```typescript
forAnnotatedType(MyType, {
  object: (def) => console.log('Object type'),
  final: (def) => console.log('Primitive type')
})
```
