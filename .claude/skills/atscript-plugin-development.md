# ATScript Plugin Development Skill

## Overview

This skill covers how to create ATScript plugins that ship custom annotations, primitives, code generation, and other extensions. Plugins are the primary mechanism for extending ATScript's capabilities.

**Official Documentation:** https://atscript.moost.org

---

## The TAtscriptPlugin Interface

Every plugin implements `TAtscriptPlugin` from `@atscript/core`. A plugin is a factory function that returns an object with a `name` and optional lifecycle hooks.

```typescript
import { TAtscriptPlugin } from '@atscript/core'

export interface TAtscriptPlugin {
  name: string

  config?: (
    config: TAtscriptConfig
  ) => Promise<TAtscriptConfig | undefined> | TAtscriptConfig | undefined

  resolve?: (id: string) => Promise<string | undefined> | string | undefined

  load?: (id: string) => Promise<string | undefined> | string | undefined

  onDocumnet?: (doc: AtscriptDoc) => Promise<void> | void

  render?: (
    doc: AtscriptDoc,
    format: TAtscriptRenderFormat
  ) => Promise<TPluginOutput[]> | TPluginOutput[]

  buildEnd?: (
    output: TOutput[],
    format: TAtscriptRenderFormat,
    repo: AtscriptRepo
  ) => Promise<void> | void
}
```

### Helper: createAtscriptPlugin

A type-safe identity helper for defining plugins:

```typescript
import { createAtscriptPlugin } from '@atscript/core'

export const myPlugin = createAtscriptPlugin({
  name: 'my-plugin',
  config() {
    /* ... */
  },
})
```

---

## Plugin Hooks

### `config(config)` — Provide Annotations, Primitives, and Configuration

The most common hook. Returns a partial `TAtscriptConfig` that gets deep-merged (via `defu`) with the base config and other plugins' configs. This is where plugins register their custom annotations and primitives.

```typescript
config(config) {
  return {
    primitives: { /* custom primitives */ },
    annotations: { /* custom annotation tree */ },
  }
}
```

