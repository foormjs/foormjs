# ATScript Plugin Development Skill

## Overview

This skill covers how to create ATScript plugins that ship custom annotations, primitives, code generation, and other extensions. Plugins are the primary mechanism for extending ATScript's capabilities.

**Note:** The official plugin development docs (https://atscript.moost.org/plugin-development) are still under construction. This skill is based on the `@atscript/core` API and real-world plugin implementations (e.g., the foorm plugin in this codebase).

---

## The TAtscriptPlugin Interface

Every plugin implements `TAtscriptPlugin` from `@atscript/core`. A plugin is a factory function that returns an object with a `name` and optional lifecycle hooks.

```typescript
import type { TAtscriptPlugin } from '@atscript/core'

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

Called when resolving import paths. Return a new path string to redirect, or `undefined` to pass through.

```typescript
resolve(id) {
  if (id.startsWith('virtual:')) {
    return `/absolute/path/to/${id.slice(8)}.as`
  }
}
```

### `load(id)` — Custom Module Loading

Called when loading file contents. Return content as a string, or `undefined` for default file system.

```typescript
load(id) {
  if (id.includes('virtual-module')) {
    return `export interface VirtualType { value: string }`
  }
}
```

### `onDocumnet(doc)` — Post-Parse Document Hook

Called after a document (`.as` file) is parsed. Receives the `AtscriptDoc` instance.

```typescript
onDocumnet(doc) {
  console.log(`Parsed: ${doc.id}`)
}
```

### `render(doc, format)` — Code Generation

Called for each document during build. Returns an array of output files. The `format` parameter is a string (e.g., `'dts'`, `'js'`).

```typescript
render(doc, format) {
  if (format === 'dts') {
    return [{
      fileName: `${doc.name}.d.ts`,
      content: generateTypeDeclarations(doc),
    }]
  }
}
```

### `buildEnd(output, format, repo)` — Post-Build Aggregation

Called once after all documents have been rendered. Use for generating aggregate files (like global type declarations).

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
import type { TAnnotationsTree } from '@atscript/core'
import { AnnotationSpec } from '@atscript/core'

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
  description?: string
  nodeType?: TNodeEntity[] // 'interface', 'type', 'prop'
  defType?: string[] // Restrict to specific underlying types
  multiple?: boolean
  mergeStrategy?: 'append' | 'replace'
  argument?: TAnnotationArgument | TAnnotationArgument[]

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
  values?: string[] // Allowed values (IntelliSense + parse-time validation)
}
```

**Key details:**

- `argument` can be a single object or an array for multi-argument annotations.
- `values` restricts the argument to an enumerated set — validated at parse time.
- `defType` restricts the annotation to properties of specific underlying types.

### Advanced: validate and modify Hooks

Plugin annotations can include `validate` and `modify` hooks that operate on AST tokens:

**`validate(mainToken, args, doc)`** — Returns error/warning messages for custom validation:

```typescript
validate(token, args, doc) {
  const parent = token.parentNode
  const errors: TMessages = []
  const definition = parent?.getDefinition()
  if (isRef(definition)) {
    const def = doc.unwindType(definition.id!, definition.chain)?.def
    if (isPrimitive(def) && def.config.type !== 'string') {
      errors.push({
        message: '@myns.myAnnotation requires a string field',
        severity: 1,
        range: token.range,
      })
    }
  }
  return errors
}
```

**`modify(mainToken, args, doc)`** — Mutates the AST after annotation is applied:

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

Primitives are defined as `Record<string, TPrimitiveConfig>`.

### TPrimitiveConfig Structure

```typescript
interface TPrimitiveConfig {
  type?: string // 'string', 'number', 'boolean', 'phantom', etc. (inherited from parent)
  documentation?: string // IntelliSense docs (inherited from parent)
  expect?: Record<string, any> // Validation constraints (merged with parent)
  extensions?: Record<string, Partial<TPrimitiveConfig>> // Dot-notation subtypes
  isContainer?: boolean // If true, cannot be used directly
}
```

### Primitive Definition Example

```typescript
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

### Nested Extensions (Multi-Level Dot Notation)

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
        },
      },
    },
  },
}
```

### Custom Phantom Namespaces

```typescript
const primitives = {
  foorm: {
    type: 'phantom',
    isContainer: true,
    documentation: 'Form-specific non-data elements',
    extensions: {
      action: { documentation: 'An action element (button, link)' },
      paragraph: { documentation: 'A block of informational text' },
      select: { type: 'string', documentation: 'A select dropdown field' },
    },
  },
}
```

- `isContainer: true` prevents using `foorm` directly
- Extensions inherit `type: 'phantom'` unless overridden
- Individual extensions can override to data types (e.g., `type: 'string'`)

### expect Constraint Keys

| Key         | Type                                     | Applies To    | Description              |
| ----------- | ---------------------------------------- | ------------- | ------------------------ |
| `pattern`   | `RegExp` or `[string, flags?, message?]` | string        | Regex pattern validation |
| `min`       | `number`                                 | number        | Minimum value            |
| `max`       | `number`                                 | number        | Maximum value            |
| `minLength` | `number`                                 | string, array | Minimum length           |
| `maxLength` | `number`                                 | string, array | Maximum length           |
| `int`       | `boolean`                                | number        | Must be integer          |

**Note:** In plugin code, `pattern` can use actual `RegExp` objects.

---

## Complete Plugin Example

### Config-Only Plugin (Annotations + Primitives)

```typescript
import type { TAtscriptPlugin } from '@atscript/core'
import { AnnotationSpec } from '@atscript/core'

export interface TMyPluginOptions {
  components?: string[]
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
              },
            }),
          },
        },
      }
    },
  }
}
```

### Full Plugin (Annotations + Primitives + Code Gen)

```typescript
import type { TAtscriptPlugin } from '@atscript/core'
import { AnnotationSpec } from '@atscript/core'

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
              description: 'Define an API endpoint',
              nodeType: ['interface'],
              argument: [
                {
                  name: 'method',
                  type: 'string',
                  values: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
                },
                { name: 'path', type: 'string', description: 'URL path pattern' },
              ],
            }),
            auth: new AnnotationSpec({
              description: 'Require authentication',
              nodeType: ['interface'],
              argument: {
                name: 'strategy',
                type: 'string',
                values: ['bearer', 'basic', 'apiKey'],
                optional: true,
              },
            }),
            field: {
              query: new AnnotationSpec({
                description: 'Map to query parameter',
                nodeType: ['prop'],
              }),
              body: new AnnotationSpec({
                description: 'Map to request body',
                nodeType: ['prop'],
              }),
              header: new AnnotationSpec({
                description: 'Map to request header',
                nodeType: ['prop'],
                argument: { name: 'headerName', type: 'string' },
              }),
            },
          },
        },
      }
    },

    render(doc, format) {
      if (format === 'openapi') {
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
import type {
  TAtscriptPlugin,
  TPluginOutput,
  TAtscriptRenderFormat,
  TAtscriptConfig,
  TAnnotationsTree,
} from '@atscript/core'
import { createAtscriptPlugin, defineConfig, AnnotationSpec } from '@atscript/core'

// Node type guards (for validate/modify hooks)
import {
  isInterface,
  isStructure,
  isPrimitive,
  isRef,
  isProp,
  isGroup,
  isType,
  isAnnotate,
  isArray,
} from '@atscript/core'

// AST types
import type { AtscriptDoc, AtscriptRepo, Token, TMessages, TOutput } from '@atscript/core'
```

---

## AtscriptDoc Key Properties and Methods

| Property/Method                    | Description                                               |
| ---------------------------------- | --------------------------------------------------------- |
| `doc.id`                           | Document URI (e.g., `file:///path/to/file.as`)            |
| `doc.name`                         | File name                                                 |
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

| Property/Method                | Description                                          |
| ------------------------------ | ---------------------------------------------------- |
| `repo.root`                    | Root directory path                                  |
| `repo.getUsedAnnotations()`    | Returns all annotations used across all documents    |
| `repo.getPrimitivesTags()`     | Returns all primitive tags used across all documents |
| `repo.openDocument(id, text?)` | Opens or updates a cached document                   |

---

## Plugin Registration

```js
import { defineConfig } from '@atscript/core'
import ts from '@atscript/typescript'
import { myPlugin } from './my-plugin'

export default defineConfig({
  rootDir: 'src',
  plugins: [
    ts(),
    myPlugin({
      /* options */
    }),
  ],
})
```

After adding or modifying plugins, regenerate type declarations:

```bash
npx asc -f dts
```

---

## Plugin Design Patterns

### 1. Factory Function Pattern

Always export plugins as factory functions:

```typescript
export const myPlugin: (opts?: TMyPluginOptions) => TAtscriptPlugin = opts => {
  return { name: 'my-plugin' /* ... */ }
}
```

### 2. Separate Annotations and Primitives into Files

```
my-plugin/
  src/
    index.ts          # Re-exports the plugin factory
    plugin.ts         # Plugin factory function
    annotations.ts    # TAnnotationsTree export
    primitives.ts     # Primitives config export
```

### 3. Config-Only vs Render Plugins

- **Config-only** (like Mongo, Foorm) — only `config()` to provide annotations/primitives
- **Render plugins** (like TypeScript) — `render()` and `buildEnd()` for code generation
- Plugins can do both

### 4. Using validate/modify Sparingly

`validate` and `modify` hooks in `AnnotationSpec` operate on low-level AST tokens. Use them when:

- You need constraints beyond `nodeType`/`defType`/`argument`
- You need to auto-generate properties or modify the AST

For simple metadata annotations, declarative `AnnotationSpec` config is sufficient.
