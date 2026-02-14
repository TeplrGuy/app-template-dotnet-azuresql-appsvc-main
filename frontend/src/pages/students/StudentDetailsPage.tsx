import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';

import { useStudent } from '../../features/students/api';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleString();
}

export function StudentDetailsPage() {
  const { id } = useParams();
  const studentId = Number(id ?? Number.NaN);

  const { data, isLoading, isError, error, refetch } = useStudent(studentId);

  if (!id || Number.isNaN(studentId)) {
    return <Alert severity="error">Invalid student id.</Alert>;
  }

  if (isLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', py: 6 }}
        aria-label="Loading student"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Stack spacing={2}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          {(error as Error | undefined)?.message ?? 'Failed to load student.'}
        </Alert>
        <Button component={RouterLink} to="/students" aria-label="Back to students">
          Back
        </Button>
      </Stack>
    );
  }

  if (!data) return <Alert severity="warning">Student not found.</Alert>;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button component={RouterLink} to="/students" aria-label="Back to students">
          Back
        </Button>
      </Stack>

      <Paper sx={{ p: 3 }} aria-label="Student details">
        <Typography variant="h4" component="h1" gutterBottom>
          {data.firstName} {data.lastName}
        </Typography>

        <Stack spacing={1}>
          <Typography color="text.secondary">Student ID: {data.studentId}</Typography>
          <Typography color="text.secondary">
            Enrollment date: {formatDateTime(data.enrollmentDate)}
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  );
}
