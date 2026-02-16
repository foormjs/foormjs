import type { TAtscriptConfig } from '@atscript/core'

export const primitives: TAtscriptConfig['primitives'] = {
  foorm: {
    type: 'phantom',
    isContainer: true,
    documentation: 'Non-data UI elements for form rendering',
    extensions: {
      action: {
        documentation:
          'Form action button — not a data field, excluded from form data. Use with @foorm.altAction to define alternate submit actions.',
      },
      paragraph: {
        documentation:
          'Read-only paragraph text — rendered as static content, not an input field. Use @foorm.value for static text or @foorm.fn.value for computed text.',
      },
      select: {
        type: 'string',
        documentation:
          'Dropdown select field. Use @foorm.options to define static choices or @foorm.fn.options for computed choices.',
      },
      radio: {
        type: 'string',
        documentation:
          'Radio button group. Use @foorm.options to define static choices or @foorm.fn.options for computed choices.',
      },
      checkbox: {
        type: 'boolean',
        documentation: 'Single boolean checkbox toggle.',
      },
    },
  },
}
