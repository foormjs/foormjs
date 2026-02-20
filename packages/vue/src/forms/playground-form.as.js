// prettier-ignore-start
/* eslint-disable */
/* oxlint-disable */
import { defineAnnotatedType as $, annotate as $a } from '@atscript/typescript/utils'

export class PlaygroundForm {
  static __is_atscript_annotated_type = true
  static type = {}
  static metadata = new Map()
  static toJsonSchema() {
    throw new Error(
      "JSON Schema support is disabled. To enable, set `jsonSchema: 'lazy'` or `jsonSchema: 'bundle'` in tsPlugin options, or add @emit.jsonSchema annotation to individual interfaces."
    )
  }
}

class Address {
  static __is_atscript_annotated_type = true
  static type = {}
  static metadata = new Map()
  static toJsonSchema() {
    throw new Error(
      "JSON Schema support is disabled. To enable, set `jsonSchema: 'lazy'` or `jsonSchema: 'bundle'` in tsPlugin options, or add @emit.jsonSchema annotation to individual interfaces."
    )
  }
}

class Contact {
  static __is_atscript_annotated_type = true
  static type = {}
  static metadata = new Map()
  static toJsonSchema() {
    throw new Error(
      "JSON Schema support is disabled. To enable, set `jsonSchema: 'lazy'` or `jsonSchema: 'bundle'` in tsPlugin options, or add @emit.jsonSchema annotation to individual interfaces."
    )
  }
}

class MyString {
  static __is_atscript_annotated_type = true
  static type = {}
  static metadata = new Map()
  static toJsonSchema() {
    throw new Error(
      "JSON Schema support is disabled. To enable, set `jsonSchema: 'lazy'` or `jsonSchema: 'bundle'` in tsPlugin options, or add @emit.jsonSchema annotation to individual interfaces."
    )
  }
}

$('object', PlaygroundForm)
  .prop(
    'addresses',
    $('array')
      .of(
        $('union')
          .item($().refTo(Address).annotate('meta.label', 'Address').$type)
          .item($().refTo(Contact).annotate('meta.label', 'Contact').$type)
          .item(
            $().refTo(MyString).annotate('meta.label', 'Add addresses, contacts, or just text')
              .$type
          ).$type
      )
      .annotate('meta.label', 'Addresses /Contacts').$type
  )
  .annotate('meta.label', 'Playground Form')
  .annotate('meta.required', {})
  .annotate('foorm.submit.text', 'Go')

$('object', Address)
  .prop('type', $().designType('string').value('address').annotate('foorm.hidden', true).$type)
  .prop('street', $().designType('string').tags('string').$type)
  .prop('city', $().designType('string').tags('string').$type)
  .prop('country', $().designType('string').tags('string').$type)
  .annotate('meta.label', 'Address')

$('object', Contact)
  .prop('type', $().designType('string').value('phone').annotate('foorm.hidden', true).$type)
  .prop('email', $().designType('string').tags('string').$type)
  .prop('phone', $().designType('string').tags('string').$type)
  .annotate('meta.label', 'Contact')

$('', MyString)
  .designType('string')
  .tags('string')
  .annotate('meta.label', 'Add addresses, contacts, or just text')

// prettier-ignore-end
