# ATScript Custom Primitives Skill

## Overview

This skill covers how to create custom primitives for ATScript. ATScript primitives are semantic type extensions that add domain-specific meaning to base types using dot-notation syntax (e.g., `string.email`, `number.percentage`, `string.uuid`).

**Important:** ATScript is a separate language with `.as` files — it is NOT TypeScript. Custom primitives are defined in `atscript.config.js` under the `primitives` configuration key.

---

## What ATScript Primitives Are

ATScript primitives are semantic type extensions that carry implicit validation constraints — no `@expect.*` annotations needed at the field level.

### Built-in Primitives

- **String**: `string.email`, `string.uuid`, `string.phone`, `string.date`, `string.isoDate`, `string.required`
- **Number**: `number.int`, `number.positive`, `number.negative`, `number.single`, `number.double`, `number.timestamp`
- **Boolean**: `boolean.true`, `boolean.false`, `boolean.required`
- **Phantom**: `phantom` — non-data elements for UI (excluded from types, validation, schema)

### Custom Primitives

Custom primitives extend built-in ones or define entirely new namespaces (including phantom). Defined in `atscript.config.js`.

---

## Extension Object Fields

| Field           | Type                                             | Required | Description                                                                |
| --------------- | ------------------------------------------------ | -------- | -------------------------------------------------------------------------- |
| `type`          | `'string' \| 'number' \| 'boolean' \| 'phantom'` | No       | Base type. **Inherited from parent** if omitted.                           |
| `documentation` | `string`                                         | No       | IntelliSense hover text. **Inherited from parent** if omitted.             |
| `expect`        | `object`                                         | No       | Implicit validation constraints. **Merged with parent's** `expect`.        |
| `extensions`    | `Record<string, ...>`                            | No       | Nested sub-extensions (e.g., `number.int.positive`).                       |
| `isContainer`   | `boolean`                                        | No       | If `true`, cannot be used directly — one of its extensions must be chosen. |

**Key:** Extensions automatically inherit `type`, `documentation`, `expect`, and `tags` from their parent primitive. You only need to specify fields you want to override or add.

---

## Configuration Structure

```js
// atscript.config.js
import { defineConfig } from '@atscript/core'
import ts from '@atscript/typescript'

export default defineConfig({
  rootDir: 'src',
  plugins: [ts()],
  primitives: {
    // Extend existing base types
    string: {
      extensions: {
        url: {
          type: 'string',
          documentation: 'A valid URL (http or https)',
          expect: {
            pattern: ['^https?://.+$', '', 'Invalid URL format'],
          },
        },
      },
    },
    number: {
      extensions: {
        percentage: {
          type: 'number',
          documentation: 'Percentage value (0-100)',
          expect: { min: 0, max: 100 },
        },
      },
    },
    // Define new phantom namespaces
    ui: {
      type: 'phantom',
      isContainer: true,
      documentation: 'Non-data UI elements',
      extensions: {
        action: { documentation: 'An action element (button, link)' },
        divider: { documentation: 'A visual divider' },
        paragraph: { documentation: 'Informational text block' },
      },
    },
  },
})
```

---

## Available `expect` Constraint Keys

| Key         | Applies To        | Description                                 |
| ----------- | ----------------- | ------------------------------------------- |
| `pattern`   | `string`          | Array: `[regexString, flags, errorMessage]` |
| `min`       | `number`          | Minimum numeric value                       |
| `max`       | `number`          | Maximum numeric value                       |
| `minLength` | `string`, `array` | Minimum length                              |
| `maxLength` | `string`, `array` | Maximum length                              |
| `int`       | `number`          | Must be an integer (flag, use `true`)       |

**Note:** In plugin code, `pattern` can use actual `RegExp` objects. In `atscript.config.js`, use `[regexString, flags, errorMessage]` arrays.

---

## Inheritance and Nesting

Extensions inherit everything from their parent. You only specify overrides:

