import type { TAtscriptPlugin } from '@atscript/core'

export { annotations } from './annotations'
export { primitives } from './primitives'

import { annotations } from './annotations'
import { primitives } from './primitives'

export interface TFoormPluginOptions {
  /**
   * Additional field type values to allow in @foorm.type annotation.
   * Built-in values: text, password, number, select, textarea, checkbox, radio, date, paragraph, action
   */
  extraTypes?: string[]
}

export function foormPlugin(opts?: TFoormPluginOptions): TAtscriptPlugin {
  return {
    name: 'foorm',

    config() {
      return {
        primitives,
        annotations,
      }
    },
  }
}
