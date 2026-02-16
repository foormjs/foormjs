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
          'Read-only paragraph text — rendered as static content, not an input field. Use @meta.label for the paragraph text.',
      },
    },
  },
}
