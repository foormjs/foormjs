import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.locator('form').waitFor()
})

// ── Form Structure ────────────────────────────────────────────────

test.describe('Form Structure', () => {
  test('renders computed form title with default value', async ({ page }) => {
    await expect(page.locator('h2')).toHaveText('User <unknown>')
  })

  test('renders submit button with static text', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Register' })).toHaveText('Register')
  })

  test('submit button is disabled when required fields are empty', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Register' })).toBeDisabled()
  })

  test('paragraph primitive renders description as <p>', async ({ page }) => {
    await expect(page.locator('p')).toHaveText('Please fill out this form')
  })

  test('paragraph does not render an input', async ({ page }) => {
    await expect(page.locator('input[name="info"]')).toHaveCount(0)
  })
})

// ── Computed Reactivity ───────────────────────────────────────────

test.describe('Computed Reactivity', () => {
  test('title updates when firstName changes', async ({ page }) => {
    await expect(page.locator('h2')).toHaveText('User <unknown>')
    await page.locator('input[name="firstName"]').fill('Alice')
    await expect(page.locator('h2')).toHaveText('User Alice')
  })

  test('title reverts when firstName is cleared', async ({ page }) => {
    await page.locator('input[name="firstName"]').fill('Bob')
    await expect(page.locator('h2')).toHaveText('User Bob')
    await page.locator('input[name="firstName"]').clear()
    await expect(page.locator('h2')).toHaveText('User <unknown>')
  })

  test('submit button enables when firstName and lastName are filled', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Register' })
    await expect(button).toBeDisabled()
    await page.locator('input[name="firstName"]').fill('Alice')
    await expect(button).toBeDisabled()
    await page.locator('input[name="lastName"]').fill('Smith')
    await expect(button).toBeEnabled()
  })

  test('computed placeholder updates based on other field', async ({ page }) => {
    const lastNameInput = page.locator('input[name="lastName"]')
    await expect(lastNameInput).toHaveAttribute('placeholder', 'Doe')
    await page.locator('input[name="firstName"]').fill('Alice')
    await expect(lastNameInput).toHaveAttribute('placeholder', 'Same as Alice?')
  })

  test('computed label updates based on other field', async ({ page }) => {
    const emailLabel = page
      .locator('.oo-default-field')
      .filter({ hasText: /Email/ })
      .locator('label')
    await expect(emailLabel).toHaveText('Email')
    await page.locator('input[name="firstName"]').fill('Alice')
    await expect(emailLabel).toHaveText('Alices Email')
  })

  test('computed description updates based on other field', async ({ page }) => {
    const emailField = page.locator('.oo-default-field').filter({ hasText: /Email/ })
    await expect(emailField.locator('span')).toHaveText('Your email address')
    await page.locator('input[name="firstName"]').fill('Alice')
    await expect(emailField.locator('span')).toHaveText('We will contact Alice here')
  })

  test('computed hint updates based on value and other fields', async ({ page }) => {
    const nicknameField = page.locator('.oo-default-field').filter({ hasText: 'Nickname' })
    await expect(nicknameField.locator('.oo-error-slot')).toHaveText('Choose a cool nickname')
    await page.locator('input[name="nickname"]').fill('CoolGuy')
    await expect(nicknameField.locator('.oo-error-slot')).toHaveText('Nice nickname, stranger!')
    await page.locator('input[name="firstName"]').fill('Alice')
    await expect(nicknameField.locator('.oo-error-slot')).toHaveText('Nice nickname, Alice!')
  })

  test('computed disabled reacts to form data', async ({ page }) => {
    const passwordField = page
      .locator('.oo-default-field')
      .filter({ has: page.locator('input[name="password"]') })
    await expect(passwordField).toHaveClass(/disabled/)
    await page.locator('input[name="firstName"]').fill('Alice')
    await page.locator('input[name="lastName"]').fill('Smith')
    await expect(passwordField).not.toHaveClass(/disabled/)
  })

  test('computed classes react to field value', async ({ page }) => {
    const styledField = page.locator('.oo-default-field').filter({ hasText: 'Styled Field' })
    await expect(styledField).toHaveClass(/empty-value/)
    await page.locator('input[name="styledField"]').fill('something')
    await expect(styledField).toHaveClass(/has-value/)
  })
})

// ── Static Annotations ────────────────────────────────────────────

test.describe('Static Annotations', () => {
  test('renders field labels', async ({ page }) => {
    for (const label of ['First Name', 'Last Name', 'Age', 'Password']) {
      await expect(page.locator('.oo-default-field label').filter({ hasText: label })).toBeVisible()
    }
  })

  test('renders field description', async ({ page }) => {
    const firstNameField = page.locator('.oo-default-field').filter({ hasText: 'First Name' })
    await expect(firstNameField.locator('span')).toHaveText('Your given name')
  })

  test('renders static placeholder', async ({ page }) => {
    await expect(page.locator('input[name="firstName"]')).toHaveAttribute('placeholder', 'John')
  })

  test('renders hint in error slot when no error', async ({ page }) => {
    const lastNameField = page.locator('.oo-default-field').filter({ hasText: 'Last Name' })
    await expect(lastNameField.locator('.oo-error-slot')).toHaveText('Real last name please')
  })

  test('renders autocomplete attribute', async ({ page }) => {
    await expect(page.locator('input[name="firstName"]')).toHaveAttribute(
      'autocomplete',
      'given-name'
    )
  })

  test('renders number type input', async ({ page }) => {
    await expect(page.locator('input[name="age"]')).toHaveAttribute('type', 'number')
  })

  test('renders password type input', async ({ page }) => {
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password')
  })

  test('statically disabled field has disabled class', async ({ page }) => {
    const disabledField = page.locator('.oo-default-field').filter({ hasText: 'Disabled Field' })
    await expect(disabledField).toHaveClass(/disabled/)
  })

  test('fields render in order', async ({ page }) => {
    const labels = await page.locator('.oo-default-field label').allTextContents()
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
    const firstNameInput = page.locator('input[name="firstName"]')
    await firstNameInput.focus()
    await firstNameInput.blur()
    const errorSlot = page
      .locator('.oo-default-field')
      .filter({ hasText: 'First Name' })
      .locator('.oo-error-slot')
    await expect(errorSlot).toHaveText('First name is required')
  })

  test('clears validation error when valid value entered', async ({ page }) => {
    const firstNameInput = page.locator('input[name="firstName"]')
    const errorSlot = page
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
    const ageInput = page.locator('input[name="age"]')
    const errorSlot = page
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
    const firstNameInput = page.locator('input[name="firstName"]')
    const field = page.locator('.oo-default-field').filter({ hasText: 'First Name' })

    await firstNameInput.focus()
    await firstNameInput.blur()
    await expect(field).toHaveClass(/error/)
  })
})

