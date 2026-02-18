/**
 * @packageDocumentation
 * Build-time ATScript plugin that registers foorm annotations and primitives.
 *
 * Add `foormPlugin()` to your ATScript config to enable `@foorm.*` annotations
 * and foorm-specific primitive types (action, paragraph, select, radio, checkbox).
 *
 * @see {@link https://atscript.moost.org | ATScript Documentation}
 */

export { foormPlugin } from './plugin/foorm-plugin'
export type { TFoormPluginOptions } from './plugin/foorm-plugin'
export { annotations } from './plugin/annotations'
export { primitives } from './plugin/primitives'
