import { expect, test } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Contoso University')).toBeVisible();
});

test('courses page loads', async ({ page }) => {
  await page.route('**/api/courses', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { courseId: 1, title: 'Calculus', credits: 4, departmentId: null },
        { courseId: 2, title: 'Chemistry', credits: 3, departmentId: null },
      ]),
    });
  });

  await page.goto('/courses');
  await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible();
  await expect(page.getByText('Calculus')).toBeVisible();
});
