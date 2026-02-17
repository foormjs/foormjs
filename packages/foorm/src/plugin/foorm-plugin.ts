import type { TAnnotationsTree, TAtscriptPlugin } from '@atscript/core'
import { AnnotationSpec } from '@atscript/core'

import { annotations } from './annotations'
import { primitives } from './primitives'

export interface TFoormPluginOptions {
  /**
   * Additional field type values to allow in @foorm.type annotation.
   * Built-in values: text, password, number, select, textarea, checkbox, radio, date, paragraph, action
   */
  extraTypes?: string[]

  /**
   * List of custom component names available in the project.
   * Enables IDE autocomplete and validation for @foorm.component annotation.
   * When omitted, @foorm.component accepts any string.
   */
  components?: string[]
}

const BUILTIN_TYPES = [
  'text',
  'password',
  'number',
  'select',
  'textarea',
  'checkbox',
  'radio',
  'date',
  'paragraph',
  'action',
]

/**
 * Creates an ATScript plugin that registers foorm annotations and primitives.
 *
 * @param opts - Optional configuration for extra field types and custom component names
 * @returns An ATScript plugin for use in `atscript.config.ts`
 *
 * @example
 * ```ts
 * // atscript.config.ts
 * import { foormPlugin } from 'foorm/plugin'
 *
 * export default {
 *   plugins: [
 *     foormPlugin({
 *       extraTypes: ['color', 'rating'],
 *       components: ['CustomStarInput', 'ColorPicker'],
 *     }),
 *   ],
 * }
 * ```
 */
export function foormPlugin(opts?: TFoormPluginOptions): TAtscriptPlugin {
  return {
    name: 'foorm',

    config() {
      if (!opts?.extraTypes?.length && !opts?.components?.length) {
        return { primitives, annotations }
      }

      const foormNs = annotations.foorm as TAnnotationsTree
      const overrides: TAnnotationsTree = {}

      if (opts.extraTypes?.length) {
        overrides.type = new AnnotationSpec({
          description: 'Field input type',
          nodeType: ['prop'],
          argument: {
            name: 'type',
            type: 'string',
            values: [...BUILTIN_TYPES, ...opts.extraTypes],
            description: 'The input type for this field',
          },
        })
      }

      if (opts.components?.length) {
        overrides.component = new AnnotationSpec({
          description: 'Named component override for rendering this field',
          nodeType: ['prop'],
          argument: {
            name: 'name',
            type: 'string',
            values: opts.components,
            description: 'Component name from the components registry',
          },
        })
      }

      return {
        primitives,
        annotations: {
          ...annotations,
          foorm: { ...foormNs, ...overrides },
        },
      }
    },
  }
}
