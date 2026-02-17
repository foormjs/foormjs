# ATScript Validation

**Official docs:** https://atscript.moost.org/packages/typescript/validation

## Creating a Validator

Every generated ATScript type exposes a `.validator()` method:

```typescript
import { Product } from './product.as'
const validator = Product.validator()
```

---

## Two Validation Modes

### Throwing Mode — raises `ValidatorError` on failure

```typescript
try {
  validator.validate(data)
} catch (error) {
  console.error(error.message) // first error
  console.error(error.errors)  // all errors: { path, message, details? }[]
}
```

### Safe Mode — returns boolean, acts as TypeScript type guard

```typescript
if (validator.validate(data, true)) {
  // TypeScript narrows data to Product type
  console.log(data.name, data.price)
} else {
  console.log(validator.errors)
}
```

The `validate()` signature:

```typescript
validate<TT = DataType>(value: any, safe?: boolean, context?: unknown): value is TT
```

`DataType` is inferred automatically from the type's phantom generic — no manual type parameters needed.

---

## Validator Options

```typescript
const validator = Product.validator({
  partial: true,
  unknwonProps: 'strip',
  errorLimit: 5,
  skipList: new Set(['metadata', 'audit.createdBy']),
  replace: (type, path) => path === 'status' ? customStatusType : type,
  plugins: [myPlugin],
})
```

| Option | Values | Description |
|--------|--------|-------------|
| `partial` | `false` (default), `true`, `'deep'`, or `(type, path) => boolean` | Controls whether missing required properties are errors. `true` = top-level optional, `'deep'` = recursively optional, function = fine-grained per path |
| `unknwonProps` | `'error'` (default), `'ignore'`, `'strip'` | How unknown properties are handled. `'strip'` removes them from the data |
| `errorLimit` | number (default: `10`) | Max errors collected before stopping |
| `skipList` | `Set<string>` | Property paths to skip during validation |
| `replace` | `(type, path) => type` | Dynamically replace type definitions at specific paths |
| `plugins` | `TValidatorPlugin[]` | Custom validation plugins |

---

## Annotation-Driven Validation Rules

Annotations from `.as` files are automatically enforced by the validator:

| Annotation | Applies To | Validates |
|------------|-----------|-----------|
| `@expect.minLength value, 'msg'` | string, array | Minimum length |
| `@expect.maxLength value, 'msg'` | string, array | Maximum length |
| `@expect.min value, 'msg'` | number | Minimum value |
| `@expect.max value, 'msg'` | number | Maximum value |
| `@expect.int` | number | Must be integer |
| `@expect.pattern 'regex', 'flags', 'msg'` | string | Regex match (repeatable, append) |

All `@expect.*` annotations except `@expect.int` accept an optional custom error message as the last argument.

```atscript
export interface User {
    @expect.minLength 3, 'Username must be at least 3 characters'
    username: string

    @expect.min 18, 'Must be at least 18 years old'
    age: number

    @expect.pattern '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', 'u', 'Invalid email format'
    email: string
}
```

### Semantic Primitives Auto-Inject Rules

Semantic types like `string.email`, `number.int.positive`, etc. automatically inject their validation constraints — no `@expect.*` annotations needed:

```atscript
export interface Product {
    price: number.positive        // auto: @expect.min 0
    quantity: number.int.positive // auto: @expect.int + @expect.min 0
    email: string.email           // auto: email regex pattern
}
```

### Phantom Types

Phantom props (`phantom`, `foorm.action`, etc.) are skipped entirely during validation.

---

## Error Handling

`ValidatorError` extends `Error` with structured details:

```typescript
import { ValidatorError } from '@atscript/typescript/utils'

try {
  validator.validate(data)
} catch (e) {
  if (e instanceof ValidatorError) {
    for (const err of e.errors) {
      console.log(err.path)    // e.g. "address.city"
      console.log(err.message) // e.g. "Expected string, got number"
      console.log(err.details) // nested errors for unions
    }
  }
}
```

After safe validation, errors are accessible via `validator.errors` — same `{ path, message, details? }[]` structure.

---

## Validator Plugins

Plugins intercept validation at each node. Return `true` (accept), `false` (reject), or `undefined` (fall through to default):

```typescript
import type { TValidatorPlugin } from '@atscript/typescript/utils'

const requireNonEmpty: TValidatorPlugin = (ctx, def, value) => {
  if (def.type.kind === '' && def.type.designType === 'string') {
    if (typeof value === 'string' && value.trim() === '') {
      ctx.error('String must not be empty')
      return false
    }
  }
  return undefined // fall through to default validation
}

const validator = Product.validator({ plugins: [requireNonEmpty] })
```

### Plugin Context (`TValidatorPluginContext`)

The `ctx` parameter exposes:

| Property | Description |
|----------|-------------|
| `ctx.opts` | Validator options |
| `ctx.path` | Current property path (e.g. `"address.city"`) |
| `ctx.error(msg)` | Report a validation error |
| `ctx.context` | External context passed via `validate()` third arg |
| `ctx.validateAnnotatedType` | Recursively validate a nested annotated type |

### External Context

Pass runtime state to plugins via the third argument of `validate()`:

```typescript
const roleAware: TValidatorPlugin = (ctx, def, value) => {
  if ((ctx.context as any)?.role === 'admin') {
    return true // admin bypasses validation
  }
  return undefined
}

validator.validate(data, true, { role: 'admin' })
```

Context type is `unknown` — plugins must cast and validate internally.

---

## Manual Validator Creation

For types not from `.as` code generation (e.g., deserialized or programmatically built):

```typescript
import { Validator, deserializeAnnotatedType } from '@atscript/typescript/utils'

const type = deserializeAnnotatedType(jsonData)
const validator = new Validator(type)
validator.validate(someValue)
```

Or build types at runtime:

```typescript
import { defineAnnotatedType } from '@atscript/typescript/utils'

const userType = defineAnnotatedType('object')
  .prop('name', defineAnnotatedType().designType('string').$type)
  .prop('age', defineAnnotatedType().designType('number').$type)
  .$type

userType.validator().validate({ name: 'Alice', age: 30 })
```

---

## ATScript vs Other Validation Libraries

See https://atscript.moost.org/packages/typescript/validation-comparison for detailed comparison.

Key advantages over Zod and class-validator:

| Feature | ATScript | Zod | class-validator |
|---------|----------|-----|-----------------|
| Syntax | Type definitions + annotations | Schema DSL / method chains | Decorator stacks on classes |
| Standalone primitives | Yes | Yes | No (wrapper class required) |
| Unions | Native `\|` syntax | `z.union()` | Not supported |
| Intersections | True merge via `&` | No true merge | Single inheritance only |
| Partial validation | `true`, `'deep'`, or function | Top-level only (deep removed in v4) | Manual duplicate DTOs |
| Custom logic | Pluggable at validator level | Per-node `.refine()` | Custom validator class |
| Type guards | `validate(data, true)` narrows | `.parse()` returns typed data | None |
| Beyond validation | Same file carries UI, DB, API metadata | Validation only | Validation only |
