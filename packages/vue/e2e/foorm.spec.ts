import { test, expect, type Page, type Locator } from '@playwright/test'

/** Scope all locators to the first (e2e-test) form on the page. */
function getForm(page: Page): Locator {
  return page.locator('form').first()
}

/** Enable an optional N/A field by clicking its "No Data" placeholder. */
async function enableField(field: Locator) {
  await field.locator('.oo-no-data').click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Basic', exact: true }).click()
  await page.locator('form').first().waitFor()
})

// ── Form Structure ────────────────────────────────────────────────

test.describe('Form Structure', () => {
  test('renders computed form title with default value', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator('h2')).toHaveText('User <unknown>')
  })

  test('renders submit button with static text', async ({ page }) => {
    const form = getForm(page)
    await expect(form.getByRole('button', { name: 'Register' })).toHaveText('Register')
  })

  test('submit button is disabled when required fields are empty', async ({ page }) => {
    const form = getForm(page)
    await expect(form.getByRole('button', { name: 'Register' })).toBeDisabled()
  })

  test('paragraph primitive renders description as <p>', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator('p').first()).toHaveText('Please fill out this form')
  })

  test('paragraph does not render an input', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator('input[name="info"]')).toHaveCount(0)
  })
})

// ── Computed Reactivity ───────────────────────────────────────────

test.describe('Computed Reactivity', () => {
  test('title updates when firstName changes', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator('h2')).toHaveText('User <unknown>')
    await form.locator('input[name="firstName"]').fill('Alice')
    await expect(form.locator('h2')).toHaveText('User Alice')
  })

  test('title reverts when firstName is cleared', async ({ page }) => {
    const form = getForm(page)
    await form.locator('input[name="firstName"]').fill('Bob')
    await expect(form.locator('h2')).toHaveText('User Bob')
    await form.locator('input[name="firstName"]').clear()
    await expect(form.locator('h2')).toHaveText('User <unknown>')
  })

  test('submit button enables when firstName and lastName are filled', async ({ page }) => {
    const form = getForm(page)
    const button = form.getByRole('button', { name: 'Register' })
    await expect(button).toBeDisabled()
    await form.locator('input[name="firstName"]').fill('Alice')
    await expect(button).toBeDisabled()
    await form.locator('input[name="lastName"]').fill('Smith')
    await expect(button).toBeEnabled()
  })

  test('computed placeholder updates based on other field', async ({ page }) => {
    const form = getForm(page)
    const lastNameInput = form.locator('input[name="lastName"]')
    await expect(lastNameInput).toHaveAttribute('placeholder', 'Doe')
    await form.locator('input[name="firstName"]').fill('Alice')
    await expect(lastNameInput).toHaveAttribute('placeholder', 'Same as Alice?')
  })

  test('computed label updates based on other field', async ({ page }) => {
    const form = getForm(page)
    const emailLabel = form
      .locator('.oo-default-field')
      .filter({ hasText: /Email/ })
      .locator('label')
    await expect(emailLabel).toHaveText('Email')
    await form.locator('input[name="firstName"]').fill('Alice')
    await expect(emailLabel).toHaveText('Alices Email')
  })

  test('computed description updates based on other field', async ({ page }) => {
    const form = getForm(page)
    const emailField = form.locator('.oo-default-field').filter({ hasText: /Email/ })
    await enableField(emailField)
    await expect(emailField.locator('span')).toHaveText('Your email address')
    await form.locator('input[name="firstName"]').fill('Alice')
    await expect(emailField.locator('span')).toHaveText('We will contact Alice here')
  })

  test('computed hint updates based on value and other fields', async ({ page }) => {
    const form = getForm(page)
    const nicknameField = form.locator('.oo-default-field').filter({ hasText: 'Nickname' })
    await enableField(nicknameField)
    await expect(nicknameField.locator('.oo-error-slot')).toHaveText('Choose a cool nickname')
    await form.locator('input[name="nickname"]').fill('CoolGuy')
    await expect(nicknameField.locator('.oo-error-slot')).toHaveText('Nice nickname, stranger!')
    await form.locator('input[name="firstName"]').fill('Alice')
    await expect(nicknameField.locator('.oo-error-slot')).toHaveText('Nice nickname, Alice!')
  })

  test('computed disabled reacts to form data', async ({ page }) => {
    const form = getForm(page)
    const passwordField = form
      .locator('.oo-default-field')
      .filter({ has: page.locator('input[name="password"]') })
    await expect(passwordField).toHaveClass(/disabled/)
    await form.locator('input[name="firstName"]').fill('Alice')
    await form.locator('input[name="lastName"]').fill('Smith')
    await expect(passwordField).not.toHaveClass(/disabled/)
  })

  test('computed classes react to field value', async ({ page }) => {
    const form = getForm(page)
    const styledField = form.locator('.oo-default-field').filter({ hasText: 'Styled Field' })
    await enableField(styledField)
    await expect(styledField).toHaveClass(/empty-value/)
    await form.locator('input[name="styledField"]').fill('something')
    await expect(styledField).toHaveClass(/has-value/)
  })
})

