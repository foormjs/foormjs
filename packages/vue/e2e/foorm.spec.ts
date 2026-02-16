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
    const emailLabel = page.locator('.oo-default-field').filter({ hasText: /Email/ }).locator('label')
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
    const passwordField = page.locator('.oo-default-field').filter({ has: page.locator('input[name="password"]') })
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
      await expect(
        page.locator('.oo-default-field label').filter({ hasText: label })
      ).toBeVisible()
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
    await expect(page.locator('input[name="firstName"]')).toHaveAttribute('autocomplete', 'given-name')
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
      if (msg.type() === 'log') logs.push(msg.text())
    })
    await page.getByRole('button', { name: 'Reset Password' }).click()
    await page.waitForTimeout(100)
    expect(logs.some(l => l.includes('action') && l.includes('reset-password'))).toBe(true)
  })
})
