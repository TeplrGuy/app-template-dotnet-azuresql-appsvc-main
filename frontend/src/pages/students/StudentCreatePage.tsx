import { Alert, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { StudentForm } from '../../components/students/StudentForm';
import type { StudentCreate } from '../../features/students/api';
import { useCreateStudent } from '../../features/students/api';
import { ApiError } from '../../lib/api/client';

export function StudentCreatePage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createStudent = useCreateStudent();

  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h1">
        Create student
      </Typography>

      {submitError ? <Alert severity="error">{submitError}</Alert> : null}

      <Paper sx={{ p: 3 }}>
        <StudentForm
          submitLabel={createStudent.isPending ? 'Creating…' : 'Create'}
          disabled={createStudent.isPending}
          onSubmit={async (values) => {
            setSubmitError(null);

            const enrollmentDateIso = new Date(
              `${values.enrollmentDate}T00:00:00.000Z`,
            ).toISOString();

            const body: StudentCreate = {
              firstName: values.firstName,
              lastName: values.lastName,
              enrollmentDate: enrollmentDateIso,
            };

            try {
              await createStudent.mutateAsync(body);
              navigate('/students', { state: { created: true } });
            } catch (e: unknown) {
              if (e instanceof ApiError && e.retryable) {
                setSubmitError(
                  `${e.message} — this error may be temporary.`,
                );
              } else {
                setSubmitError(
                  e instanceof Error ? e.message : 'Failed to create student.',
                );
              }
            }
          }}
        />
      </Paper>
    </Stack>
  );
}
