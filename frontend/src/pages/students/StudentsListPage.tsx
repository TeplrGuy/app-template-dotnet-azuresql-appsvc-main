import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import type { Student } from '../../features/students/api';
import { useStudentsList } from '../../features/students/api';

type LocationState = { created?: boolean };

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString();
}

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function StudentsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const pageSize = Math.max(
    1,
    Math.min(200, Number(searchParams.get('pageSize') ?? '20') || 20),
  );

  const location = useLocation();
  const navigate = useNavigate();

  const created = Boolean((location.state as LocationState | null)?.created);
  const [showCreated, setShowCreated] = useState(created);

  useEffect(() => {
    if (!created) return;
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });
  }, [created, location.pathname, location.search, navigate]);

  const { data, isLoading, isError, error, refetch } =
    useStudentsList(page, pageSize);

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  const onPageChange = (_: unknown, nextPageZeroBased: number) => {
    setSearchParams({
      page: String(nextPageZeroBased + 1),
      pageSize: String(pageSize),
    });
  };

  const onRowsPerPageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchParams({ page: '1', pageSize: String(Number(e.target.value) || 20) });
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Students
          </Typography>
          <Typography color="text.secondary">
            View all enrolled students and their information.
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          to="/students/create"
          variant="contained"
          aria-label="Create student"
        >
          Create student
        </Button>
      </Stack>

      {isLoading ? (
        <Box
          sx={{ display: 'flex', justifyContent: 'center', py: 6 }}
          aria-label="Loading students"
        >
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          {(error as Error | undefined)?.message ?? 'Failed to load students.'}
        </Alert>
      ) : items.length === 0 ? (
        <Alert severity="info">No students found.</Alert>
      ) : (
        <TableContainer component={Paper} aria-label="Students table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Enrollment Date</TableCell>
                <TableCell align="center">Courses</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((s: Student) => (
                <TableRow key={s.studentId} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: '#E3F2FD',
                          color: '#1565C0',
                          width: 36,
                          height: 36,
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {initials(s.firstName, s.lastName)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>
                        {s.firstName} {s.lastName}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {s.email ?? `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@contoso.edu`}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(s.enrollmentDate)}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={s.courseCount ?? 0}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      component={RouterLink}
                      to={`/students/${s.studentId}`}
                      size="small"
                      aria-label={`View student ${s.firstName} ${s.lastName}`}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={totalCount}
            page={page - 1}
            onPageChange={onPageChange}
            rowsPerPage={pageSize}
            onRowsPerPageChange={onRowsPerPageChange}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="Rows"
          />
        </TableContainer>
      )}

      <Snackbar
        open={showCreated}
        onClose={() => setShowCreated(false)}
        message="Student created"
        autoHideDuration={3000}
      />
    </Stack>
  );
}