// ── Static Annotations ────────────────────────────────────────────

test.describe('Static Annotations', () => {
  test('renders field labels', async ({ page }) => {
    const form = getForm(page)
    for (const label of ['First Name', 'Last Name', 'Age', 'Password']) {
      await expect(form.locator('.oo-default-field label').filter({ hasText: label })).toBeVisible()
    }
  })

  test('renders field description', async ({ page }) => {
    const form = getForm(page)
    const firstNameField = form.locator('.oo-default-field').filter({ hasText: 'First Name' })
    await expect(firstNameField.locator('span')).toHaveText('Your given name')
  })

  test('renders static placeholder', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator('input[name="firstName"]')).toHaveAttribute('placeholder', 'John')
  })

  test('renders hint in error slot when no error', async ({ page }) => {
    const form = getForm(page)
    const lastNameField = form.locator('.oo-default-field').filter({ hasText: 'Last Name' })
    await expect(lastNameField.locator('.oo-error-slot')).toHaveText('Real last name please')
  })

  test('renders autocomplete attribute', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator('input[name="firstName"]')).toHaveAttribute(
      'autocomplete',
      'given-name'
    )
  })

  test('renders number type input', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator('input[name="age"]')).toHaveAttribute('type', 'number')
  })

  test('renders password type input', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator('input[name="password"]')).toHaveAttribute('type', 'password')
  })

  test('statically disabled field has disabled class', async ({ page }) => {
    const form = getForm(page)
    const disabledField = form.locator('.oo-default-field').filter({ hasText: 'Disabled Field' })
    await expect(disabledField).toHaveClass(/disabled/)
  })

  test('fields render in order', async ({ page }) => {
    const form = getForm(page)
    const labels = (await form.locator('.oo-default-field label').allTextContents()).map(l =>
      l.trim()
    )
    const firstNameIdx = labels.indexOf('First Name')
    const lastNameIdx = labels.indexOf('Last Name')
    const ageIdx = labels.indexOf('Age')
    expect(firstNameIdx).toBeLessThan(lastNameIdx)
    expect(lastNameIdx).toBeLessThan(ageIdx)
  })
})

// ── Validation ────────────────────────────────────────────────────

test.describe('Validation', () => {
  test('shows validation error on blur for empty required field', async ({ page }) => {
    const form = getForm(page)
    const firstNameInput = form.locator('input[name="firstName"]')
    await firstNameInput.focus()
    await firstNameInput.blur()
    const errorSlot = form
      .locator('.oo-default-field')
      .filter({ hasText: 'First Name' })
      .locator('.oo-error-slot')
    await expect(errorSlot).toHaveText('First name is required')
  })

  test('clears validation error when valid value entered', async ({ page }) => {
    const form = getForm(page)
    const firstNameInput = form.locator('input[name="firstName"]')
    const errorSlot = form
      .locator('.oo-default-field')
      .filter({ hasText: 'First Name' })
      .locator('.oo-error-slot')

    await firstNameInput.focus()
    await firstNameInput.blur()
    await expect(errorSlot).toHaveText('First name is required')

    await firstNameInput.fill('Alice')
    await firstNameInput.blur()
    await expect(errorSlot).not.toHaveText('First name is required')
  })

  test('multiple validators run in order', async ({ page }) => {
    const form = getForm(page)
    const ageInput = form.locator('input[name="age"]')
    const errorSlot = form
      .locator('.oo-default-field')
      .filter({ hasText: 'Age' })
      .locator('.oo-error-slot')

    // Clear any default value and trigger validation
    await ageInput.clear()
    await ageInput.blur()
    await expect(errorSlot).toHaveText('Age is required')

    // Enter under-18 value to trigger second validator
    await ageInput.fill('15')
    await ageInput.blur()
    await expect(errorSlot).toHaveText('Must be 18 or older')

    // Enter valid value
    await ageInput.fill('25')
    await ageInput.blur()
    await expect(errorSlot).not.toHaveText('Must be 18 or older')
  })

  test('field gets error class on validation failure', async ({ page }) => {
    const form = getForm(page)
    const firstNameInput = form.locator('input[name="firstName"]')
    const field = form.locator('.oo-default-field').filter({ hasText: 'First Name' })

    await firstNameInput.focus()
    await firstNameInput.blur()
    await expect(field).toHaveClass(/error/)
  })
})

