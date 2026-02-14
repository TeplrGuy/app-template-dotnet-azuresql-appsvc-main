import { expect, test } from 'vitest';

import { validateStudentForm } from './studentFormValidation';

test('validateStudentForm returns required field errors', () => {
  const errors = validateStudentForm({
    firstName: '',
    lastName: '',
    enrollmentDate: '',
  });

  expect(errors.firstName).toMatch(/required/i);
  expect(errors.lastName).toMatch(/required/i);
  expect(errors.enrollmentDate).toMatch(/required/i);
});
