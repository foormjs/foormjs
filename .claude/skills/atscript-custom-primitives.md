# ATScript Custom Primitives Skill

## Overview

This skill covers how to create custom primitives for ATScript. ATScript primitives are semantic type extensions that add domain-specific meaning to base types using dot-notation syntax (e.g., `string.email`, `number.percentage`, `string.uuid`).

**Important:** ATScript is a separate language with `.as` files — it is NOT TypeScript. Custom primitives are defined in `atscript.config.js` under the `primitives` configuration key.

---

## What ATScript Primitives Are

ATScript primitives are semantic type extensions that carry implicit validation constraints — no `@expect.*` annotations needed at the field level.

### Built-in Primitives

- **String primitives:**
  - `string.email` — Email format
  - `string.uuid` — UUID format
  - `string.phone` — Phone number format
  - `string.date` — Common date formats
  - `string.isoDate` — ISO 8601 date format

- **Number primitives:**
  - `number.int` — Integer values
  - `number.positive` — Positive numbers (>= 0)
  - `number.negative` — Negative numbers (<= 0)
  - `number.single` — Single-precision float
  - `number.double` — Double-precision float
  - `number.timestamp` — Unix timestamp

- **Boolean primitives:**
  - `boolean.true` — Must be true
  - `boolean.false` — Must be false

### Custom Primitives

Custom primitives extend the built-in ones with project-specific semantic types defined in `atscript.config.js`.

---

## Configuration Location

Custom primitives are defined under the `primitives` key in `atscript.config.js`, organized by base type.

```js
// atscript.config.js
import { defineConfig } from '@atscript/core'
import ts from '@atscript/typescript'

export default defineConfig({
  rootDir: 'src',
  plugins: [ts()],
  primitives: {
    // Base type → extensions
    baseType: {
      extensions: {
        extensionName: {
          type: 'string' | 'number' | 'boolean',
          documentation: 'Description shown in IntelliSense',
          expect: {
            // Implicit validation constraints (same keys as @expect.* annotations)
          },
        },
      },
    },
  },
})
```

---

## Extension Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'string' \| 'number' \| 'boolean'` | Yes | The base TypeScript type. Must match the parent group key. |
| `documentation` | `string` | Yes | Description shown in IntelliSense hover tooltips. |
| `expect` | `object` | No | Implicit validation constraints — same keys as `@expect.*` annotations. |

---

## Available `expect` Constraint Keys

| Key | Applies To | Description |
|-----|-----------|-------------|
| `pattern` | `string` | Array: `[regexString, flags, errorMessage]` |
| `min` | `number` | Minimum numeric value |
| `max` | `number` | Maximum numeric value |
| `minLength` | `string`, `array` | Minimum length |
| `maxLength` | `string`, `array` | Maximum length |
| `int` | `number` | Must be an integer (flag, use `true`) |

Additional keys follow whatever `@expect.*` annotations are supported in the project.

---

## Complete Configuration Example

```js
// atscript.config.js
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
            pattern: ['^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$', '', 'Invalid IPv4 address'],
          },
        },
        jwt: {
          type: 'string',
          documentation: 'JSON Web Token',
          expect: {
            pattern: ['^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+$', '', 'Invalid JWT format'],
          },
        },
        base64: {
          type: 'string',
          documentation: 'Base64 encoded string',
          expect: {
            pattern: ['^[A-Za-z0-9+/]*={0,2}$', '', 'Invalid Base64 format'],
          },
        },
        semver: {
          type: 'string',
          documentation: 'Semantic version (e.g., 1.2.3)',
          expect: {
            pattern: ['^\\d+\\.\\d+\\.\\d+$', '', 'Invalid semantic version'],
          },
        },
      },
    },
    number: {
      extensions: {
        percentage: {
          type: 'number',
          documentation: 'Percentage value (0-100)',
          expect: {
            min: 0,
            max: 100,
          },
        },
        port: {
          type: 'number',
          documentation: 'Network port number (1-65535)',
          expect: {
            int: true,
            min: 1,
            max: 65535,
          },
        },
        rating: {
          type: 'number',
          documentation: 'Rating value (1-5)',
          expect: {
            min: 1,
            max: 5,
          },
        },
        latitude: {
          type: 'number',
          documentation: 'Latitude coordinate (-90 to 90)',
          expect: {
            min: -90,
            max: 90,
          },
        },
        longitude: {
          type: 'number',
          documentation: 'Longitude coordinate (-180 to 180)',
          expect: {
            min: -180,
            max: 180,
          },
        },
        httpStatus: {
          type: 'number',
          documentation: 'HTTP status code (100-599)',
          expect: {
            int: true,
            min: 100,
            max: 599,
          },
        },
      },
    },
  },
})
```

