import { expect, test } from '@playwright/test';

test('student details 404 shows friendly message', async ({ page }) => {
  await page.route('**/api/students/999', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({
        statusCode: 404,
        message: 'Student not found',
      }),
    });
  });
  await page.goto('/students/999');
  await expect(page.getByText(/not found|failed/i)).toBeVisible();
});

test('not-found page shows for unknown routes', async ({ page }) => {
  await page.goto('/nonexistent-page');
  await expect(page.getByText('Page Not Found')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go Home' })).toBeVisible();
});
