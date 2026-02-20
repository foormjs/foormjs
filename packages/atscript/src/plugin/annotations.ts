import type { AtscriptDoc, TAnnotationsTree, TMessages, Token } from '@atscript/core'
import {
  AnnotationSpec,
  isArray,
  isInterface,
  isPrimitive,
  isRef,
  isStructure,
} from '@atscript/core'

/**
 * Attempts to compile a function string with `new Function` and returns
 * diagnostic errors if it fails. Used by @foorm.fn.* and @foorm.validate
 * annotation validate hooks.
 */
function validateFnString(
  fnStr: string,
  range: { start: { line: number; character: number }; end: { line: number; character: number } }
): TMessages | undefined {
  try {
    // eslint-disable-next-line no-new-func
    new Function('v', 'data', 'context', 'entry', `return (${fnStr})(v, data, context, entry)`)
  } catch (error) {
    return [
      {
        severity: 1,
        message: `Invalid function string: ${(error as Error).message}`,
        range,
      },
    ]
  }
  return undefined
}

/**
 * Validates that @foorm.title / @foorm.fn.title is only applied to
 * interface/type nodes, or to prop nodes whose resolved type is object or array.
 */
function validateTitleTarget(
  mainToken: Token,
  _args: Token[],
  doc: AtscriptDoc
): TMessages | undefined {
  const node = mainToken.parentNode
  if (!node || node.entity === 'interface' || node.entity === 'type') return undefined
  let definition = node.getDefinition()
  if (isRef(definition) && definition.id) {
    definition = doc.unwindType(definition.id)?.def || definition
  }
  if (isInterface(definition) || isArray(definition) || isStructure(definition)) return undefined
  if (isPrimitive(definition) && (definition.type === 'object' || definition.type === 'array'))
    return undefined
  return [
    {
      severity: 1,
      message: '@foorm.title can only be applied to object or array fields.',
      range: mainToken.range,
    },
  ]
}

function fnAnnotation(description: string): AnnotationSpec {
  return new AnnotationSpec({
    description,
    nodeType: ['prop', 'type'],
    argument: {
      name: 'fn',
      type: 'string',
      description: 'JS function string: (value, data, context, entry) => result',
    },
    validate(token, args) {
      if (args[0]) {
        return validateFnString(args[0].text, args[0].range)
      }
      return undefined
    },
  })
}

function fnTopAnnotation(description: string): AnnotationSpec {
  return new AnnotationSpec({
    description,
    nodeType: ['interface', 'type'],
    argument: {
      name: 'fn',
      type: 'string',
      description: 'JS function string: (data, context) => result',
    },
    validate(token, args) {
      if (args[0]) {
        return validateFnString(args[0].text, args[0].range)
      }
      return undefined
    },
  })
}