```js
primitives: {
  number: {
    type: 'number',
    extensions: {
      int: {
        documentation: 'Integer number',
        expect: { int: true },
        extensions: {
          positive: {
            documentation: 'Positive integer',
            expect: { min: 0 },
            // Inherits type: 'number' and expect.int: true from parent
          },
          negative: {
            documentation: 'Negative integer',
            expect: { max: 0 },
          },
        },
      },
    },
  },
}
```

This creates: `number.int`, `number.int.positive`, `number.int.negative`. Each child automatically inherits `type`, parent `expect` constraints, and `tags`.

---

## Custom Phantom Namespaces

Create families of non-data UI elements with `type: 'phantom'`:

```js
primitives: {
  foorm: {
    type: 'phantom',
    isContainer: true,  // Cannot use 'foorm' directly
    documentation: 'Form-specific UI elements',
    extensions: {
      action: {
        documentation: 'An action element (button, link)',
        // type: 'phantom' inherited from parent
      },
      paragraph: {
        documentation: 'A block of informational text',
      },
      select: {
        type: 'string',  // Override: this IS a data type
        documentation: 'A select dropdown field',
      },
    },
  },
}
```

**Key points:**

- `isContainer: true` prevents using `foorm` directly; the compiler requires `foorm.action`, `foorm.paragraph`, etc.
- Extensions inherit `type: 'phantom'` from parent — no need to repeat on each one
- Individual extensions can **override** back to a data type (e.g., `type: 'string'` for `foorm.select`)

**Phantom behavior:**

- Excluded from generated TypeScript class
- Skipped by validation
- Excluded from JSON Schema and serialization
- Present in `type.props` Map with `designType: 'phantom'` at runtime
- Carry distinct tags your renderer can use

Usage in `.as` files:

```atscript
export interface CheckoutForm {
    @meta.label 'Email'
    email: string.email

    @meta.label 'Shipping Address'
    @foorm.component 'section-header'
    shippingHeader: foorm.paragraph

    @meta.label 'Street'
    street: string

    @meta.label 'Apply coupon'
    @foorm.component 'button'
    applyCoupon: foorm.action
}
```

---

## Complete Configuration Example

```js
import { defineConfig } from '@atscript/core'
import ts from '@atscript/typescript'

export default defineConfig({
  rootDir: 'src',
  plugins: [ts()],
  primitives: {
    string: {
      extensions: {
        url: {
          type: 'string',
          documentation: 'A valid URL (http or https)',
          expect: {
            pattern: ['^https?://.+$', '', 'Invalid URL format'],
          },
        },
        slug: {
          type: 'string',
          documentation: 'URL-safe slug (lowercase alphanumeric and hyphens)',
          expect: {
            pattern: ['^[a-z0-9-]+$', '', 'Invalid slug format'],
          },
        },
        phone: {
          type: 'string',
          documentation: 'International phone number format',
          expect: {
            pattern: ['^\\+[1-9]\\d{1,14}$', '', 'Invalid phone number (E.164 format)'],
          },
        },
        hex: {
          type: 'string',
          documentation: 'Hexadecimal color code',
          expect: {
            pattern: ['^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$', '', 'Invalid hex color'],
          },
        },
        ipv4: {
          type: 'string',
          documentation: 'IPv4 address',
          expect: {
            pattern: [
              '^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$',
              '',
              'Invalid IPv4 address',
            ],
          },
        },
      },
    },
    number: {
      extensions: {
        percentage: {
          type: 'number',
          documentation: 'Percentage value (0-100)',
          expect: { min: 0, max: 100 },
        },
        port: {
          type: 'number',
          documentation: 'Network port number (1-65535)',
          expect: { int: true, min: 1, max: 65535 },
        },
        rating: {
          type: 'number',
          documentation: 'Rating value (1-5)',
          expect: { min: 1, max: 5 },
        },
      },
    },
  },
})
```

---

## Usage in .as Files

```atscript
export interface ServerConfig {
    host: string.ipv4
    port: number.port
    baseUrl: string.url
}

export interface Product {
    slug: string.slug
    rating: number.rating
    discount: number.percentage
    supportPhone: string.phone
    brandColor: string.hex
}
```