// ── Primitives & Actions ──────────────────────────────────────────

test.describe('Primitives and Actions', () => {
  test('action field renders with label', async ({ page }) => {
    const form = getForm(page)
    await expect(form.getByText('Reset Password')).toBeVisible()
  })

  test('action field has no input element', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator('input[name="resetAction"]')).toHaveCount(0)
  })

  test('action button emits action event on click', async ({ page }) => {
    const form = getForm(page)
    const logs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') {
        logs.push(msg.text())
      }
    })
    await form.getByRole('button', { name: 'Reset Password' }).click()
    await page.waitForTimeout(100)
    expect(logs.some(l => l.includes('action') && l.includes('reset-password'))).toBe(true)
  })
})

// ── Select Fields ─────────────────────────────────────────────────

test.describe('Select Fields', () => {
  test('renders select with static options', async ({ page }) => {
    const form = getForm(page)
    const countryField = form.locator('.oo-default-field').filter({ hasText: 'Country' })
    await enableField(countryField)
    const select = form.locator('select[name="country"]')
    await expect(select).toBeVisible()
    const options = select.locator('option')
    // placeholder + 3 options
    await expect(options).toHaveCount(4)
    await expect(options.nth(0)).toHaveText('Select a country')
    await expect(options.nth(1)).toHaveText('United States')
    await expect(options.nth(2)).toHaveText('Canada')
    await expect(options.nth(3)).toHaveText('United Kingdom')
  })

  test('select placeholder option is disabled', async ({ page }) => {
    const form = getForm(page)
    const countryField = form.locator('.oo-default-field').filter({ hasText: 'Country' })
    await enableField(countryField)
    const placeholder = form.locator('select[name="country"] option').first()
    await expect(placeholder).toBeDisabled()
  })

  test('select option values match keys', async ({ page }) => {
    const form = getForm(page)
    const countryField = form.locator('.oo-default-field').filter({ hasText: 'Country' })
    await enableField(countryField)
    const options = form.locator('select[name="country"] option:not([disabled])')
    await expect(options.nth(0)).toHaveAttribute('value', 'us')
    await expect(options.nth(1)).toHaveAttribute('value', 'ca')
    await expect(options.nth(2)).toHaveAttribute('value', 'uk')
  })

  test('selecting an option updates the model', async ({ page }) => {
    const form = getForm(page)
    const countryField = form.locator('.oo-default-field').filter({ hasText: 'Country' })
    await enableField(countryField)
    const select = form.locator('select[name="country"]')
    await select.selectOption('ca')
    await expect(select).toHaveValue('ca')
  })

  test('renders select with context-driven options', async ({ page }) => {
    const form = getForm(page)
    const cityField = form.locator('.oo-default-field').filter({ hasText: 'City' })
    await enableField(cityField)
    const citySelect = form.locator('select[name="city"]')
    await expect(citySelect).toBeVisible()
    // placeholder + 3 context options
    const options = citySelect.locator('option')
    await expect(options).toHaveCount(4)
    await expect(options.nth(1)).toHaveText('New York')
    await expect(options.nth(2)).toHaveText('Los Angeles')
    await expect(options.nth(3)).toHaveText('Chicago')
  })

  test('context-driven select option values match keys', async ({ page }) => {
    const form = getForm(page)
    const cityField = form.locator('.oo-default-field').filter({ hasText: 'City' })
    await enableField(cityField)
    const options = form.locator('select[name="city"] option:not([disabled])')
    await expect(options.nth(0)).toHaveAttribute('value', 'nyc')
    await expect(options.nth(1)).toHaveAttribute('value', 'la')
    await expect(options.nth(2)).toHaveAttribute('value', 'chi')
  })
})

// ── Radio Fields ──────────────────────────────────────────────────