---

## Usage in .as Files

After defining primitives in config, use them in `.as` files with dot-notation:

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

export interface ApiResponse {
    token: string.jwt
    version: string.semver
    statusCode: number.httpStatus
}

export interface Location {
    latitude: number.latitude
    longitude: number.longitude
}
```

Validation constraints are enforced **automatically** — no `@expect.*` annotations needed. The constraints defined in the primitive config are implicitly applied.

---

## Combining with Annotations

Primitives and annotations work together. You can still add explicit annotations on top of a primitive type:

```atscript
export interface Page {
    @meta.label 'Page URL'
    @meta.placeholder 'https://example.com'
    url: string.url

    @expect.minLength 3
    @expect.maxLength 50
    slug: string.slug

    @meta.label 'Content Rating'
    @meta.description 'User rating from 1 to 5'
    rating: number.rating
}
```

The explicit annotations are **additive** — they combine with the implicit primitive constraints.

---

## Runtime Behavior

### Validation

Custom primitives automatically inject their `expect` constraints into the validator:

```typescript
import { ServerConfig } from './server-config.as'

const validator = ServerConfig.validator()

// This will fail — port out of range
validator.validate({
  host: '10.0.0.1',
  port: 99999,
  baseUrl: 'https://example.com'
})
// ValidatorError: Expected maximum 65535

// This will fail — invalid URL
validator.validate({
  host: '10.0.0.1',
  port: 8080,
  baseUrl: 'not-a-url'
})
// ValidatorError: Invalid URL format

// This will fail — invalid IP address
validator.validate({
  host: '999.999.999.999',
  port: 8080,
  baseUrl: 'https://example.com'
})
// ValidatorError: Invalid IPv4 address

// This will succeed
validator.validate({
  host: '192.168.1.1',
  port: 8080,
  baseUrl: 'https://example.com'
})
```

### Type Tags

Each primitive extension adds a tag to the type's `tags` set. These tags can be used for custom logic:

```typescript
import { ServerConfig } from './server-config.as'

const hostProp = ServerConfig.type.props.get('host')
// hostProp has tag 'ipv4' in its tags set

const portProp = ServerConfig.type.props.get('port')
// portProp has tags 'int' and 'port' in its tags set

// Check for specific tags
if (hostProp?.type.tags?.has('ipv4')) {
  console.log('This is an IPv4 address field')
}
```

---

## Post-Configuration Step

After adding or modifying custom primitives, **regenerate the type declaration file** for IntelliSense:

```bash
npx asc -f dts
```

This updates `atscript.d.ts` so the IDE recognizes the new type tags with full autocompletion and hover documentation.

**Important:** Always run this command after changing `atscript.config.js` primitives.

---

## Workflow for Creating Custom Primitives

### 1. Identify the Need

- What semantic type is needed?
- What base type does it extend (`string`, `number`, `boolean`)?
- What validation rules should apply?

### 2. Define Validation Constraints

Express validation rules using `@expect.*` keys:
- For strings: Use `pattern` for regex validation, `minLength`/`maxLength` for length
- For numbers: Use `min`/`max` for ranges, `int` for integers
- Combine multiple constraints as needed

### 3. Write Clear Documentation

The `documentation` string appears in IntelliSense — make it descriptive and helpful.

### 4. Add to atscript.config.js

Place the primitive definition under the appropriate base type group.

### 5. Run Type Generation

```bash
npx asc -f dts
```

### 6. Use in .as Files

Apply the new primitive type in your interface definitions.

### 7. Verify Validation

Test that the validator enforces the expected constraints.

---

## Common Patterns

### String Format Validation (Regex-Based)

```js
string: {
  extensions: {
    myFormat: {
      type: 'string',
      documentation: 'Description of the format',
      expect: {
        pattern: ['^regex-here$', 'flags', 'Error message'],
      },
    },
  },
},
```

**Examples:**

```js
// Email format
email: {
  type: 'string',
  documentation: 'Email address',
  expect: {
    pattern: ['^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', '', 'Invalid email'],
  },
},

