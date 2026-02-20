// prettier-ignore-start
/* eslint-disable */
/* oxlint-disable */
import { defineAnnotatedType as $, annotate as $a } from '@atscript/typescript/utils'

export class ArrayForm {
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

export class ArrayFormCustom {
  static __is_atscript_annotated_type = true
  static type = {}
  static metadata = new Map()
  static toJsonSchema() {
    throw new Error(
      "JSON Schema support is disabled. To enable, set `jsonSchema: 'lazy'` or `jsonSchema: 'bundle'` in tsPlugin options, or add @emit.jsonSchema annotation to individual interfaces."
    )
  }
}

$('object', ArrayForm)
  .prop(
    'instructions',
    $()
      .designType('phantom')
      .tags('paragraph', 'foorm')
      .annotate('foorm.value', 'Manage your project arrays below.')
      .annotate('foorm.order', 0).$type
  )
  .prop(
    'name',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'Name')
      .annotate('meta.placeholder', 'Project name')
      .annotate('foorm.type', 'text')
      .annotate('meta.required', { message: 'Name is required' })
      .annotate('foorm.order', 1).$type
  )
  .prop(
    'tags',
    $('array')
      .of($().designType('string').tags('string').$type)
      .annotate('meta.label', 'Tags')
      .annotate('foorm.order', 2)
      .annotate('foorm.array.add.label', 'Add tag')
      .annotate('foorm.array.remove.label', 'x')
      .annotate('expect.maxLength', { length: 5, message: 'Maximum 5 tags' }).$type
  )
  .prop(
    'scores',
    $('array')
      .of($().designType('number').tags('number').$type)
      .annotate('meta.label', 'Scores')
      .annotate('foorm.order', 3)
      .annotate('foorm.array.add.label', 'Add score')
      .annotate('expect.minLength', { length: 1, message: 'At least one score required' })
      .annotate('expect.maxLength', { length: 10, message: 'Maximum 10 scores' }).$type
  )
  .prop(
    'addresses',
    $('array')
      .of($().refTo(Address).annotate('foorm.title', 'Address').$type)
      .annotate('meta.label', 'Addresses')
      .annotate('foorm.order', 4)
      .annotate('foorm.array.add.label', 'Add address')
      .annotate('foorm.array.remove.label', 'Remove address').$type
  )
  .prop(
    'settings',
    $('object')
      .prop(
        'emailNotify',
        $()
          .designType('boolean')
          .tags('checkbox', 'foorm')
          .annotate('meta.label', 'Notify by email')
          .annotate('foorm.order', 1).$type
      )
      .prop(
        'pageSize',
        $()
          .designType('number')
          .tags('number')
          .annotate('meta.label', 'Max items per page')
          .annotate('foorm.type', 'number')
          .annotate('foorm.order', 2)
          .annotate('expect.min', { minValue: 1, message: 'At least 1' })
          .annotate('expect.max', { maxValue: 100, message: 'At most 100' })
          .optional().$type
      )
      .annotate('foorm.title', 'Settings')
      .annotate('foorm.order', 5).$type
  )
  .prop(
    'contacts',
    $('array')
      .of(
        $('union')
          .item(
            $('object')
              .prop(
                'fullName',
                $()
                  .designType('string')
                  .tags('string')
                  .annotate('meta.label', 'Full Name')
                  .annotate('meta.placeholder', 'Jane Doe')
                  .annotate('foorm.type', 'text')
                  .annotate('meta.required', { message: 'Name is required' }).$type
              )
              .prop(
                'email',
                $()
                  .designType('string')
                  .tags('email', 'string')
                  .annotate('meta.label', 'Email')
                  .annotate('meta.placeholder', 'jane@example.com')
                  .annotate('foorm.type', 'text')
                  .annotate(
                    'expect.pattern',
                    {
                      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
                      flags: '',
                      message: 'Invalid email format.',
                    },
                    true
                  )
                  .optional().$type
              )
              .prop(
                'phone',
                $()
                  .designType('string')
                  .tags('string')
                  .annotate('meta.label', 'Phone')
                  .annotate('meta.placeholder', '+1 555 0123')
                  .annotate('foorm.type', 'text')
                  .optional().$type
              ).$type
          )
          .item($().designType('string').tags('string').$type).$type
      )
      .annotate('meta.label', 'Contacts')
      .annotate('foorm.title', 'Contacts')
      .annotate('foorm.order', 6)
      .annotate('foorm.array.add.label', 'Add contact').$type
  )
  .prop(
    'category',
    $()
      .designType('string')
      .tags('select', 'foorm')
      .annotate('meta.label', 'Category')
      .annotate('meta.placeholder', 'Pick a category')
      .annotate('foorm.fn.options', '(v, data, context) => context.categoryOptions || []')
      .annotate('foorm.order', 7)
      .optional().$type
  )
  .prop(
    'summary',
    $()
      .designType('phantom')
      .tags('paragraph', 'foorm')
      .annotate(
        'foorm.fn.value',
        '(v, data) => data.name ? "Project: " + data.name + " (" + (data.tags || []).length + " tags, " + (data.addresses || []).length + " addresses)" : "Enter a project name to see a summary."'
      )
      .annotate('foorm.order', 8).$type
  )
  .prop(
    'clearAction',
    $()
      .designType('phantom')
      .tags('action', 'foorm')
      .annotate('meta.label', 'Clear All Arrays')
      .annotate('foorm.altAction', { id: 'clear-arrays' })
      .annotate('foorm.order', 9).$type
  )
  .annotate('foorm.title', 'Array Examples')
  .annotate('foorm.submit.text', 'Save')