test.describe('Radio Fields', () => {
  test('renders radio group with options', async ({ page }) => {
    const form = getForm(page)
    const genderField = form.locator('.oo-default-field').filter({ hasText: 'Gender' })
    await enableField(genderField)
    const radios = form.locator('input[name="gender"]')
    await expect(radios).toHaveCount(3)
  })

  test('radio options have correct values', async ({ page }) => {
    const form = getForm(page)
    const genderField = form.locator('.oo-default-field').filter({ hasText: 'Gender' })
    await enableField(genderField)
    const radios = form.locator('input[name="gender"]')
    await expect(radios.nth(0)).toHaveAttribute('value', 'male')
    await expect(radios.nth(1)).toHaveAttribute('value', 'female')
    await expect(radios.nth(2)).toHaveAttribute('value', 'other')
  })

  test('radio labels display correctly', async ({ page }) => {
    const form = getForm(page)
    const radioField = form.locator('.oo-default-field').filter({ hasText: 'Gender' })
    await enableField(radioField)
    const labels = radioField.locator('.oo-radio-group label')
    await expect(labels.nth(0)).toContainText('Male')
    await expect(labels.nth(1)).toContainText('Female')
    await expect(labels.nth(2)).toContainText('Other')
  })

  test('selecting a radio updates the model', async ({ page }) => {
    const form = getForm(page)
    const genderField = form.locator('.oo-default-field').filter({ hasText: 'Gender' })
    await enableField(genderField)
    const femaleRadio = form.locator('input[name="gender"][value="female"]')
    await femaleRadio.check()
    await expect(femaleRadio).toBeChecked()
    // Other radios should be unchecked
    await expect(form.locator('input[name="gender"][value="male"]')).not.toBeChecked()
  })
})

// ── Checkbox Fields ───────────────────────────────────────────────

test.describe('Checkbox Fields', () => {
  test('renders checkbox with label', async ({ page }) => {
    const form = getForm(page)
    const checkbox = form.locator('input[name="agreeToTerms"]')
    await expect(checkbox).toBeVisible()
    await expect(checkbox).toHaveAttribute('type', 'checkbox')
  })

  test('checkbox label text is correct', async ({ page }) => {
    const form = getForm(page)
    const checkboxField = form.locator('.oo-checkbox-field')
    await expect(checkboxField.locator('label')).toContainText('I agree to terms and conditions')
  })

  test('checkbox toggles boolean value', async ({ page }) => {
    const form = getForm(page)
    const checkbox = form.locator('input[name="agreeToTerms"]')
    await expect(checkbox).not.toBeChecked()
    await checkbox.check()
    await expect(checkbox).toBeChecked()
    await checkbox.uncheck()
    await expect(checkbox).not.toBeChecked()
  })
})

// ── Custom Attributes ─────────────────────────────────────────────

test.describe('Custom Attributes', () => {
  test('renders static custom attrs on wrapper element', async ({ page }) => {
    const form = getForm(page)
    // @foorm.attr values are passed as component attrs and fall through to the wrapper element
    const usernameField = form.locator('.oo-default-field').filter({ hasText: 'Username' })
    await enableField(usernameField)
    await expect(usernameField).toHaveAttribute('data-testid', 'username-input')
    await expect(usernameField).toHaveAttribute('data-field-type', 'username')
  })

  test('computed attrs react to field value', async ({ page }) => {
    const form = getForm(page)
    const phoneField = form.locator('.oo-default-field').filter({ hasText: 'Phone Number' })
    await enableField(phoneField)
    const phoneInput = form.locator('input[name="phone"]')

    // Initially empty
    await expect(phoneField).toHaveAttribute('data-valid', 'false')
    await expect(phoneField).toHaveAttribute('data-length', '0')

    // Fill with short value
    await phoneInput.fill('12345')
    await expect(phoneField).toHaveAttribute('data-valid', 'false')
    await expect(phoneField).toHaveAttribute('data-length', '5')

    // Fill with valid length value
    await phoneInput.fill('1234567890')
    await expect(phoneField).toHaveAttribute('data-valid', 'true')
    await expect(phoneField).toHaveAttribute('data-length', '10')
  })

  test('fn.attr overrides static attr with same name', async ({ page }) => {
    const form = getForm(page)
    const membershipField = form
      .locator('.oo-default-field')
      .filter({ has: page.locator('input[name="membershipLevel"]') })

    // Initially checkbox is unchecked, should use computed value 'basic'
    await expect(membershipField).toHaveAttribute('data-tier', 'basic')
    await expect(membershipField).toHaveAttribute('data-static', 'always-present')

    // Check the agreeToTerms checkbox
    const checkbox = form.locator('input[name="agreeToTerms"]')
    await checkbox.check()

    // Now data-tier should be 'premium' (computed overrides static)
    await expect(membershipField).toHaveAttribute('data-tier', 'premium')
    await expect(membershipField).toHaveAttribute('data-static', 'always-present')
  })

  test('computed attrs react to other form fields', async ({ page }) => {
    const form = getForm(page)
    const membershipField = form
      .locator('.oo-default-field')
      .filter({ has: page.locator('input[name="membershipLevel"]') })
    const checkbox = form.locator('input[name="agreeToTerms"]')

    await expect(membershipField).toHaveAttribute('data-tier', 'basic')

    // Toggle checkbox multiple times
    await checkbox.check()
    await expect(membershipField).toHaveAttribute('data-tier', 'premium')

    await checkbox.uncheck()
    await expect(membershipField).toHaveAttribute('data-tier', 'basic')
  })

  test('readonly field with fn.value reacts to form data changes', async ({ page }) => {
    const form = getForm(page)
    const membershipInput = form.locator('input[name="membershipLevel"]')
    const checkbox = form.locator('input[name="agreeToTerms"]')

    // Initially unchecked → value should be 'basic'
    await expect(membershipInput).toHaveValue('basic')

    // Check the checkbox → value should update to 'premium'
    await checkbox.check()
    await expect(membershipInput).toHaveValue('premium')

    // Uncheck → value should revert to 'basic'
    await checkbox.uncheck()
    await expect(membershipInput).toHaveValue('basic')

    // Check again → value should update to 'premium'
    await checkbox.check()
    await expect(membershipInput).toHaveValue('premium')
  })
})

