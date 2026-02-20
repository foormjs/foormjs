// prettier-ignore-start
/* eslint-disable */
/* oxlint-disable */
import { defineAnnotatedType as $, annotate as $a } from '@atscript/typescript/utils'

class TAddress {
  static __is_atscript_annotated_type = true
  static type = {}
  static metadata = new Map()
  static toJsonSchema() {
    throw new Error(
      "JSON Schema support is disabled. To enable, set `jsonSchema: 'lazy'` or `jsonSchema: 'bundle'` in tsPlugin options, or add @emit.jsonSchema annotation to individual interfaces."
    )
  }
}

export class ExplorationForm {
  static __is_atscript_annotated_type = true
  static type = {}
  static metadata = new Map()
  static toJsonSchema() {
    throw new Error(
      "JSON Schema support is disabled. To enable, set `jsonSchema: 'lazy'` or `jsonSchema: 'bundle'` in tsPlugin options, or add @emit.jsonSchema annotation to individual interfaces."
    )
  }
}

$('object', TAddress)
  .prop(
    'street',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'Street')
      .annotate('foorm.type', 'text').$type
  )
  .prop(
    'city',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'City')
      .annotate('foorm.type', 'text').$type
  )
  .annotate('foorm.component', 'CustomInput')
  .annotate('foorm.title', 'Address')

$('object', ExplorationForm)
  .prop(
    'name',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'Name')
      .annotate('foorm.type', 'text').$type
  )
  .prop(
    'addresses',
    $('array')
      .of(
        $()
          .refTo(TAddress)
          .annotate('foorm.component', 'CustomInput')
          .annotate('foorm.title', 'Address').$type
      )
      .annotate('meta.label', 'Addresses').$type
  )
  .prop(
    'contacts',
    $('array')
      .of(
        $('object').prop(
          'phone',
          $()
            .designType('string')
            .tags('string')
            .annotate('meta.label', 'Phone')
            .annotate('foorm.type', 'text').$type
        ).$type
      )
      .annotate('meta.label', 'Contacts').$type
  )
  .annotate('foorm.title', 'Exploration')

// prettier-ignore-end