// ── Primitives & Actions ──────────────────────────────────────────

test.describe('Primitives and Actions', () => {
  test('action field renders with label', async ({ page }) => {
    await expect(page.getByText('Reset Password')).toBeVisible()
  })

  test('action field has no input element', async ({ page }) => {
    await expect(page.locator('input[name="resetAction"]')).toHaveCount(0)
  })

  test('action button emits action event on click', async ({ page }) => {
    const logs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') {logs.push(msg.text())}
    })
    await page.getByRole('button', { name: 'Reset Password' }).click()
    await page.waitForTimeout(100)
    expect(logs.some(l => l.includes('action') && l.includes('reset-password'))).toBe(true)
  })
})

// ── Select Fields ─────────────────────────────────────────────────

test.describe('Select Fields', () => {
  test('renders select with static options', async ({ page }) => {
    const select = page.locator('select[name="country"]')
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
    const placeholder = page.locator('select[name="country"] option').first()
    await expect(placeholder).toBeDisabled()
  })

  test('select option values match keys', async ({ page }) => {
    const options = page.locator('select[name="country"] option:not([disabled])')
    await expect(options.nth(0)).toHaveAttribute('value', 'us')
    await expect(options.nth(1)).toHaveAttribute('value', 'ca')
    await expect(options.nth(2)).toHaveAttribute('value', 'uk')
  })

  test('selecting an option updates the model', async ({ page }) => {
    const select = page.locator('select[name="country"]')
    await select.selectOption('ca')
    await expect(select).toHaveValue('ca')
  })

  test('renders select with context-driven options', async ({ page }) => {
    const citySelect = page.locator('select[name="city"]')
    await expect(citySelect).toBeVisible()
    // placeholder + 3 context options
    const options = citySelect.locator('option')
    await expect(options).toHaveCount(4)
    await expect(options.nth(1)).toHaveText('New York')
    await expect(options.nth(2)).toHaveText('Los Angeles')
    await expect(options.nth(3)).toHaveText('Chicago')
  })

  test('context-driven select option values match keys', async ({ page }) => {
    const options = page.locator('select[name="city"] option:not([disabled])')
    await expect(options.nth(0)).toHaveAttribute('value', 'nyc')
    await expect(options.nth(1)).toHaveAttribute('value', 'la')
    await expect(options.nth(2)).toHaveAttribute('value', 'chi')
  })
})

// ── Radio Fields ──────────────────────────────────────────────────

test.describe('Radio Fields', () => {
  test('renders radio group with options', async ({ page }) => {
    const radios = page.locator('input[name="gender"]')
    await expect(radios).toHaveCount(3)
  })

  test('radio options have correct values', async ({ page }) => {
    const radios = page.locator('input[name="gender"]')
    await expect(radios.nth(0)).toHaveAttribute('value', 'male')
    await expect(radios.nth(1)).toHaveAttribute('value', 'female')
    await expect(radios.nth(2)).toHaveAttribute('value', 'other')
  })

  test('radio labels display correctly', async ({ page }) => {
    const radioField = page.locator('.oo-radio-field').filter({ hasText: 'Gender' })
    const labels = radioField.locator('.oo-radio-group label')
    await expect(labels.nth(0)).toContainText('Male')
    await expect(labels.nth(1)).toContainText('Female')
    await expect(labels.nth(2)).toContainText('Other')
  })

  test('selecting a radio updates the model', async ({ page }) => {
    const femaleRadio = page.locator('input[name="gender"][value="female"]')
    await femaleRadio.check()
    await expect(femaleRadio).toBeChecked()
    // Other radios should be unchecked
    await expect(page.locator('input[name="gender"][value="male"]')).not.toBeChecked()
  })
})

// ── Checkbox Fields ───────────────────────────────────────────────

test.describe('Checkbox Fields', () => {
  test('renders checkbox with label', async ({ page }) => {
    const checkbox = page.locator('input[name="agreeToTerms"]')
    await expect(checkbox).toBeVisible()
    await expect(checkbox).toHaveAttribute('type', 'checkbox')
  })

  test('checkbox label text is correct', async ({ page }) => {
    const checkboxField = page.locator('.oo-checkbox-field')
    await expect(checkboxField.locator('label')).toContainText('I agree to terms and conditions')
  })

  test('checkbox toggles boolean value', async ({ page }) => {
    const checkbox = page.locator('input[name="agreeToTerms"]')
    await expect(checkbox).not.toBeChecked()
    await checkbox.check()
    await expect(checkbox).toBeChecked()
    await checkbox.uncheck()
    await expect(checkbox).not.toBeChecked()
  })
})