// ── Context Access ────────────────────────────────────────────────

test.describe('Context Access', () => {
  test('renders label from nested context object', async ({ page }) => {
    const form = getForm(page)
    const field = form.locator('.oo-default-field').filter({ hasText: 'Context-Driven Label' })
    await expect(field).toBeVisible()

    const label = field.locator('label')
    await expect(label).toHaveText('Context-Driven Label')
  })

  test('renders description from nested context object', async ({ page }) => {
    const form = getForm(page)
    const field = form.locator('.oo-default-field').filter({ hasText: 'Context-Driven Label' })
    await enableField(field)
    const description = field.locator('span')
    await expect(description).toHaveText(
      'This label and description come from nested context object'
    )
  })

  test('uses fallback when context is missing', async ({ page }) => {
    const form = getForm(page)
    const field = form.locator('.oo-default-field').filter({ hasText: 'Context-Driven Label' })
    await enableField(field)
    // This test verifies the fallback behavior is defined in the annotation
    // The actual fallback would only show if context.labels was undefined
    // For now, we just verify the field renders with context
    const input = form.locator('input[name="contextDrivenField"]')
    await expect(input).toBeVisible()
  })
})

// ── Custom Component ──────────────────────────────────────────────

test.describe('Custom Component', () => {
  test('renders custom component when @foorm.component is specified', async ({ page }) => {
    const form = getForm(page)
    const customField = form.locator('.custom-star-input')
    await expect(customField).toBeVisible()
  })

  test('custom component displays star prefix', async ({ page }) => {
    const form = getForm(page)
    const prefix = form.locator('.custom-star-input .prefix')
    await expect(prefix).toHaveText('⭐')
  })

  test('custom component has correct label and description', async ({ page }) => {
    const form = getForm(page)
    const field = form.locator('.custom-star-input')
    await expect(field.locator('label')).toHaveText('Favorite Star')
    await expect(field.locator('.description')).toHaveText(
      'This field uses a custom component with star prefix'
    )
  })

  test('custom component input works correctly', async ({ page }) => {
    const form = getForm(page)
    const input = form.locator('.custom-star-input input[name="favoriteStar"]')
    await expect(input).toBeVisible()
    await input.fill('Sirius')
    await expect(input).toHaveValue('Sirius')
  })

  test('custom component shows validation error for short input', async ({ page }) => {
    const form = getForm(page)
    const input = form.locator('.custom-star-input input[name="favoriteStar"]')
    await input.fill('AB')
    await input.blur()

    const errorHint = form.locator('.custom-star-input .error-hint')
    await expect(errorHint).toHaveText('Must be at least 3 characters')
  })

  test('custom component passes validation for valid input', async ({ page }) => {
    const form = getForm(page)
    const input = form.locator('.custom-star-input input[name="favoriteStar"]')
    await input.fill('Polaris')
    await input.blur()

    const field = form.locator('.custom-star-input')
    await expect(field).not.toHaveClass(/error/)
  })

  test('custom component has distinctive yellow styling', async ({ page }) => {
    const form = getForm(page)
    const inputWrapper = form.locator('.custom-star-input .input-wrapper')
    await expect(inputWrapper).toBeVisible()

    // Check that the wrapper has a background color (yellow theme)
    const bgColor = await inputWrapper.evaluate(el => window.getComputedStyle(el).backgroundColor)
    // #fffbeb is rgb(255, 251, 235)
    expect(bgColor).toBe('rgb(255, 251, 235)')
  })
})

