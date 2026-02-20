import type { TFoormTypeComponents } from '../components/types'
import {
  OoInput,
  OoSelect,
  OoRadio,
  OoCheckbox,
  OoParagraph,
  OoAction,
  OoObject,
  OoArray,
  OoUnion,
  OoTuple,
} from '../components/default'

/**
 * Returns a fresh type-to-component map pre-filled with all built-in defaults.
 *
 * Spread or assign additional entries to extend with custom field types:
 * ```ts
 * const types = { ...createDefaultTypes(), rating: MyRatingComponent }
 * ```
 */
export function createDefaultTypes(): TFoormTypeComponents {
  return {
    text: OoInput,
    password: OoInput,
    number: OoInput,
    select: OoSelect,
    radio: OoRadio,
    checkbox: OoCheckbox,
    paragraph: OoParagraph,
    action: OoAction,
    object: OoObject,
    array: OoArray,
    union: OoUnion,
    tuple: OoTuple,
  }
}
