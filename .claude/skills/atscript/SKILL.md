---
name: atscript
description: ATScript language and type system. Use when working with .as files, annotations (@meta.*, @expect.*), primitives (string.email, number.int), validators, type traversal, serialization, JSON Schema, ad-hoc annotations, custom annotations (AnnotationSpec), custom primitives, or ATScript plugin development (TAtscriptPlugin).
---

# ATScript Skill

ATScript is a universal type and metadata description language — a TypeScript superset with `.as` files, rich annotations, semantic primitives, runtime validation, serialization, and JSON Schema generation.

**Official documentation:** https://atscript.moost.org

## Sub-Files

This skill has detailed sub-files. Read the relevant one(s) based on the task:

| File | When to Read |
|------|-------------|
| `basics.md` | Core `.as` syntax, interfaces, types, primitives, annotations, ad-hoc annotations, metadata access, type traversal, validation basics, JSON Schema, serialization |
| `annotations.md` | Creating **custom** annotations with `AnnotationSpec` in `atscript.config.js` — new `@namespace.name` metadata |
| `primitives.md` | Creating **custom** primitives — new semantic types like `string.url`, `number.percentage`, phantom namespaces |
| `validation.md` | Deep dive into validation — Validator API, modes, options, plugins, error handling, annotation-driven rules, custom validators |
| `plugin-development.md` | Developing ATScript plugins — `TAtscriptPlugin` interface, hooks (`config`, `resolve`, `load`, `onDocumnet`, `render`, `buildEnd`), AST access |

## Quick Reference

### Key Packages

- `@atscript/core` — Core types, `AnnotationSpec`, `defineConfig`, plugin interfaces
- `@atscript/typescript` — TypeScript integration, code generation, runtime
- `@atscript/typescript/utils` — Utilities: serialization, traversal, validators, JSON Schema

### Common Imports

```typescript
// Generated types from .as files
import { User, Product } from './models.as'

// Utilities
import {
  Validator, ValidatorError,
  serializeAnnotatedType, deserializeAnnotatedType,
  forAnnotatedType, flattenAnnotatedType, defineAnnotatedType,
  buildJsonSchema, fromJsonSchema,
  isAnnotatedType, isPhantomType,
} from '@atscript/typescript/utils'

// Config and plugin types
import { defineConfig, AnnotationSpec } from '@atscript/core'
import type { TAtscriptPlugin, TValidatorPlugin } from '@atscript/core'
```

### .as File Quick Example

```atscript
import { Address } from './address'

@meta.description 'User entity'
export interface User {
    @meta.id
    @meta.readonly
    id: string.uuid

    @meta.label 'Email'
    @meta.placeholder 'user@example.com'
    email: string.email

    @meta.label 'Age'
    @expect.min 18, 'Must be 18+'
    age: number.int.positive

    address: Address
    tags: string[]
}
```

### Official Documentation Links

- Home: https://atscript.moost.org
- TypeScript package: https://atscript.moost.org/packages/typescript
- Validation: https://atscript.moost.org/packages/typescript/validation
- Custom annotations: https://atscript.moost.org/packages/typescript/custom-annotations
- Custom primitives: https://atscript.moost.org/packages/typescript/custom-primitives
- JSON Schema: https://atscript.moost.org/packages/typescript/json-schema
- Serialization: https://atscript.moost.org/packages/typescript/serialization
- Ad-hoc annotations: https://atscript.moost.org/packages/typescript/ad-hoc-annotations
- Plugin development: https://atscript.moost.org/plugin-development
- Plugin hooks: https://atscript.moost.org/plugin-development/plugin-hooks
- Plugin API: https://atscript.moost.org/plugin-development/plugin-api
- Primitives & type tags: https://atscript.moost.org/plugin-development/primitives-type-tags
- Annotation system: https://atscript.moost.org/plugin-development/annotation-system
- VSCode extension: https://atscript.moost.org/packages/vscode
