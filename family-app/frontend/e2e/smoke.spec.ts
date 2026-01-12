import { test, expect } from '@playwright/test'

test('smoke test - home page loads', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/')

  // Check that the page has loaded (basic check)
  // This may fail if the app is not running, which is expected
  await expect(page).toHaveTitle(/.*/, { timeout: 5000 })
})