$('object', Address)
  .prop(
    'street',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'Street1')
      .annotate('meta.placeholder', '123 Main St')
      .annotate('foorm.type', 'text')
      .annotate('meta.required', { message: 'Street is required' }).$type
  )
  .prop(
    'city',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'City')
      .annotate('meta.placeholder', 'New York')
      .annotate('foorm.type', 'text')
      .annotate('meta.required', { message: 'City is required' }).$type
  )
  .prop(
    'zip',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'ZIP')
      .annotate('meta.placeholder', '10001')
      .annotate('foorm.type', 'text')
      .optional().$type
  )
  .annotate('foorm.title', 'Address')

$('object', ArrayFormCustom)
  .prop(
    'instructions',
    $()
      .designType('phantom')
      .tags('paragraph', 'foorm')
      .annotate('foorm.component', 'CustomParagraph')
      .annotate('foorm.value', 'Manage your project arrays below.')
      .annotate('foorm.order', 0).$type
  )
  .prop(
    'name',
    $()
      .designType('string')
      .tags('string')
      .annotate('meta.label', 'Name')
      .annotate('meta.placeholder', 'Project name')
      .annotate('foorm.type', 'text')
      .annotate('meta.required', { message: 'Name is required' })
      .annotate('foorm.order', 1).$type
  )
  .prop(
    'tags',
    $('array')
      .of($().designType('string').tags('string').$type)
      .annotate('meta.label', 'Tags')
      .annotate('foorm.order', 2)
      .annotate('foorm.array.add.label', 'Add tag')
      .annotate('foorm.array.remove.label', 'x')
      .annotate('expect.maxLength', { length: 5, message: 'Maximum 5 tags' }).$type
  )
  .prop(
    'scores',
    $('array')
      .of($().designType('number').tags('number').$type)
      .annotate('meta.label', 'Scores')
      .annotate('foorm.order', 3)
      .annotate('foorm.array.add.label', 'Add score')
      .annotate('expect.minLength', { length: 1, message: 'At least one score required' })
      .annotate('expect.maxLength', { length: 10, message: 'Maximum 10 scores' }).$type
  )
  .prop(
    'addresses',
    $('array')
      .of($().refTo(Address).annotate('foorm.title', 'Address').$type)
      .annotate('meta.label', 'Addresses')
      .annotate('foorm.order', 4)
      .annotate('foorm.array.add.label', 'Add address')
      .annotate('foorm.array.remove.label', 'Remove address').$type
  )
  .prop(
    'settings',
    $('object')
      .prop(
        'emailNotify',
        $()
          .designType('boolean')
          .tags('checkbox', 'foorm')
          .annotate('meta.label', 'Notify by email')
          .annotate('foorm.order', 1).$type
      )
      .prop(
        'pageSize',
        $()
          .designType('number')
          .tags('number')
          .annotate('meta.label', 'Max items per page')
          .annotate('foorm.type', 'number')
          .annotate('foorm.order', 2)
          .annotate('expect.min', { minValue: 1, message: 'At least 1' })
          .annotate('expect.max', { maxValue: 100, message: 'At most 100' })
          .optional().$type
      )
      .annotate('foorm.title', 'Settings')
      .annotate('foorm.order', 5).$type
  )
  .prop(
    'contacts',
    $('array')
      .of(
        $('union')
          .item(
            $('object')
              .prop(
                'fullName',
                $()
                  .designType('string')
                  .tags('string')
                  .annotate('meta.label', 'Full Name')
                  .annotate('meta.placeholder', 'Jane Doe')
                  .annotate('foorm.type', 'text')
                  .annotate('meta.required', { message: 'Name is required' }).$type
              )
              .prop(
                'email',
                $()
                  .designType('string')
                  .tags('email', 'string')
                  .annotate('meta.label', 'Email')
                  .annotate('meta.placeholder', 'jane@example.com')
                  .annotate('foorm.type', 'text')
                  .annotate(
                    'expect.pattern',
                    {
                      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
                      flags: '',
                      message: 'Invalid email format.',
                    },
                    true
                  )
                  .optional().$type
              )
              .prop(
                'phone',
                $()
                  .designType('string')
                  .tags('string')
                  .annotate('meta.label', 'Phone')
                  .annotate('meta.placeholder', '+1 555 0123')
                  .annotate('foorm.type', 'text')
                  .optional().$type
              ).$type
          )
          .item($().designType('string').tags('string').$type).$type
      )
      .annotate('meta.label', 'Contacts')
      .annotate('foorm.title', 'Contacts')
      .annotate('foorm.order', 6)
      .annotate('foorm.array.add.label', 'Add contact').$type
  )
  .prop(
    'category',
    $()
      .designType('string')
      .tags('select', 'foorm')
      .annotate('meta.label', 'Category')
      .annotate('meta.placeholder', 'Pick a category')
      .annotate('foorm.fn.options', '(v, data, context) => context.categoryOptions || []')
      .annotate('foorm.order', 7)
      .optional().$type
  )
  .prop(
    'summary',
    $()
      .designType('phantom')
      .tags('paragraph', 'foorm')
      .annotate('foorm.component', 'CustomParagraph')
      .annotate(
        'foorm.fn.value',
        '(v, data) => data.name ? "Project: " + data.name + " (" + (data.tags || []).length + " tags, " + (data.addresses || []).length + " addresses)" : "Enter a project name to see a summary."'
      )
      .annotate('foorm.order', 8).$type
  )
  .prop(
    'clearAction',
    $()
      .designType('phantom')
      .tags('action', 'foorm')
      .annotate('foorm.component', 'CustomActionButton')
      .annotate('meta.label', 'Clear All Arrays')
      .annotate('foorm.altAction', { id: 'clear-arrays' })
      .annotate('foorm.order', 9).$type
  )
  .annotate('foorm.title', 'Array Examples')
  .annotate('foorm.submit.text', 'Save')

// prettier-ignore-end
