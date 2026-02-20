import { test, expect, type Page, type Locator } from '@playwright/test'

/** With tabs, only one form is visible at a time. */
function getForm(page: Page): Locator {
  return page.locator('form').first()
}

/** Primitive array items render as .oo-default-field (text/number inputs). */
const FIELD_ITEM = '.oo-default-field'

/** Object array items render as .oo-object. */
const OBJ_ITEM = '.oo-object'

/** Union array items render as .oo-union. */
const UNION_ITEM = '.oo-union'

/** Scalar variant input inside a union item (use from array/form context). */
const UNION_SCALAR = '.oo-union > .oo-default-field input'

/** Scalar input (use when already scoped to a .oo-union item). */
const SCALAR_INPUT = '.oo-default-field input'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Array', exact: true }).click()
  await page.locator('form').first().waitFor()
})

// ── Array Form Structure ──────────────────────────────────────────

test.describe('Array Form Structure', () => {
  test('renders form title', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator('.oo-form-title')).toHaveText('Array Examples')
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
    await expect(form.locator('.oo-array').first().locator(FIELD_ITEM)).toHaveCount(0)
    await expect(form.locator('.oo-array').nth(1).locator(FIELD_ITEM)).toHaveCount(0)
    await expect(form.locator('.oo-array').nth(2).locator(OBJ_ITEM)).toHaveCount(0)
    await expect(form.locator('.oo-array').last().locator(UNION_ITEM)).toHaveCount(0)
  })
})

// ── String Array (Tags) ──────────────────────────────────────────

test.describe('String Array — Tags', () => {
  test('add button creates a text input', async ({ page }) => {
    const form = getForm(page)
    await form.getByRole('button', { name: 'Add tag' }).click()

    const tagsArray = form.locator('.oo-array').first()
    const input = tagsArray.locator(FIELD_ITEM).first().locator('input')
    await expect(input).toBeVisible()
    await expect(input).toHaveAttribute('type', 'text')
  })

  test('primitive item renders with remove button', async ({ page }) => {
    const form = getForm(page)
    await form.getByRole('button', { name: 'Add tag' }).click()

    const item = form.locator('.oo-array').first().locator(FIELD_ITEM).first()
    await expect(item.locator('input')).toBeVisible()
    await expect(item.locator('.oo-field-remove-btn')).toBeVisible()
  })

  test('can add multiple items', async ({ page }) => {
    const form = getForm(page)
    const addBtn = form.getByRole('button', { name: 'Add tag' })

    await addBtn.click()
    await addBtn.click()
    await addBtn.click()

    const tagsArray = form.locator('.oo-array').first()
    await expect(tagsArray.locator(FIELD_ITEM)).toHaveCount(3)
  })

  test('can type into scalar inputs', async ({ page }) => {
    const form = getForm(page)
    const addBtn = form.getByRole('button', { name: 'Add tag' })

    await addBtn.click()
    await addBtn.click()

    const inputs = form.locator('.oo-array').first().locator(`${FIELD_ITEM} input`)
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
    await expect(tagsArray.locator(FIELD_ITEM)).toHaveCount(2)

    await tagsArray.locator('.oo-field-remove-btn').first().click()
    await expect(tagsArray.locator(FIELD_ITEM)).toHaveCount(1)
  })

  test('enforces maxLength of 5', async ({ page }) => {
    const form = getForm(page)
    const addBtn = form.getByRole('button', { name: 'Add tag' })

    for (let i = 0; i < 5; i++) {
      await addBtn.click()
    }

    const tagsArray = form.locator('.oo-array').first()
    await expect(tagsArray.locator(FIELD_ITEM)).toHaveCount(5)

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

    await tagsArray.locator('.oo-field-remove-btn').first().click()
    await expect(addBtn).toBeEnabled()
  })
})

// ── Number Array (Scores) ─────────────────────────────────────────