// Username (alphanumeric with underscores)
username: {
  type: 'string',
  documentation: 'Username (letters, numbers, underscores)',
  expect: {
    pattern: ['^[a-zA-Z0-9_]+$', '', 'Invalid username format'],
    minLength: 3,
    maxLength: 20,
  },
},

// Hex color
hexColor: {
  type: 'string',
  documentation: 'Hexadecimal color code (#RGB or #RRGGBB)',
  expect: {
    pattern: ['^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$', '', 'Invalid hex color'],
  },
},
```

---

### Numeric Range Constraints

```js
number: {
  extensions: {
    myRange: {
      type: 'number',
      documentation: 'Description of the range',
      expect: {
        min: 0,
        max: 100,
      },
    },
  },
},
```

**Examples:**

```js
// Age
age: {
  type: 'number',
  documentation: 'Age in years',
  expect: {
    int: true,
    min: 0,
    max: 150,
  },
},

// Temperature (Celsius)
celsius: {
  type: 'number',
  documentation: 'Temperature in Celsius',
  expect: {
    min: -273.15,  // Absolute zero
    max: 1000,
  },
},

// Probability
probability: {
  type: 'number',
  documentation: 'Probability value (0-1)',
  expect: {
    min: 0,
    max: 1,
  },
},
```

---

### Integer-Only Numeric Types

```js
number: {
  extensions: {
    myInt: {
      type: 'number',
      documentation: 'Description',
      expect: {
        int: true,
        min: 0,
      },
    },
  },
},
```

**Examples:**

```js
// Count
count: {
  type: 'number',
  documentation: 'Non-negative integer count',
  expect: {
    int: true,
    min: 0,
  },
},

// Year
year: {
  type: 'number',
  documentation: 'Calendar year',
  expect: {
    int: true,
    min: 1900,
    max: 2100,
  },
},

// ID
id: {
  type: 'number',
  documentation: 'Positive integer ID',
  expect: {
    int: true,
    min: 1,
  },
},
```

---

### String with Length Constraints

```js
string: {
  extensions: {
    shortCode: {
      type: 'string',
      documentation: 'A short alphanumeric code (3-8 chars)',
      expect: {
        minLength: 3,
        maxLength: 8,
        pattern: ['^[A-Z0-9]+$', '', 'Must be uppercase alphanumeric'],
      },
    },
  },
},
```

**Examples:**

```js
// Country code (ISO 3166-1 alpha-2)
countryCode: {
  type: 'string',
  documentation: 'Two-letter country code (ISO 3166-1 alpha-2)',
  expect: {
    minLength: 2,
    maxLength: 2,
    pattern: ['^[A-Z]{2}$', '', 'Must be two uppercase letters'],
  },
},

// Postal code
postalCode: {
  type: 'string',
  documentation: 'Postal/ZIP code',
  expect: {
    minLength: 3,
    maxLength: 10,
  },
},