The `config` hook is called iteratively across all plugins until all have been processed. The returned config is merged using `defu` (deep defaults merge — plugin values fill in gaps but don't override existing values).

**Key config properties a plugin can provide:**

| Property            | Type                               | Description                                                     |
| ------------------- | ---------------------------------- | --------------------------------------------------------------- |
| `primitives`        | `Record<string, TPrimitiveConfig>` | Custom primitive type definitions                               |
| `annotations`       | `TAnnotationsTree`                 | Custom annotation definitions (nested `AnnotationSpec` objects) |
| `unknownAnnotation` | `'allow' \| 'warn' \| 'error'`     | How to handle undefined annotations                             |
| `rootDir`           | `string`                           | Root directory for `.as` files                                  |
| `entries`           | `string[]`                         | Specific files to process                                       |
| `include`           | `string[]`                         | Glob patterns to include                                        |
| `exclude`           | `string[]`                         | Glob patterns to exclude                                        |

### `resolve(id)` — Custom Module Resolution

Called when resolving import paths. Return a new path string to redirect resolution, or `undefined` to pass through to the next plugin.

```typescript
resolve(id) {
  if (id.startsWith('virtual:')) {
    return `/absolute/path/to/${id.slice(8)}.as`
  }
}
```

### `load(id)` — Custom Module Loading

Called when loading file contents. Return file content as a string, or `undefined` to fall through to the default file system reader.

```typescript
load(id) {
  if (id.includes('virtual-module')) {
    return `export interface VirtualType { value: string }`
  }
}
```

### `onDocumnet(doc)` — Post-Parse Document Hook

Called after a document (`.as` file) is parsed. Receives the `AtscriptDoc` instance. Use for custom post-processing of parsed documents.

```typescript
onDocumnet(doc) {
  // Inspect or modify the parsed document
  console.log(`Parsed: ${doc.id}`)
}
```

### `render(doc, format)` — Code Generation

Called for each document during build. Returns an array of output files (`TPluginOutput[]`). The `format` parameter is a string (e.g., `'dts'`, `'js'`) that determines what kind of output to generate.

```typescript
render(doc, format) {
  if (format === 'dts') {
    return [{
      fileName: `${doc.name}.d.ts`,
      content: generateTypeDeclarations(doc),
    }]
  }
  if (format === 'js') {
    return [{
      fileName: `${doc.name}.js`,
      content: generateJavaScript(doc),
    }]
  }
}
```

**`TPluginOutput` shape:**

```typescript
interface TPluginOutput {
  fileName: string
  content: string
}
```

### `buildEnd(output, format, repo)` — Post-Build Aggregation

Called once after all documents have been rendered. Receives the full output array, the format, and the `AtscriptRepo` instance. Use for generating aggregate files (like global type declarations).

```typescript
async buildEnd(output, format, repo) {
  if (format === 'dts') {
    const annotations = await repo.getUsedAnnotations()
    const tags = await repo.getPrimitivesTags()
    output.push({
      content: generateGlobalDts(annotations, tags),
      fileName: 'my-plugin.d.ts',
      source: '',
      target: path.join(repo.root, 'my-plugin.d.ts'),
    })
  }
}
```

---

## Defining Annotations in a Plugin

Annotations are defined as a `TAnnotationsTree` — a nested object where leaves are `AnnotationSpec` instances and intermediate keys form the namespace hierarchy.

### TAnnotationsTree Structure

```typescript
import { TAnnotationsTree, AnnotationSpec } from '@atscript/core'

const annotations: TAnnotationsTree = {
  namespace: {
    annotationName: new AnnotationSpec({
      /* config */
    }),
    nested: {
      deepAnnotation: new AnnotationSpec({
        /* config */
      }),
    },
  },
}
```

This creates annotations like `@namespace.annotationName` and `@namespace.nested.deepAnnotation`.

### AnnotationSpec Configuration

```typescript
interface TAnnotationSpecConfig {
  description?: string // IntelliSense hover text
  nodeType?: TNodeEntity[] // Valid targets: 'interface', 'type', 'prop'
  defType?: SemanticPrimitiveNode['type'][] // Restrict to specific underlying types
  multiple?: boolean // Allow multiple instances on same node
  mergeStrategy?: 'append' | 'replace' // Inheritance merge behavior (default: 'replace')
  argument?: TAnnotationArgument | TAnnotationArgument[] // Annotation arguments

  // Advanced hooks (for plugins)
  validate?: (mainToken: Token, args: Token[], doc: AtscriptDoc) => TMessages | undefined
  modify?: (mainToken: Token, args: Token[], doc: AtscriptDoc) => void
}
```

### TAnnotationArgument

```typescript
interface TAnnotationArgument {
  name: string
  type: 'string' | 'number' | 'boolean'
  optional?: boolean
  description?: string
  values?: string[] // Allowed values (shown in IntelliSense, validated at parse time)
}
```

**Key details:**

- `argument` can be a single object or an array for multi-argument annotations.
- `values` restricts the argument to an enumerated set — validated at parse time with error messages.
- `defType` restricts the annotation to properties of specific underlying types (e.g., `['string']`, `['number']`, `['array']`).

### Advanced: validate and modify Hooks

Unlike user-facing annotations defined in `atscript.config.js`, plugin annotations can include `validate` and `modify` hooks that operate on AST tokens:

**`validate(mainToken, args, doc)`** — Returns error/warning messages (`TMessages`) for custom validation logic beyond what `AnnotationSpec` handles automatically.

```typescript
validate(token, args, doc) {
  const parent = token.parentNode
  const errors: TMessages = []

  // Example: verify the annotated field has the right type
  const definition = parent?.getDefinition()
  if (isRef(definition)) {
    const def = doc.unwindType(definition.id!, definition.chain)?.def
    if (isPrimitive(def) && def.config.type !== 'string') {
      errors.push({
        message: `@myns.myAnnotation requires a string field`,
        severity: 1,
        range: token.range,
      })
    }
  }
  return errors
}
```

**`modify(mainToken, args, doc)`** — Mutates the AST after annotation is applied. For example, the mongo plugin uses this to add a virtual `_id` property:

```typescript
modify(token, args, doc) {
  const parent = token.parentNode
  const struc = parent?.getDefinition()
  if (isInterface(parent) && !parent.props.has('_id') && isStructure(struc)) {
    struc.addVirtualProp({
      name: '_id',
      type: 'mongo.objectId',
      documentation: 'Primary Key',
    })
  }
}
```

### TMessages Format

```typescript
type TMessages = Array<{
  severity: 1 | 2 | 3 | 4 // 1=Error, 2=Warning, 3=Info, 4=Hint
  message: string
  range: { start: { line: number; character: number }; end: { line: number; character: number } }
  tags?: number[]
}>
```

---

## Defining Primitives in a Plugin

Primitives are defined as `Record<string, TPrimitiveConfig>`. Each key is a base type name, with `extensions` providing dot-notation subtypes.

### TPrimitiveConfig Structure

```typescript
interface TPrimitiveConfig {
  type?: string // Base TS type: 'string', 'number', 'boolean', 'null', 'void'
  documentation?: string // IntelliSense documentation
  expect?: Record<string, any> // Implicit validation constraints
  extensions?: Record<string, Partial<TPrimitiveConfig>> // Dot-notation subtypes
}
```

### Primitive Definition Example

```typescript
import { TAtscriptConfig } from '@atscript/core'

export const primitives: TAtscriptConfig['primitives'] = {
  mongo: {
    extensions: {
      objectId: {
        type: 'string',
        documentation: 'Represents a MongoDB ObjectId.',
        expect: {
          pattern: /^[a-fA-F0-9]{24}$/,
        },
      },
      vector: {
        type: { kind: 'array', of: 'number' },
        documentation: 'MongoDB Vector (array of numbers) for vector search.',
      },
    },
  },
}
```

This creates `mongo.objectId` and `mongo.vector` types usable in `.as` files.

### Nested Extensions (Multi-Level Dot Notation)

Primitives support nested extensions for hierarchical type tags:

```typescript
const primitives = {
  number: {
    type: 'number',
    extensions: {
      int: {
        documentation: 'Integer number.',
        expect: { int: true },
        extensions: {
          positive: {
            documentation: 'Positive integer.',
            expect: { min: 0 },
          },
          negative: {
            documentation: 'Negative integer.',
            expect: { max: 0 },
          },
        },
      },
    },
  },
}
```

This creates types like `number.int`, `number.int.positive`, `number.int.negative`.

### expect Constraint Keys

The `expect` object mirrors `@expect.*` annotations:

| Key         | Type                                     | Applies To    | Description                      |
| ----------- | ---------------------------------------- | ------------- | -------------------------------- |
| `pattern`   | `RegExp` or `[string, flags?, message?]` | string        | Regex pattern validation         |
| `min`       | `number`                                 | number        | Minimum numeric value            |
| `max`       | `number`                                 | number        | Maximum numeric value            |
| `minLength` | `number`                                 | string, array | Minimum length                   |
| `maxLength` | `number`                                 | string, array | Maximum length                   |
| `int`       | `boolean`                                | number        | Must be integer                  |
| `message`   | `string`                                 | any           | Custom error message for pattern |

**Note:** In plugin code, `pattern` can use actual `RegExp` objects (not just string arrays like in `atscript.config.js`). The config-level `expect.pattern` accepts `[regexString, flags, errorMessage]` arrays.

---

## Complete Plugin Examples

### Example 1: Config-Only Plugin (like Mongo)

A plugin that only provides annotations and primitives:

```typescript
import { TAtscriptPlugin, AnnotationSpec } from '@atscript/core'

export interface TMyPluginOptions {
  prefix?: string
}

export const myPlugin: (opts?: TMyPluginOptions) => TAtscriptPlugin = opts => {
  return {
    name: 'my-plugin',

    config() {
      return {
        primitives: {
          custom: {
            extensions: {
              currency: {
                type: 'string',
                documentation: 'ISO 4217 currency code (e.g., USD, EUR)',
                expect: {
                  pattern: /^[A-Z]{3}$/,
                  message: 'Invalid currency code',
                },
              },
              amount: {
                type: 'number',
                documentation: 'Monetary amount (non-negative, max 2 decimal places)',
                expect: {
                  min: 0,
                },
              },
            },
          },
        },
        annotations: {
          billing: {
            taxable: new AnnotationSpec({
              description: 'Mark this field as subject to tax calculation',
              nodeType: ['prop'],
            }),
            rounding: new AnnotationSpec({
              description: 'Rounding strategy for monetary calculations',
              argument: {
                name: 'strategy',
                type: 'string',
                values: ['ceil', 'floor', 'round', 'bankers'],
                description: 'The rounding strategy to apply',
              },
            }),
          },
        },
      }
    },
  }
}
```

**Usage in `atscript.config.js`:**

```js
import { defineConfig } from '@atscript/core'
import ts from '@atscript/typescript'
import { myPlugin } from './my-plugin'

export default defineConfig({
  rootDir: 'src',
  plugins: [ts(), myPlugin()],
})
```

**Usage in `.as` files:**

```atscript
export interface Invoice {
    @billing.taxable
    @billing.rounding 'bankers'
    amount: custom.amount

    currency: custom.currency
}
```

### Example 2: Render Plugin (like TypeScript)

A plugin that generates output files from `.as` documents:

```typescript
import { TAtscriptPlugin } from '@atscript/core'
import path from 'path'

export const jsonPlugin: () => TAtscriptPlugin = () => {
  return {
    name: 'json-schema',

    render(doc, format) {
      if (format === 'json') {
        const schemas = []
        for (const [name, node] of doc.exports) {
          schemas.push({
            fileName: `${name}.schema.json`,
            content: JSON.stringify(generateSchema(node), null, 2),
          })
        }
        return schemas
      }
    },

    async buildEnd(output, format, repo) {
      if (format === 'json') {
        output.push({
          content: JSON.stringify({ schemas: output.map(o => o.fileName) }),
          fileName: 'index.json',
          source: '',
          target: path.join(repo.root, 'schemas', 'index.json'),
        })
      }
    },
  }
}
```

### Example 3: Full Plugin (Annotations + Primitives + Validation + Code Gen)

```typescript
import {
  TAtscriptPlugin,
  AnnotationSpec,
  isInterface,
  isStructure,
  isRef,
  isPrimitive,
  TMessages,
} from '@atscript/core'

export const apiPlugin: () => TAtscriptPlugin = () => {
  return {
    name: 'api',

    config() {
      return {
        primitives: {
          api: {
            extensions: {
              url: {
                type: 'string',
                documentation: 'A valid API endpoint URL',
                expect: {
                  pattern: /^\/[a-z0-9\-\/{}:]+$/i,
                  message: 'Invalid API URL pattern',
                },
              },
            },
          },
        },
        annotations: {
          api: {
            endpoint: new AnnotationSpec({
              description: 'Define an API endpoint for this interface',
              nodeType: ['interface'],
              argument: [
                {
                  name: 'method',
                  type: 'string',
                  values: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
                  description: 'HTTP method',
                },
                {
                  name: 'path',
                  type: 'string',
                  description: 'URL path pattern (e.g., "/users/:id")',
                },
              ],
            }),
            auth: new AnnotationSpec({
              description: 'Require authentication for this endpoint',
              nodeType: ['interface'],
              argument: {
                name: 'strategy',
                type: 'string',
                values: ['bearer', 'basic', 'apiKey'],
                optional: true,
              },
            }),
            deprecated: new AnnotationSpec({
              description: 'Mark as deprecated',
              argument: {
                name: 'message',
                type: 'string',
                optional: true,
              },
            }),
            field: {
              query: new AnnotationSpec({
                description: 'Map this field to a query parameter',
                nodeType: ['prop'],
              }),
              body: new AnnotationSpec({
                description: 'Map this field to the request body',
                nodeType: ['prop'],
              }),
              header: new AnnotationSpec({
                description: 'Map this field to a request header',
                nodeType: ['prop'],
                argument: {
                  name: 'headerName',
                  type: 'string',
                  description: 'The HTTP header name',
                },
              }),
            },
          },
        },
      }
    },

    render(doc, format) {
      if (format === 'openapi') {
        // Generate OpenAPI spec from annotated interfaces
        return [
          {
            fileName: `${doc.name}.openapi.json`,
            content: generateOpenApiSpec(doc),
          },
        ]
      }
    },
  }
}
```

---

## Key Imports from @atscript/core

```typescript
// Plugin types
import {
  TAtscriptPlugin,
  createAtscriptPlugin,
  TPluginOutput,
  TAtscriptRenderFormat,
} from '@atscript/core'

// Config types
import { TAtscriptConfig, TAnnotationsTree, defineConfig } from '@atscript/core'

// Annotations
import { AnnotationSpec, isAnnotationSpec, resolveAnnotation } from '@atscript/core'

// Node type guards (for validate/modify hooks)
import {
  isInterface, // SemanticInterfaceNode
  isStructure, // SemanticStructureNode (inline object type)
  isPrimitive, // SemanticPrimitiveNode
  isRef, // SemanticRefNode (type reference)
  isProp, // SemanticPropNode
  isGroup, // SemanticGroup (union/intersection/tuple)
  isType, // SemanticTypeNode (type alias)
  isAnnotate, // SemanticAnnotateNode
  isArray, // Array type check
} from '@atscript/core'

// AST types
import type { AtscriptDoc } from '@atscript/core'
import type { AtscriptRepo } from '@atscript/core'
import type { Token } from '@atscript/core'
import type { TMessages } from '@atscript/core'
import type { TOutput } from '@atscript/core'
```

---

## AtscriptDoc Key Properties and Methods

The `AtscriptDoc` instance passed to plugin hooks provides:

| Property/Method                    | Description                                               |
| ---------------------------------- | --------------------------------------------------------- |
| `doc.id`                           | Document URI (e.g., `file:///path/to/file.as`)            |
| `doc.name`                         | File name (last segment of path)                          |
| `doc.nodes`                        | Top-level parsed semantic nodes                           |
| `doc.exports`                      | Map of exported nodes by identifier                       |
| `doc.imports`                      | Map of imported definitions by URI                        |
| `doc.dependencies`                 | Set of documents this doc depends on                      |
| `doc.dependants`                   | Set of documents that depend on this doc                  |
| `doc.config.primitives`            | Map of available primitives                               |
| `doc.config.annotations`           | Annotation tree                                           |
| `doc.unwindType(name, chain?)`     | Resolves a type reference to its final definition         |
| `doc.resolveAnnotation(name)`      | Finds an `AnnotationSpec` by dot-path name                |
| `doc.render(format)`               | Triggers rendering via the plugin manager                 |
| `doc.evalAnnotationsForNode(node)` | Collects all annotations (including inherited) for a node |

---

## AtscriptRepo Key Properties and Methods

The `AtscriptRepo` instance available in `buildEnd`:

| Property/Method                | Description                                          |
| ------------------------------ | ---------------------------------------------------- |
| `repo.root`                    | Root directory path                                  |
| `repo.getUsedAnnotations()`    | Returns all annotations used across all documents    |
| `repo.getPrimitivesTags()`     | Returns all primitive tags used across all documents |
| `repo.openDocument(id, text?)` | Opens or updates a cached document                   |

---

## Plugin Registration

Plugins are registered in the `plugins` array of `atscript.config.js`:

```js
import { defineConfig } from '@atscript/core'
import ts from '@atscript/typescript'
import { MongoPlugin } from '@atscript/mongo'
import { myPlugin } from './my-plugin'

export default defineConfig({
  rootDir: 'src',
  plugins: [
    ts(),
    MongoPlugin(),
    myPlugin({
      /* options */
    }),
  ],
})
```

**Important:** After adding or modifying plugins, regenerate type declarations:

```bash
npx asc -f dts
```

---

## Plugin Design Patterns

### 1. Factory Function Pattern

Always export plugins as factory functions (optionally accepting options), not plain objects:

```typescript
export const myPlugin: (opts?: TMyPluginOptions) => TAtscriptPlugin = opts => {
  return { name: 'my-plugin' /* ... */ }
}
```

### 2. Separate Annotations and Primitives into Files

For larger plugins, keep annotations and primitives in separate files:

```
my-plugin/
  src/
    index.ts          # Re-exports the plugin factory
    plugin.ts         # Plugin factory function
    annotations.ts    # TAnnotationsTree export
    primitives.ts     # Primitives config export
```

### 3. Config-Only vs Render Plugins

- **Config-only plugins** (like Mongo) only implement `config()` to provide annotations/primitives. They rely on other plugins (like TypeScript) for code generation.
- **Render plugins** (like TypeScript) implement `render()` and optionally `buildEnd()` to generate output files.
- Plugins can do both.

### 4. Using validate/modify Sparingly

`validate` and `modify` hooks in `AnnotationSpec` operate on low-level AST tokens. Use them when:

- You need to enforce constraints that can't be expressed with `nodeType`/`defType`/`argument` alone
- You need to auto-generate properties or modify the AST (like Mongo's virtual `_id`)

For simple metadata annotations, the declarative `AnnotationSpec` config is sufficient — no hooks needed.
