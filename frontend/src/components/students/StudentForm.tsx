import { Button, Stack, TextField } from '@mui/material';
import { useMemo, useState } from 'react';

import type { StudentFormValues } from './studentFormValidation';
import { validateStudentForm } from './studentFormValidation';

type Props = {
  initialValues?: Partial<StudentFormValues>;
  submitLabel?: string;
  disabled?: boolean;
  onSubmit: (values: StudentFormValues) => void | Promise<void>;
};

export function StudentForm({
  initialValues,
  submitLabel = 'Save',
  disabled = false,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<StudentFormValues>({
    firstName: initialValues?.firstName ?? '',
    lastName: initialValues?.lastName ?? '',
    enrollmentDate: initialValues?.enrollmentDate ?? '',
  });
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => validateStudentForm(values), [values]);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Stack
      component="form"
      spacing={2}
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (hasErrors) return;
        void onSubmit({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          enrollmentDate: values.enrollmentDate.trim(),
        });
      }}
      aria-label="Student form"
    >
      <TextField
        label="First name"
        value={values.firstName}
        onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
        required
        fullWidth
        disabled={disabled}
        error={submitted && Boolean(errors.firstName)}
        helperText={submitted ? errors.firstName : undefined}
        inputProps={{ 'aria-label': 'First name' }}
      />

      <TextField
        label="Last name"
        value={values.lastName}
        onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))}
        required
        fullWidth
        disabled={disabled}
        error={submitted && Boolean(errors.lastName)}
        helperText={submitted ? errors.lastName : undefined}
        inputProps={{ 'aria-label': 'Last name' }}
      />

      <TextField
        label="Enrollment date"
        type="date"
        value={values.enrollmentDate}
        onChange={(e) =>
          setValues((v) => ({ ...v, enrollmentDate: e.target.value }))
        }
        required
        fullWidth
        disabled={disabled}
        error={submitted && Boolean(errors.enrollmentDate)}
        helperText={submitted ? errors.enrollmentDate : undefined}
        inputProps={{ 'aria-label': 'Enrollment date' }}
        InputLabelProps={{ shrink: true }}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button
          type="submit"
          variant="contained"
          disabled={disabled}
          aria-label={submitLabel}
        >
          {submitLabel}
        </Button>
      </Stack>
    </Stack>
  );
}
