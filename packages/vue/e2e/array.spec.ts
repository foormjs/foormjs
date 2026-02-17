import { test, expect, type Page, type Locator } from '@playwright/test'

/** The array form is the third form on the page. */
function getForm(page: Page): Locator {
  return page.locator('form').nth(2)
}

/** Selector matching both object and scalar array items. */
const ITEM = '.oo-array-item, .oo-array-scalar-row'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.locator('form').nth(2).waitFor()
})

// ── Array Form Structure ──────────────────────────────────────────

test.describe('Array Form Structure', () => {
  test('renders form title', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator('h2')).toHaveText('Array Examples')
  })

  test('renders submit button', async ({ page }) => {
    const form = getForm(page)
    await expect(form.getByRole('button', { name: 'Save' })).toBeVisible()
  })

  test('renders name text field', async ({ page }) => {
    const form = getForm(page)
    const nameInput = form.locator('input[name="name"]')
    await expect(nameInput).toBeVisible()
    await expect(nameInput).toHaveAttribute('placeholder', 'Project name')
  })

  test('renders add buttons for all arrays', async ({ page }) => {
    const form = getForm(page)
    await expect(form.getByRole('button', { name: 'Add tag' })).toBeVisible()
    await expect(form.getByRole('button', { name: 'Add score' })).toBeVisible()
    await expect(form.getByRole('button', { name: 'Add address' })).toBeVisible()
  })

  test('arrays start empty', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator(ITEM)).toHaveCount(0)
  })
})

// ── String Array (Tags) ──────────────────────────────────────────

test.describe('String Array — Tags', () => {
  test('add button creates a text input', async ({ page }) => {
    const form = getForm(page)
    await form.getByRole('button', { name: 'Add tag' }).click()
    await expect(form.locator('.oo-array-scalar-input').first()).toBeVisible()
    await expect(form.locator('.oo-array-scalar-input').first()).toHaveAttribute('type', 'text')
  })

  test('primitive item renders inline with remove button', async ({ page }) => {
    const form = getForm(page)
    await form.getByRole('button', { name: 'Add tag' }).click()

    const row = form.locator('.oo-array-scalar-row').first()
    await expect(row.locator('.oo-array-scalar-input')).toBeVisible()
    await expect(row.locator('.oo-array-remove-btn')).toBeVisible()
  })

  test('can add multiple items', async ({ page }) => {
    const form = getForm(page)
    const addBtn = form.getByRole('button', { name: 'Add tag' })

    await addBtn.click()
    await addBtn.click()
    await addBtn.click()

    const tagsArray = form.locator('.oo-array').first()
    await expect(tagsArray.locator('.oo-array-scalar-row')).toHaveCount(3)
  })

  test('can type into scalar inputs', async ({ page }) => {
    const form = getForm(page)
    const addBtn = form.getByRole('button', { name: 'Add tag' })

    await addBtn.click()
    await addBtn.click()

    const inputs = form.locator('.oo-array').first().locator('.oo-array-scalar-input')
    await inputs.first().fill('vue')
    await inputs.nth(1).fill('typescript')

    await expect(inputs.first()).toHaveValue('vue')
    await expect(inputs.nth(1)).toHaveValue('typescript')
  })

  test('remove button removes an item', async ({ page }) => {
    const form = getForm(page)
    const tagsArray = form.locator('.oo-array').first()
    const addBtn = form.getByRole('button', { name: 'Add tag' })

    await addBtn.click()
    await addBtn.click()
    await expect(tagsArray.locator('.oo-array-scalar-row')).toHaveCount(2)

    await tagsArray.locator('.oo-array-remove-btn').first().click()
    await expect(tagsArray.locator('.oo-array-scalar-row')).toHaveCount(1)
  })

  test('enforces maxLength of 5', async ({ page }) => {
    const form = getForm(page)
    const addBtn = form.getByRole('button', { name: 'Add tag' })

    for (let i = 0; i < 5; i++) {
      await addBtn.click()
    }

    const tagsArray = form.locator('.oo-array').first()
    await expect(tagsArray.locator('.oo-array-scalar-row')).toHaveCount(5)

    // Add button should be disabled at maxLength
    await expect(addBtn).toBeDisabled()
  })

  test('add re-enables after removing when at maxLength', async ({ page }) => {
    const form = getForm(page)
    const addBtn = form.getByRole('button', { name: 'Add tag' })
    const tagsArray = form.locator('.oo-array').first()

    for (let i = 0; i < 5; i++) {
      await addBtn.click()
    }
    await expect(addBtn).toBeDisabled()

    await tagsArray.locator('.oo-array-remove-btn').first().click()
    await expect(addBtn).toBeEnabled()
  })
})