test.describe('Number Array — Scores', () => {
  test('add button creates a number input', async ({ page }) => {
    const form = getForm(page)
    await form.getByRole('button', { name: 'Add score' }).click()

    const scoresArray = form.locator('.oo-array').nth(1)
    const input = scoresArray.locator(FIELD_ITEM).first().locator('input')
    await expect(input).toBeVisible()
    await expect(input).toHaveAttribute('type', 'number')
  })

  test('can type numbers into score inputs', async ({ page }) => {
    const form = getForm(page)
    await form.getByRole('button', { name: 'Add score' }).click()

    const scoresArray = form.locator('.oo-array').nth(1)
    const input = scoresArray.locator(FIELD_ITEM).first().locator('input')
    await input.fill('95')
    await expect(input).toHaveValue('95')
  })
})

// ── Object Array (Addresses) ──────────────────────────────────────

test.describe('Object Array — Addresses', () => {
  test('renders group title', async ({ page }) => {
    const form = getForm(page)
    await expect(
      form.locator('.oo-structured-title').filter({ hasText: 'Addresses' })
    ).toBeVisible()
  })

  test('add creates item with sub-fields', async ({ page }) => {
    const form = getForm(page)
    await form.getByRole('button', { name: 'Add address' }).click()

    const addressArray = form.locator('.oo-array').nth(2)
    const item = addressArray.locator(OBJ_ITEM).first()
    await expect(item).toBeVisible()

    await expect(item.locator('input[name="street"]')).toBeVisible()
    await expect(item.locator('input[name="city"]')).toBeVisible()
    await expect(item.locator('input[name="zip"]')).toBeVisible()
  })

  test('sub-field placeholders render correctly', async ({ page }) => {
    const form = getForm(page)
    await form.getByRole('button', { name: 'Add address' }).click()

    const addressArray = form.locator('.oo-array').nth(2)
    const item = addressArray.locator(OBJ_ITEM).first()

    await expect(item.locator('input[name="street"]')).toHaveAttribute('placeholder', '123 Main St')
    await expect(item.locator('input[name="city"]')).toHaveAttribute('placeholder', 'New York')
    await expect(item.locator('input[name="zip"]')).toHaveAttribute('placeholder', '10001')
  })

  test('sub-field labels render', async ({ page }) => {
    const form = getForm(page)
    await form.getByRole('button', { name: 'Add address' }).click()

    const addressArray = form.locator('.oo-array').nth(2)
    const item = addressArray.locator(OBJ_ITEM).first()

    await expect(item.locator('label').filter({ hasText: 'Street' })).toBeVisible()
    await expect(item.locator('label').filter({ hasText: 'City' })).toBeVisible()
    await expect(item.locator('label').filter({ hasText: 'ZIP' })).toBeVisible()
  })

  test('can fill sub-fields', async ({ page }) => {
    const form = getForm(page)
    await form.getByRole('button', { name: 'Add address' }).click()

    const addressArray = form.locator('.oo-array').nth(2)
    const item = addressArray.locator(OBJ_ITEM).first()

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

    await expect(addressArray.locator(OBJ_ITEM)).toHaveCount(2)

    const firstItem = addressArray.locator(OBJ_ITEM).first()
    const secondItem = addressArray.locator(OBJ_ITEM).nth(1)
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

    const firstItem = addressArray.locator(OBJ_ITEM).first()
    const secondItem = addressArray.locator(OBJ_ITEM).nth(1)
    await firstItem.locator('input[name="street"]').fill('First')
    await secondItem.locator('input[name="street"]').fill('Second')

    // Remove the first item (object items have remove in the group header)
    await addressArray.locator('.oo-structured-remove-btn').first().click()

    // Second item should now be first
    await expect(addressArray.locator(OBJ_ITEM)).toHaveCount(1)
    await expect(
      addressArray.locator(OBJ_ITEM).first().locator('input[name="street"]')
    ).toHaveValue('Second')
  })
})

// ── Nested Group (Settings) ──────────────────────────────────────

