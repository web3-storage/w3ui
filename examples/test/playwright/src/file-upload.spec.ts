import { test, expect } from '@playwright/test'

for (const ui of ['react', 'solid', 'vue']) {
  test(`${ui}: file upload`, async ({ page }) => {
    await page.goto(`/${ui}/file-upload/`)
    await expect(page).toHaveTitle('W3UI File Upload Example App')
  })
}