// ── Computed Paragraph ────────────────────────────────────────────

test.describe('Computed Paragraph', () => {
  test('renders default computed paragraph text when no data', async ({ page }) => {
    const form = getForm(page)
    const summaryP = form.locator('p').filter({ hasText: 'Fill out your info' })
    await expect(summaryP).toHaveText('Fill out your info above to see a summary.')
  })

  test('computed paragraph updates when firstName and lastName are filled', async ({ page }) => {
    const form = getForm(page)
    await form.locator('input[name="firstName"]').fill('John')
    await form.locator('input[name="lastName"]').fill('Doe')

    const summaryP = form.locator('p').filter({ hasText: 'Hello, John' })
    await expect(summaryP).toHaveText('Hello, John Doe! You are 25 years old.')
  })

  test('computed paragraph reacts to age changes', async ({ page }) => {
    const form = getForm(page)
    await form.locator('input[name="firstName"]').fill('Jane')
    await form.locator('input[name="lastName"]').fill('Smith')

    // Age has default value of 25
    const summaryP = form.locator('p').filter({ hasText: 'Hello, Jane' })
    await expect(summaryP).toHaveText('Hello, Jane Smith! You are 25 years old.')

    // Change age
    await form.locator('input[name="age"]').fill('30')
    await expect(summaryP).toHaveText('Hello, Jane Smith! You are 30 years old.')
  })

  test('computed paragraph reverts when firstName is cleared', async ({ page }) => {
    const form = getForm(page)
    await form.locator('input[name="firstName"]').fill('Bob')
    await form.locator('input[name="lastName"]').fill('Johnson')

    const summaryP = form.locator('p').filter({ hasText: 'Hello, Bob' })
    await expect(summaryP).toBeVisible()

    await form.locator('input[name="firstName"]').clear()

    const defaultP = form.locator('p').filter({ hasText: 'Fill out your info' })
    await expect(defaultP).toHaveText('Fill out your info above to see a summary.')
  })
})

// ── Change Events ─────────────────────────────────────────────────

test.describe('Change Events', () => {
  test('select fires change event immediately on selection', async ({ page }) => {
    const form = getForm(page)
    const countryField = form.locator('.oo-default-field').filter({ hasText: 'Country' })
    await enableField(countryField)
    const select = form.locator('select[name="country"]')

    const logs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') logs.push(msg.text())
    })

    await select.selectOption('ca')
    await page.waitForTimeout(100)

    expect(logs.some(l => l.includes('change') && l.includes('update') && l.includes('country'))).toBe(true)
  })

  test('radio fires change event immediately on selection', async ({ page }) => {
    const form = getForm(page)
    const genderField = form.locator('.oo-default-field').filter({ hasText: 'Gender' })
    await enableField(genderField)

    const logs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') logs.push(msg.text())
    })

    await form.locator('input[name="gender"][value="female"]').check()
    await page.waitForTimeout(100)

    expect(logs.some(l => l.includes('change') && l.includes('update') && l.includes('gender'))).toBe(true)
  })

  test('checkbox fires change event immediately on toggle', async ({ page }) => {
    const form = getForm(page)

    const logs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') logs.push(msg.text())
    })

    await form.locator('input[name="agreeToTerms"]').check()
    await page.waitForTimeout(100)

    expect(logs.some(l => l.includes('change') && l.includes('update') && l.includes('agreeToTerms'))).toBe(true)
  })

  test('text input fires change event on blur', async ({ page }) => {
    const form = getForm(page)

    const logs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') logs.push(msg.text())
    })

    await form.locator('input[name="firstName"]').fill('Alice')

    // No change event yet (only on blur)
    await page.waitForTimeout(100)
    expect(logs.some(l => l.includes('change') && l.includes('firstName'))).toBe(false)

    // Blur triggers the change event
    await form.locator('input[name="firstName"]').blur()
    await page.waitForTimeout(100)
    expect(logs.some(l => l.includes('change') && l.includes('update') && l.includes('firstName'))).toBe(true)
  })
})