test.describe('Nested Group — Settings', () => {
  test('renders group title', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator('.oo-structured-title').filter({ hasText: 'Settings' })).toBeVisible()
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
    await expect(form.locator('.oo-structured-title').filter({ hasText: 'Contacts' })).toBeVisible()
  })

  test('shows add dropdown with two variant options', async ({ page }) => {
    const form = getForm(page)
    const contactsSection = form.locator('.oo-array').last()
    const addTrigger = contactsSection.locator('.oo-array-add .oo-array-add-btn')

    // Click the add dropdown trigger
    await addTrigger.click()
    const dropdownItems = contactsSection.locator('.oo-array-add .oo-dropdown-item')
    await expect(dropdownItems).toHaveCount(2)
  })

  test('add object variant creates item with sub-fields', async ({ page }) => {
    const form = getForm(page)
    const contactsSection = form.locator('.oo-array').last()

    // Open add dropdown and click first variant (object)
    await contactsSection.locator('.oo-array-add .oo-array-add-btn').click()
    await contactsSection.locator('.oo-array-add .oo-dropdown-item').first().click()

    const item = contactsSection.locator(UNION_ITEM).first()
    await expect(item).toBeVisible()

    // Should have variant dropdown trigger and object sub-fields
    await expect(item.locator('.oo-dropdown-trigger')).toBeVisible()
    await expect(item.locator('input[name="fullName"]')).toBeVisible()
    await expect(item.locator('input[name="email"]')).toBeVisible()
    await expect(item.locator('input[name="phone"]')).toBeVisible()
  })

  test('add string variant creates scalar input with variant selector', async ({ page }) => {
    const form = getForm(page)
    const contactsSection = form.locator('.oo-array').last()

    // Open add dropdown and click second variant (string)
    await contactsSection.locator('.oo-array-add .oo-array-add-btn').click()
    await contactsSection.locator('.oo-array-add .oo-dropdown-item').nth(1).click()

    const item = contactsSection.locator(UNION_ITEM).first()
    await expect(item).toBeVisible()
    await expect(item.locator(SCALAR_INPUT)).toBeVisible()
    await expect(item.locator(SCALAR_INPUT)).toHaveAttribute('type', 'text')
    // Union variant dropdown trigger is still visible so user can switch back
    await expect(item.locator('.oo-dropdown-trigger')).toBeVisible()
  })

  test('can fill object variant sub-fields', async ({ page }) => {
    const form = getForm(page)
    const contactsSection = form.locator('.oo-array').last()

    // Add object variant via dropdown
    await contactsSection.locator('.oo-array-add .oo-array-add-btn').click()
    await contactsSection.locator('.oo-array-add .oo-dropdown-item').first().click()

    const item = contactsSection.locator(UNION_ITEM).first()
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

    // Add an object variant item via dropdown
    await contactsSection.locator('.oo-array-add .oo-array-add-btn').click()
    await contactsSection.locator('.oo-array-add .oo-dropdown-item').first().click()

    const allItems = contactsSection.locator(UNION_ITEM)
    await expect(allItems.first().locator('input[name="fullName"]')).toBeVisible()

    // Switch to string variant via dropdown
    await allItems.first().locator('.oo-dropdown-trigger').click()
    await allItems.first().locator('.oo-dropdown-item').nth(1).click()
    await expect(contactsSection.locator('input[name="fullName"]')).toHaveCount(0)
    await expect(contactsSection.locator(UNION_SCALAR)).toBeVisible()

    // Switch back to object variant via dropdown
    await contactsSection.locator(UNION_ITEM).first().locator('.oo-dropdown-trigger').click()
    await contactsSection.locator(UNION_ITEM).first().locator('.oo-dropdown-item').first().click()
    await expect(contactsSection.locator('input[name="fullName"]')).toBeVisible()
    await expect(contactsSection.locator(UNION_SCALAR)).toHaveCount(0)
  })

  test('can mix object and scalar items', async ({ page }) => {
    const form = getForm(page)
    const contactsSection = form.locator('.oo-array').last()

    // Add object variant
    await contactsSection.locator('.oo-array-add .oo-array-add-btn').click()
    await contactsSection.locator('.oo-array-add .oo-dropdown-item').first().click()

    // Add string variant
    await contactsSection.locator('.oo-array-add .oo-array-add-btn').click()
    await contactsSection.locator('.oo-array-add .oo-dropdown-item').nth(1).click()

    const allItems = contactsSection.locator(UNION_ITEM)
    await expect(allItems).toHaveCount(2)

    // First item should be object (has fullName), second should be scalar
    await expect(allItems.first().locator('input[name="fullName"]')).toBeVisible()
    await expect(allItems.nth(1).locator(SCALAR_INPUT)).toBeVisible()
  })

  test('remove works for union items', async ({ page }) => {
    const form = getForm(page)
    const contactsSection = form.locator('.oo-array').last()

    // Add object variant
    await contactsSection.locator('.oo-array-add .oo-array-add-btn').click()
    await contactsSection.locator('.oo-array-add .oo-dropdown-item').first().click()

    // Add string variant
    await contactsSection.locator('.oo-array-add .oo-array-add-btn').click()
    await contactsSection.locator('.oo-array-add .oo-dropdown-item').nth(1).click()

    const allItems = contactsSection.locator(UNION_ITEM)
    await expect(allItems).toHaveCount(2)

    // Remove first item (object items have remove in the group header)
    await contactsSection.locator('.oo-structured-remove-btn').first().click()
    await expect(contactsSection.locator(UNION_ITEM)).toHaveCount(1)

    // Remaining item should be the scalar one
    await expect(contactsSection.locator(UNION_ITEM).first().locator(SCALAR_INPUT)).toBeVisible()
  })
})