Validation constraints are enforced **automatically** — no `@expect.*` annotations needed.

---

## Combining with Annotations

Primitives and annotations work together. Explicit annotations are **additive**:

```atscript
export interface Page {
    @meta.label 'Page URL'
    @meta.placeholder 'https://example.com'
    url: string.url

    @expect.minLength 3
    @expect.maxLength 50
    slug: string.slug
}
```

---

## Runtime Behavior

### Validation

Custom primitives automatically inject their `expect` constraints into the validator:

```typescript
import { ServerConfig } from './server-config.as'

const validator = ServerConfig.validator()

// Port out of range -> ValidatorError
validator.validate({ host: '10.0.0.1', port: 99999, baseUrl: 'https://example.com' })

// Invalid URL -> ValidatorError
validator.validate({ host: '10.0.0.1', port: 8080, baseUrl: 'not-a-url' })
```

### Type Tags

Each primitive extension adds a tag to the type's `tags` set:

```typescript
const hostProp = ServerConfig.type.props.get('host')
hostProp?.type.tags // Set containing 'ipv4', 'string'

if (hostProp?.type.tags?.has('ipv4')) {
  console.log('This is an IPv4 address field')
}
```

---

## Post-Configuration Step

After adding or modifying custom primitives, regenerate the type declaration file:

```bash
npx asc -f dts
```

---

## Workflow for Creating Custom Primitives

1. **Identify the need**: What semantic type? What base type (`string`, `number`, `boolean`, `phantom`)?
2. **Define validation constraints**: Express rules using `expect` keys.
3. **Consider inheritance**: Use nested `extensions` for hierarchical types (e.g., `number.int.positive`).
4. **Consider containers**: Use `isContainer: true` for namespace-only types that require an extension.
5. **Write clear documentation**: The `documentation` string appears in IntelliSense.
6. **Add to `atscript.config.js`** under the `primitives` key.
7. **Run `npx asc -f dts`** to regenerate type declarations.

---

## Common Patterns

### String Format Validation (Regex-Based)

```js
myFormat: {
  type: 'string',
  documentation: 'Description of the format',
  expect: {
    pattern: ['^regex-here$', 'flags', 'Error message'],
  },
}
```

### Numeric Range Constraints

```js
myRange: {
  type: 'number',
  documentation: 'Description of the range',
  expect: { min: 0, max: 100 },
}
```

### Integer-Only Numeric Types

```js
myInt: {
  type: 'number',
  documentation: 'Description',
  expect: { int: true, min: 0 },
}
```

### Nested Extensions (Hierarchical Types)

```js
currency: {
  type: 'number',
  isContainer: true,
  documentation: 'Currency amount',
  expect: { min: 0 },
  extensions: {
    usd: { documentation: 'US Dollar amount' },
    eur: { documentation: 'Euro amount' },
  },
}
```

Creates `currency.usd` and `currency.eur`, both inheriting `type: 'number'` and `expect.min: 0`.

### Phantom UI Elements

```js
myNs: {
  type: 'phantom',
  isContainer: true,
  documentation: 'UI-only elements',
  extensions: {
    button: { documentation: 'A button element' },
    divider: { documentation: 'A visual separator' },
  },
}
```

---

## Important Notes

1. **ATScript is NOT TypeScript** — No class-based patterns or `createPrimitive` calls.
2. **Inheritance is automatic** — Extensions inherit `type`, `documentation`, `expect`, `tags` from parent.
3. **`isContainer: true`** prevents direct use — requires choosing an extension.
4. **Phantom types** are excluded from TypeScript class, validation, JSON Schema, and serialization.
5. **`expect` constraints merge** — child `expect` values add to parent's, not replace.
6. **`pattern` constraint** is an array: `[regexString, flags, errorMessage]` in config (or `RegExp` in plugins).
7. **Always run `npx asc -f dts`** after config changes for IntelliSense.
8. **Combining primitives**: Chain extensions like `number.int.positive` — each adds its constraints and tags.