// API key
apiKey: {
  type: 'string',
  documentation: 'API authentication key',
  expect: {
    minLength: 32,
    maxLength: 64,
    pattern: ['^[A-Za-z0-9]+$', '', 'Invalid API key format'],
  },
},
```

---

## Real-World Examples

### Example 1: E-Commerce System

```js
primitives: {
  string: {
    extensions: {
      sku: {
        type: 'string',
        documentation: 'Stock Keeping Unit (product identifier)',
        expect: {
          pattern: ['^[A-Z]{3}-\\d{4,6}$', '', 'SKU must be 3 letters, dash, 4-6 digits'],
        },
      },
      productSlug: {
        type: 'string',
        documentation: 'URL-friendly product identifier',
        expect: {
          pattern: ['^[a-z0-9-]+$', '', 'Only lowercase letters, numbers, and hyphens'],
          minLength: 3,
          maxLength: 100,
        },
      },
      currencyCode: {
        type: 'string',
        documentation: 'ISO 4217 currency code',
        expect: {
          pattern: ['^[A-Z]{3}$', '', 'Must be 3 uppercase letters'],
        },
      },
    },
  },
  number: {
    extensions: {
      price: {
        type: 'number',
        documentation: 'Product price (positive, up to 2 decimals)',
        expect: {
          min: 0,
        },
      },
      quantity: {
        type: 'number',
        documentation: 'Product quantity (non-negative integer)',
        expect: {
          int: true,
          min: 0,
        },
      },
      discount: {
        type: 'number',
        documentation: 'Discount percentage (0-100)',
        expect: {
          min: 0,
          max: 100,
        },
      },
    },
  },
}
```

**Usage:**

```atscript
export interface Product {
    sku: string.sku
    slug: string.productSlug
    price: number.price
    currency: string.currencyCode
    stock: number.quantity
    discount: number.discount
}
```

---

### Example 2: Geolocation Services

```js
primitives: {
  string: {
    extensions: {
      coordinates: {
        type: 'string',
        documentation: 'Lat,lng coordinate pair',
        expect: {
          pattern: ['^-?\\d+\\.\\d+,-?\\d+\\.\\d+$', '', 'Format: lat,lng'],
        },
      },
      timezone: {
        type: 'string',
        documentation: 'IANA timezone identifier',
        expect: {
          pattern: ['^[A-Za-z_]+/[A-Za-z_]+$', '', 'Format: Region/City'],
        },
      },
    },
  },
  number: {
    extensions: {
      latitude: {
        type: 'number',
        documentation: 'Latitude (-90 to 90)',
        expect: {
          min: -90,
          max: 90,
        },
      },
      longitude: {
        type: 'number',
        documentation: 'Longitude (-180 to 180)',
        expect: {
          min: -180,
          max: 180,
        },
      },
      altitude: {
        type: 'number',
        documentation: 'Altitude in meters',
        expect: {
          min: -500,
          max: 10000,
        },
      },
    },
  },
}
```

**Usage:**

```atscript
export interface Location {
    name: string
    latitude: number.latitude
    longitude: number.longitude
    altitude: number.altitude
    timezone: string.timezone
}
```

---

### Example 3: API & Authentication

```js
primitives: {
  string: {
    extensions: {
      jwt: {
        type: 'string',
        documentation: 'JSON Web Token',
        expect: {
          pattern: ['^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+$', '', 'Invalid JWT'],
        },
      },
      apiKey: {
        type: 'string',
        documentation: 'API authentication key',
        expect: {
          minLength: 32,
          maxLength: 64,
          pattern: ['^[A-Za-z0-9]+$', '', 'Alphanumeric only'],
        },
      },
      oauth2Token: {
        type: 'string',
        documentation: 'OAuth 2.0 access token',
        expect: {
          minLength: 20,
        },
      },
    },
  },
  number: {
    extensions: {
      httpStatus: {
        type: 'number',
        documentation: 'HTTP status code',
        expect: {
          int: true,
          min: 100,
          max: 599,
        },
      },
      unixTimestamp: {
        type: 'number',
        documentation: 'Unix timestamp (seconds since epoch)',
        expect: {
          int: true,
          min: 0,
        },
      },
    },
  },
}
```

**Usage:**

```atscript
export interface ApiRequest {
    token: string.jwt
    apiKey: string.apiKey
}