// ── Number Array (Scores) ─────────────────────────────────────────

test.describe('Number Array — Scores', () => {
  test('add button creates a number input', async ({ page }) => {
    const form = getForm(page)
    await form.getByRole('button', { name: 'Add score' }).click()

    const scoresArray = form.locator('.oo-array').nth(1)
    const input = scoresArray.locator('.oo-array-scalar-input').first()
    await expect(input).toBeVisible()
    await expect(input).toHaveAttribute('type', 'number')
  })

  test('can type numbers into score inputs', async ({ page }) => {
    const form = getForm(page)
    await form.getByRole('button', { name: 'Add score' }).click()

    const scoresArray = form.locator('.oo-array').nth(1)
    const input = scoresArray.locator('.oo-array-scalar-input').first()
    await input.fill('95')
    await expect(input).toHaveValue('95')
  })
})

// ── Object Array (Addresses) ──────────────────────────────────────

test.describe('Object Array — Addresses', () => {
  test('renders group title', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator('.oo-group-title').filter({ hasText: 'Addresses' })).toBeVisible()
  })

  test('add creates item with sub-fields', async ({ page }) => {
    const form = getForm(page)
    await form.getByRole('button', { name: 'Add address' }).click()

    const addressArray = form.locator('.oo-array').nth(2)
    const item = addressArray.locator('.oo-array-item').first()
    await expect(item).toBeVisible()

    await expect(item.locator('input[name="street"]')).toBeVisible()
    await expect(item.locator('input[name="city"]')).toBeVisible()
    await expect(item.locator('input[name="zip"]')).toBeVisible()
  })

  test('sub-field placeholders render correctly', async ({ page }) => {
    const form = getForm(page)
    await form.getByRole('button', { name: 'Add address' }).click()

    const addressArray = form.locator('.oo-array').nth(2)
    const item = addressArray.locator('.oo-array-item').first()

    await expect(item.locator('input[name="street"]')).toHaveAttribute('placeholder', '123 Main St')
    await expect(item.locator('input[name="city"]')).toHaveAttribute('placeholder', 'New York')
    await expect(item.locator('input[name="zip"]')).toHaveAttribute('placeholder', '10001')
  })

  test('sub-field labels render', async ({ page }) => {
    const form = getForm(page)
    await form.getByRole('button', { name: 'Add address' }).click()

    const addressArray = form.locator('.oo-array').nth(2)
    const item = addressArray.locator('.oo-array-item').first()

    await expect(item.locator('label').filter({ hasText: 'Street' })).toBeVisible()
    await expect(item.locator('label').filter({ hasText: 'City' })).toBeVisible()
    await expect(item.locator('label').filter({ hasText: 'ZIP' })).toBeVisible()
  })

  test('can fill sub-fields', async ({ page }) => {
    const form = getForm(page)
    await form.getByRole('button', { name: 'Add address' }).click()

    const addressArray = form.locator('.oo-array').nth(2)
    const item = addressArray.locator('.oo-array-item').first()

    await item.locator('input[name="street"]').fill('742 Evergreen Terrace')
    await item.locator('input[name="city"]').fill('Springfield')
    await item.locator('input[name="zip"]').fill('62704')

    await expect(item.locator('input[name="street"]')).toHaveValue('742 Evergreen Terrace')
    await expect(item.locator('input[name="city"]')).toHaveValue('Springfield')
    await expect(item.locator('input[name="zip"]')).toHaveValue('62704')
  })

  test('can add multiple address items', async ({ page }) => {
    const form = getForm(page)
    const addBtn = form.getByRole('button', { name: 'Add address' })
    const addressArray = form.locator('.oo-array').nth(2)

    await addBtn.click()
    await addBtn.click()

    await expect(addressArray.locator('.oo-array-item')).toHaveCount(2)

    const firstItem = addressArray.locator('.oo-array-item').first()
    const secondItem = addressArray.locator('.oo-array-item').nth(1)
    await firstItem.locator('input[name="street"]').fill('Address 1')
    await secondItem.locator('input[name="street"]').fill('Address 2')

    await expect(firstItem.locator('input[name="street"]')).toHaveValue('Address 1')
    await expect(secondItem.locator('input[name="street"]')).toHaveValue('Address 2')
  })

  test('remove button removes correct item', async ({ page }) => {
    const form = getForm(page)
    const addBtn = form.getByRole('button', { name: 'Add address' })
    const addressArray = form.locator('.oo-array').nth(2)

    await addBtn.click()
    await addBtn.click()

    const firstItem = addressArray.locator('.oo-array-item').first()
    const secondItem = addressArray.locator('.oo-array-item').nth(1)
    await firstItem.locator('input[name="street"]').fill('First')
    await secondItem.locator('input[name="street"]').fill('Second')

    // Remove the first item
    await addressArray.locator('.oo-array-remove-btn').first().click()

    // Second item should now be first
    await expect(addressArray.locator('.oo-array-item')).toHaveCount(1)
    await expect(
      addressArray.locator('.oo-array-item').first().locator('input[name="street"]')
    ).toHaveValue('Second')
  })
})