export const annotations: TAnnotationsTree = {
  foorm: {
    // ── Form-level static annotations ────────────────────────
    title: new AnnotationSpec({
      description: 'Static title for the form or a nested group/array section',
      nodeType: ['interface', 'type', 'prop'],
      argument: {
        name: 'title',
        type: 'string',
        description: 'The title text',
      },
      validate: validateTitleTarget,
    }),

    submit: {
      text: new AnnotationSpec({
        description: 'Static submit button text',
        nodeType: ['interface', 'type'],
        argument: {
          name: 'text',
          type: 'string',
          description: 'Submit button label',
        },
      }),
      disabled: new AnnotationSpec({
        description: 'Statically disable the submit button',
        nodeType: ['interface', 'type'],
      }),
    },

    // ── Field-level static annotations ───────────────────────
    type: new AnnotationSpec({
      description: 'Field input type',
      nodeType: ['prop', 'type'],
      argument: {
        name: 'type',
        type: 'string',
        values: [
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
        ],
        description: 'The input type for this field',
      },
    }),

    component: new AnnotationSpec({
      description: 'Named component override for rendering this field or type',
      nodeType: ['prop', 'interface', 'type'],
      argument: {
        name: 'name',
        type: 'string',
        description: 'Component name from the components registry',
      },
    }),

    autocomplete: new AnnotationSpec({
      description: 'HTML autocomplete attribute value',
      nodeType: ['prop', 'type'],
      argument: {
        name: 'value',
        type: 'string',
        description: 'Autocomplete value (e.g., "email", "given-name")',
      },
    }),

    altAction: new AnnotationSpec({
      description: 'Alternate action for this field',
      nodeType: ['prop', 'type'],
      argument: [
        {
          name: 'id',
          type: 'string',
          description: 'The action name emitted on trigger',
        },
        {
          name: 'label',
          type: 'string',
          optional: true,
          description: 'Display label for the action (falls back to @meta.label)',
        },
      ],
    }),

    value: new AnnotationSpec({
      description: 'Default value for this field',
      nodeType: ['prop', 'type'],
      argument: {
        name: 'value',
        type: 'string',
        description: 'Default value (parsed by field type at runtime)',
      },
    }),

    order: new AnnotationSpec({
      description: 'Explicit rendering order for this field',
      nodeType: ['prop', 'type'],
      argument: {
        name: 'order',
        type: 'number',
        description: 'Numeric order (lower = earlier)',
      },
    }),

    hidden: new AnnotationSpec({
      description: 'Statically mark this field as hidden',
      nodeType: ['prop', 'type'],
    }),

    disabled: new AnnotationSpec({
      description: 'Statically mark this field as disabled',
      nodeType: ['prop', 'type'],
    }),

    readonly: new AnnotationSpec({
      description: 'Statically mark this field as readonly',
      nodeType: ['prop', 'type'],
    }),

    // ── Options annotation ──────────────────────────────────
    options: new AnnotationSpec({
      description:
        'Static option for select/radio fields. Repeat for each option. Label is the display text, value is the key (defaults to label).',
      nodeType: ['prop', 'type'],
      multiple: true,
      mergeStrategy: 'replace',
      argument: [
        {
          name: 'label',
          type: 'string',
          description: 'Display label for the option',
        },
        {
          name: 'value',
          type: 'string',
          optional: true,
          description: 'Value/key for the option (defaults to label if omitted)',
        },
      ],
    }),

    // ── Custom attributes/props annotation ──────────────────
    attr: new AnnotationSpec({
      description:
        'Custom attribute or component prop. Repeat for each attr. Passed to rendered component via v-bind.',
      nodeType: ['prop', 'type'],
      multiple: true,
      mergeStrategy: 'replace',
      argument: [
        {
          name: 'name',
          type: 'string',
          description: 'Attribute/prop name (e.g., "data-testid", "variant", "size")',
        },
        {
          name: 'value',
          type: 'string',
          description: 'Static value (string, number, boolean, or undefined)',
        },
      ],
    }),

    // ── Validation annotation ────────────────────────────────
    validate: new AnnotationSpec({
      description:
        'Custom JS validator function string. Returns true for pass, or an error message string.',
      nodeType: ['prop', 'type'],
      multiple: true,
      mergeStrategy: 'append',
      argument: {
        name: 'fn',
        type: 'string',
        description: 'JS function string: (value, data, context, entry) => boolean | string',
      },
      validate(token, args) {
        if (args[0]) {
          return validateFnString(args[0].text, args[0].range)
        }
        return undefined
      },
    }),

    // ── Array annotations ──────────────────────────────────
    array: {
      add: {
        label: new AnnotationSpec({
          description: 'Label for the add-item button (default: "Add item")',
          nodeType: ['prop'],
          argument: {
            name: 'label',
            type: 'string',
            description: 'Button label text',
          },
        }),
      },
      remove: {
        label: new AnnotationSpec({
          description: 'Label for the remove-item button (default: "Remove")',
          nodeType: ['prop'],
          argument: {
            name: 'label',
            type: 'string',
            description: 'Button label text',
          },
        }),
      },
      sortable: new AnnotationSpec({
        description: 'Enable drag-to-reorder for array items (future feature)',
        nodeType: ['prop'],
      }),
    },

    // ── Computed (fn) annotations ────────────────────────────
    fn: {
      // Form/group-level computed
      title: new AnnotationSpec({
        description:
          'Computed title for the form or a nested group/array: (data, context) => string',
        nodeType: ['interface', 'type', 'prop'],
        argument: {
          name: 'fn',
          type: 'string',
          description: 'JS function string: (data, context) => result',
        },
        validate(mainToken, args, doc) {
          const fnErrors = args[0] ? validateFnString(args[0].text, args[0].range) : undefined
          const targetErrors = validateTitleTarget(mainToken, args, doc)
          if (fnErrors && targetErrors) return [...fnErrors, ...targetErrors]
          return fnErrors || targetErrors
        },
      }),
      submit: {
        text: fnTopAnnotation('Computed submit button text: (data, context) => string'),
        disabled: fnTopAnnotation('Computed submit disabled state: (data, context) => boolean'),
      },

      // Field-level computed
      label: fnAnnotation('Computed label: (value, data, context, entry) => string'),
      description: fnAnnotation('Computed description: (value, data, context, entry) => string'),
      hint: fnAnnotation('Computed hint: (value, data, context, entry) => string'),
      placeholder: fnAnnotation('Computed placeholder: (value, data, context, entry) => string'),
      disabled: fnAnnotation('Computed disabled state: (value, data, context, entry) => boolean'),
      hidden: fnAnnotation('Computed hidden state: (value, data, context, entry) => boolean'),
      readonly: fnAnnotation('Computed readonly state: (value, data, context, entry) => boolean'),
      optional: fnAnnotation('Computed optional state: (value, data, context, entry) => boolean'),
      value: fnAnnotation('Computed default value: (value, data, context, entry) => any'),
      classes: fnAnnotation(
        'Computed CSS classes: (value, data, context, entry) => string | Record<string, boolean>'
      ),
      styles: fnAnnotation(
        'Computed inline styles: (value, data, context, entry) => string | Record<string, string>'
      ),
      options: fnAnnotation(
        'Computed select/radio options: (value, data, context, entry) => Array'
      ),
      attr: new AnnotationSpec({
        description:
          'Computed custom attribute/prop. Name is the attribute/prop name, fn returns the value.',
        nodeType: ['prop', 'type'],
        multiple: true,
        mergeStrategy: 'replace',
        argument: [
          {
            name: 'name',
            type: 'string',
            description: 'Attribute/prop name (e.g., "data-testid", "variant", "size")',
          },
          {
            name: 'fn',
            type: 'string',
            description: 'JS function string: (value, data, context, entry) => any',
          },
        ],
        validate(_token, args) {
          if (args[1]) {
            return validateFnString(args[1].text, args[1].range)
          }
          return undefined
        },
      }),
    },
  },
}