export interface ApiResponse {
    status: number.httpStatus
    timestamp: number.unixTimestamp
    accessToken: string.oauth2Token
}
```

---

## Important Notes

1. **ATScript is NOT TypeScript**
   - Do NOT use `createPrimitive`, class-based patterns, or any TypeScript-specific constructs
   - Primitives are defined purely in `atscript.config.js`
   - No TypeScript code is needed to define primitives

2. **Type Field Must Match Parent Group**
   - Extensions under `string` must have `type: 'string'`
   - Extensions under `number` must have `type: 'number'`
   - Extensions under `boolean` must have `type: 'boolean'`

3. **Implicit Constraints**
   - Constraints in `expect` are **implicit** — they apply automatically
   - No need for `@expect.*` annotations at usage sites
   - Additional explicit annotations can still be added

4. **Pattern Constraint Format**
   - The `pattern` constraint is an array: `[regexString, flags, errorMessage]`
   - Regex string must be properly escaped (use `\\` for backslashes)
   - Flags are optional (empty string for none)
   - Error message is shown when validation fails

5. **Type Declaration Updates**
   - Always run `npx asc -f dts` after config changes
   - This updates IntelliSense for the new primitives

6. **Combining Primitives**
   - You can chain multiple extensions: `number.int.positive`
   - Each extension adds its constraints and tags

---

## Best Practices

### 1. Use Descriptive Names

```js
// Good
url: { /* ... */ }
percentage: { /* ... */ }
latitude: { /* ... */ }

// Avoid
u: { /* ... */ }
pct: { /* ... */ }
lat: { /* ... */ }
```

### 2. Write Helpful Documentation

```js
// Good: Clear, explains purpose and constraints
port: {
  type: 'number',
  documentation: 'Network port number (1-65535)',
  // ...
}

// Avoid: Vague or missing context
port: {
  type: 'number',
  documentation: 'Port',
  // ...
}
```

### 3. Provide Clear Error Messages

```js
// Good: Specific error message
pattern: ['^[A-Z]{2}$', '', 'Must be exactly 2 uppercase letters']

// Avoid: Generic or missing message
pattern: ['^[A-Z]{2}$', '', '']
```

### 4. Choose Appropriate Constraints

```js
// Good: Meaningful constraints
email: {
  expect: {
    pattern: ['^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$', 'i', 'Invalid email'],
    minLength: 5,
    maxLength: 254,  // RFC 5321
  },
}

// Avoid: Missing important constraints
email: {
  expect: {
    pattern: ['^.+@.+$', '', 'Invalid email'],
  },
}
```

### 5. Group Related Primitives

```js
// Good: Related primitives under same base type
string: {
  extensions: {
    ipv4: { /* ... */ },
    ipv6: { /* ... */ },
    hostname: { /* ... */ },
  },
}
```

---

## Troubleshooting

### IntelliSense Not Showing New Primitives

**Solution:** Run `npx asc -f dts` to regenerate type declarations

### Type Mismatch Error

**Problem:** Extension `type` doesn't match parent group

**Solution:** Ensure `string` extensions have `type: 'string'`, etc.

### Validation Not Working

**Problem:** Constraints not being enforced

**Possible causes:**
1. Config not properly saved
2. Type declarations not regenerated
3. Typo in constraint keys

**Solution:**
1. Save `atscript.config.js`
2. Run `npx asc -f dts`
3. Verify constraint key names match `@expect.*` annotations

### Pattern Regex Errors

**Problem:** Regex pattern not matching expected input

**Solution:**
- Test regex separately
- Properly escape backslashes (`\\d` not `\d`)
- Verify regex syntax

---

## Quick Reference

### Define Primitive

```js
// atscript.config.js
primitives: {
  baseType: {
    extensions: {
      name: {
        type: 'string' | 'number' | 'boolean',
        documentation: 'Description',
        expect: {
          // constraints
        },
      },
    },
  },
}
```

### Use in .as File

```atscript
field: baseType.name
```

### Update IntelliSense

```bash
npx asc -f dts
```

### Common Constraints

```js
// String
expect: {
  pattern: ['^regex$', 'flags', 'message'],
  minLength: 3,
  maxLength: 50,
}

// Number
expect: {
  min: 0,
  max: 100,
  int: true,
}
```