// ── Nested Group (Settings) ──────────────────────────────────────

test.describe('Nested Group — Settings', () => {
  test('renders group title', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator('.oo-group-title').filter({ hasText: 'Settings' })).toBeVisible()
  })

  test('renders checkbox field', async ({ page }) => {
    const form = getForm(page)
    const checkbox = form.locator('input[name="emailNotify"]')
    await expect(checkbox).toBeVisible()
    await expect(checkbox).toHaveAttribute('type', 'checkbox')
  })

  test('checkbox toggles', async ({ page }) => {
    const form = getForm(page)
    const checkbox = form.locator('input[name="emailNotify"]')
    await expect(checkbox).not.toBeChecked()
    await checkbox.check()
    await expect(checkbox).toBeChecked()
  })

  test('renders number field', async ({ page }) => {
    const form = getForm(page)
    const pageSize = form.locator('input[name="pageSize"]')
    await expect(pageSize).toBeVisible()
    await expect(pageSize).toHaveAttribute('type', 'number')
  })
})

// ── Union Array (Contacts) ──────────────────────────────────────

test.describe('Union Array — Contacts', () => {
  test('renders group title', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator('.oo-group-title').filter({ hasText: 'Contacts' })).toBeVisible()
  })

  test('shows variant picker with two add buttons', async ({ page }) => {
    const form = getForm(page)
    const contactsSection = form.locator('.oo-array').last()
    const addButtons = contactsSection.locator('.oo-array-variant-picker .oo-array-add-btn')
    await expect(addButtons).toHaveCount(2)
  })

  test('add object variant creates item with sub-fields', async ({ page }) => {
    const form = getForm(page)
    const contactsSection = form.locator('.oo-array').last()
    const addButtons = contactsSection.locator('.oo-array-variant-picker .oo-array-add-btn')

    await addButtons.first().click()

    const item = contactsSection.locator('.oo-array-item').first()
    await expect(item).toBeVisible()

    // Should have variant selector and object sub-fields
    await expect(item.locator('.oo-array-variant-select')).toBeVisible()
    await expect(item.locator('input[name="fullName"]')).toBeVisible()
    await expect(item.locator('input[name="email"]')).toBeVisible()
    await expect(item.locator('input[name="phone"]')).toBeVisible()
  })

  test('add string variant creates scalar input with variant selector', async ({ page }) => {
    const form = getForm(page)
    const contactsSection = form.locator('.oo-array').last()
    const addButtons = contactsSection.locator('.oo-array-variant-picker .oo-array-add-btn')

    await addButtons.nth(1).click()

    const row = contactsSection.locator('.oo-array-scalar-row').first()
    await expect(row).toBeVisible()
    await expect(row.locator('.oo-array-scalar-input')).toBeVisible()
    await expect(row.locator('.oo-array-scalar-input')).toHaveAttribute('type', 'text')
    // Variant selector is still visible so user can switch back
    await expect(row.locator('.oo-array-variant-select')).toBeVisible()
  })

  test('can fill object variant sub-fields', async ({ page }) => {
    const form = getForm(page)
    const contactsSection = form.locator('.oo-array').last()
    const addButtons = contactsSection.locator('.oo-array-variant-picker .oo-array-add-btn')
    await addButtons.first().click()

    const item = contactsSection.locator('.oo-array-item').first()
    await item.locator('input[name="fullName"]').fill('Jane Doe')
    await item.locator('input[name="email"]').fill('jane@example.com')
    await item.locator('input[name="phone"]').fill('+1 555 0123')

    await expect(item.locator('input[name="fullName"]')).toHaveValue('Jane Doe')
    await expect(item.locator('input[name="email"]')).toHaveValue('jane@example.com')
    await expect(item.locator('input[name="phone"]')).toHaveValue('+1 555 0123')
  })

  test('variant selector switches between object and scalar', async ({ page }) => {
    const form = getForm(page)
    const contactsSection = form.locator('.oo-array').last()
    const addButtons = contactsSection.locator('.oo-array-variant-picker .oo-array-add-btn')

    // Add an object variant item
    await addButtons.first().click()
    const allItems = contactsSection.locator(ITEM)
    await expect(allItems.first().locator('input[name="fullName"]')).toBeVisible()

    // Switch to string variant
    await allItems.first().locator('.oo-array-variant-select').selectOption('1')
    await expect(contactsSection.locator('input[name="fullName"]')).toHaveCount(0)
    await expect(contactsSection.locator('.oo-array-scalar-input')).toBeVisible()

    // Switch back to object variant
    await contactsSection
      .locator(ITEM)
      .first()
      .locator('.oo-array-variant-select')
      .selectOption('0')
    await expect(contactsSection.locator('input[name="fullName"]')).toBeVisible()
    await expect(contactsSection.locator('.oo-array-scalar-input')).toHaveCount(0)
  })

  test('can mix object and scalar items', async ({ page }) => {
    const form = getForm(page)
    const contactsSection = form.locator('.oo-array').last()
    const addButtons = contactsSection.locator('.oo-array-variant-picker .oo-array-add-btn')

    // Add object, then string
    await addButtons.first().click()
    await addButtons.nth(1).click()

    const allItems = contactsSection.locator(ITEM)
    await expect(allItems).toHaveCount(2)

    // First item should be object (has fullName), second should be scalar
    await expect(allItems.first().locator('input[name="fullName"]')).toBeVisible()
    await expect(allItems.nth(1).locator('.oo-array-scalar-input')).toBeVisible()
  })

  test('remove works for union items', async ({ page }) => {
    const form = getForm(page)
    const contactsSection = form.locator('.oo-array').last()
    const addButtons = contactsSection.locator('.oo-array-variant-picker .oo-array-add-btn')

    await addButtons.first().click()
    await addButtons.nth(1).click()
    const allItems = contactsSection.locator(ITEM)
    await expect(allItems).toHaveCount(2)

    // Remove first item (object)
    await contactsSection.locator('.oo-array-remove-btn').first().click()
    await expect(contactsSection.locator(ITEM)).toHaveCount(1)

    // Remaining item should be the scalar one
    await expect(
      contactsSection.locator('.oo-array-scalar-row .oo-array-scalar-input')
    ).toBeVisible()
  })
})
