export type StudentFormValues = {
  firstName: string;
  lastName: string;
  enrollmentDate: string; // yyyy-mm-dd
};

export type StudentFormErrors = Partial<Record<keyof StudentFormValues, string>>;

export function validateStudentForm(values: StudentFormValues): StudentFormErrors {
  const errors: StudentFormErrors = {};

  if (!values.firstName.trim()) errors.firstName = 'First name is required.';
  if (!values.lastName.trim()) errors.lastName = 'Last name is required.';

  if (!values.enrollmentDate.trim()) {
    errors.enrollmentDate = 'Enrollment date is required.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.enrollmentDate)) {
    errors.enrollmentDate = 'Use the format YYYY-MM-DD.';
  } else if (Number.isNaN(Date.parse(values.enrollmentDate))) {
    errors.enrollmentDate = 'Enrollment date is invalid.';
  }

  return errors;
}
