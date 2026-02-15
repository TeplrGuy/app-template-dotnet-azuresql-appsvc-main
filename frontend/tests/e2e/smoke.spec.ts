import { expect, test } from '@playwright/test';

test('home page loads with stats and quick access', async ({ page }) => {
  await page.route('**/api/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ totalStudents: 156, activeCourses: 42, facultyMembers: 28, totalEnrollments: 1250 }),
    });
  });

  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Go to home' })).toBeVisible();
  await expect(page.getByText('Welcome to Contoso University')).toBeVisible();
  await expect(page.getByText('Total Students')).toBeVisible();
  await expect(page.getByText('Quick Access')).toBeVisible();
});

test('courses page loads with cards', async ({ page }) => {
  await page.route('**/api/courses', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { courseId: 1, title: 'Intro to CS', credits: 4, courseCode: 'CS101', description: 'Fundamentals.', departmentName: 'Computer Science', studentCount: 45 },
      ]),
    });
  });
  await page.route('**/api/departments', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ departmentId: 1, name: 'Computer Science', courseCount: 12, instructorCount: 2 }]),
    });
  });

  await page.goto('/courses');
  await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible();
  await expect(page.getByText('CS101')).toBeVisible();
  await expect(page.getByText('Intro to CS')).toBeVisible();
});

test('teachers page loads with faculty cards', async ({ page }) => {
  await page.route('**/api/instructors', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { instructorId: 1, firstName: 'Robert', lastName: 'Johnson', hireDate: '2015-08-15T00:00:00.000Z', department: 'Computer Science', email: 'robert.johnson@contoso.edu', office: 'Room 301' },
      ]),
    });
  });
  await page.route('**/api/departments', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ departmentId: 1, name: 'Computer Science', courseCount: 12, instructorCount: 1 }]),
    });
  });

  await page.goto('/teachers');
  await expect(page.getByRole('heading', { name: 'Teachers' })).toBeVisible();
  await expect(page.getByText('Robert Johnson')).toBeVisible();
  await expect(page.getByText('robert.johnson@contoso.edu')).toBeVisible();
});
