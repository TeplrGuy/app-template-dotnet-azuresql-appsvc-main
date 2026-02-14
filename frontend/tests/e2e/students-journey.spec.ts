import { expect, test } from '@playwright/test';

type Student = {
  studentId: number;
  firstName: string;
  lastName: string;
  enrollmentDate: string;
};

function seedStudents(): Student[] {
  return [
    {
      studentId: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      enrollmentDate: '2024-01-15T00:00:00.000Z',
    },
    {
      studentId: 2,
      firstName: 'Alan',
      lastName: 'Turing',
      enrollmentDate: '2024-02-20T00:00:00.000Z',
    },
  ];
}

async function mockStudentsApi(page: import('@playwright/test').Page) {
  let students = seedStudents();

  await page.route('**/api/students?*', async (route) => {
    const url = new URL(route.request().url());
    const pageParam = Number(url.searchParams.get('page') ?? '1') || 1;
    const pageSizeParam = Number(url.searchParams.get('pageSize') ?? '20') || 20;

    const start = (Math.max(pageParam, 1) - 1) * pageSizeParam;
    const items = students.slice(start, start + pageSizeParam);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        page: Math.max(pageParam, 1),
        pageSize: pageSizeParam,
        totalCount: students.length,
        items,
      }),
    });
  });

  await page.route(/.*\/api\/students\/(\d+)$/, async (route) => {
    const match = route.request().url().match(/\/api\/students\/(\d+)$/);
    const studentId = Number(match?.[1] ?? Number.NaN);
    const found = students.find((s) => s.studentId === studentId);

    if (!found) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Student not found' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(found),
    });
  });

  await page.route('**/api/students', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();

    const body = (await route.request().postDataJSON()) as {
      firstName: string;
      lastName: string;
      enrollmentDate: string;
    };

    const created: Student = {
      studentId: Math.max(...students.map((s) => s.studentId)) + 1,
      firstName: body.firstName,
      lastName: body.lastName,
      enrollmentDate: body.enrollmentDate,
    };

    students = [...students, created];

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(created),
    });
  });
}

function defineJourneyTests() {
  test.beforeEach(async ({ page }) => {
    await mockStudentsApi(page);
  });

  test('browse students → view details → create student', async ({ page }) => {
    await page.goto('/students');
    await expect(page.getByRole('heading', { name: 'Students' })).toBeVisible();

    await expect(page.getByLabel('Loading students')).toBeHidden({ timeout: 10_000 });

    // List loads (table vs list differs by breakpoint)
    const desktopName = page.getByText('Lovelace, Ada');
    if (await desktopName.isVisible().catch(() => false)) {
      await expect(desktopName).toBeVisible();
    } else {
      await expect(page.getByText('Ada Lovelace')).toBeVisible();
    }

    // Details (desktop has a "View" control; mobile uses a list item)
    const viewDesktop = page.getByLabel('View student Ada Lovelace');
    const viewMobile = page.getByLabel('Open student Ada Lovelace');

    if (await viewDesktop.isVisible().catch(() => false)) {
      await viewDesktop.click();
    } else {
      await viewMobile.click();
    }

    await expect(page.getByLabel('Student details')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ada Lovelace' })).toBeVisible();

    // Back (link on desktop, nav button on error states)
    const backLink = page.getByRole('link', { name: 'Back to students' });
    const backButton = page.getByRole('button', { name: 'Back to students' });
    if (await backLink.isVisible().catch(() => false)) {
      await backLink.click();
    } else {
      await backButton.click();
    }
    await expect(page.getByRole('heading', { name: 'Students' })).toBeVisible();

    // Create
    await page.getByRole('link', { name: 'Create student' }).click();
    await expect(page.getByRole('heading', { name: 'Create student' })).toBeVisible();

    await page.getByLabel('First name').fill('Grace');
    await page.getByLabel('Last name').fill('Hopper');
    await page.getByLabel('Enrollment date').fill('2024-03-10');

    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Student created')).toBeVisible();

    const desktopCreated = page.getByText('Hopper, Grace');
    if (await desktopCreated.isVisible().catch(() => false)) {
      await expect(desktopCreated).toBeVisible({ timeout: 10_000 });
    } else {
      await expect(page.getByText('Grace Hopper')).toBeVisible({ timeout: 10_000 });
    }
  });
}

test.describe('desktop', () => {
  defineJourneyTests();
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  defineJourneyTests();
});