// ── Context-Driven Select (Category) ──────────────────────────────

test.describe('Context-Driven Select — Category', () => {
  test('renders select with label', async ({ page }) => {
    const form = getForm(page)
    await expect(form.locator('label').filter({ hasText: 'Category' })).toBeVisible()
    await expect(form.locator('select[name="category"]')).toBeAttached()
  })

  test('populates options from context', async ({ page }) => {
    const form = getForm(page)
    const select = form.locator('select[name="category"]')

    // Options in the native select (excluding disabled placeholder)
    const enabledOptions = select.locator('option:not([disabled])')
    const count = await enabledOptions.count()

    // categoryOptions are randomly picked: 3–7 items from the pool
    expect(count).toBeGreaterThanOrEqual(3)
    expect(count).toBeLessThanOrEqual(7)
  })

  test('options come from the known category pool', async ({ page }) => {
    const form = getForm(page)
    const select = form.locator('select[name="category"]')
    const knownKeys = [
      'frontend',
      'backend',
      'devops',
      'design',
      'mobile',
      'data',
      'security',
      'qa',
      'ml',
      'infra',
    ]

    const enabledOptions = select.locator('option:not([disabled])')
    const count = await enabledOptions.count()
    for (let i = 0; i < count; i++) {
      const value = await enabledOptions.nth(i).getAttribute('value')
      expect(knownKeys).toContain(value)
    }
  })
})

// ── Custom Select Component (4th form — ArrayFormCustom) ──────────

test.describe('Custom Select Component — Category', () => {
  /** Switch to Custom Array tab and get the form. */
  function getCustomForm(page: Page): Locator {
    return page.locator('form').first()
  }

  test('renders custom dropdown trigger', async ({ page }) => {
    await page.getByRole('button', { name: 'Custom Array' }).click()
    const form = getCustomForm(page)
    await form.waitFor()
    const trigger = form.locator('[role="combobox"]')
    await expect(trigger).toBeVisible()
  })

  test('can select an option via custom dropdown', async ({ page }) => {
    await page.getByRole('button', { name: 'Custom Array' }).click()
    const form = getCustomForm(page)
    await form.waitFor()

    // Open the custom dropdown
    const trigger = form.locator('[role="combobox"]')
    await trigger.click()

    // Dropdown should appear with options
    const dropdown = form.locator('[role="listbox"]')
    await expect(dropdown).toBeVisible()

    const options = dropdown.locator('[role="option"]')
    const count = await options.count()
    expect(count).toBeGreaterThanOrEqual(3)

    // Click the first option
    const firstOptionText = await options.first().locator('span').textContent()
    await options.first().click()

    // Dropdown should close and trigger should show the selected label
    await expect(dropdown).not.toBeVisible()
    await expect(trigger.locator('.ct-select-value')).toHaveText(firstOptionText!)
  })

  test('selected option shows checkmark', async ({ page }) => {
    await page.getByRole('button', { name: 'Custom Array' }).click()
    const form = getCustomForm(page)
    await form.waitFor()

    // Open and select first option
    const trigger = form.locator('[role="combobox"]')
    await trigger.click()
    const dropdown = form.locator('[role="listbox"]')
    await dropdown.locator('[role="option"]').first().click()

    // Re-open dropdown
    await trigger.click()
    const selected = dropdown.locator('[role="option"][aria-selected="true"]')
    await expect(selected).toHaveCount(1)
  })
})
