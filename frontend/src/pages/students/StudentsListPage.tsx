import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
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
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
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

export function StudentsListPage() {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));

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

  const { data, isLoading, isError, error, refetch, isFetching } =
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
    <Stack spacing={2}>
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
            Browse and create students.
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
      ) : mdUp ? (
        <TableContainer component={Paper} aria-label="Students table">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Enrollment date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((s: Student) => (
                <TableRow key={s.studentId} hover>
                  <TableCell>{`${s.lastName}, ${s.firstName}`}</TableCell>
                  <TableCell>{formatDate(s.enrollmentDate)}</TableCell>
                  <TableCell align="right">
                    <Button
                      component={RouterLink}
                      to={`/students/${s.studentId}`}
                      size="small"
                      aria-label={`View student ${s.firstName} ${s.lastName}`}
                    >
                      View
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
            rowsPerPageOptions={[10, 20, 50, 100, 200]}
            labelRowsPerPage="Rows"
          />
        </TableContainer>
      ) : (
        <Paper aria-label="Students list">
          <List dense>
            {items.map((s: Student) => (
              <ListItem key={s.studentId} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={`/students/${s.studentId}`}
                  aria-label={`Open student ${s.firstName} ${s.lastName}`}
                >
                  <ListItemText
                    primary={`${s.firstName} ${s.lastName}`}
                    secondary={formatDate(s.enrollmentDate)}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {isFetching && !isLoading ? (
        <Typography color="text.secondary" aria-label="Refreshing students">
          Refreshing…
        </Typography>
      ) : null}

      <Snackbar
        open={showCreated}
        onClose={() => setShowCreated(false)}
        message="Student created"
        autoHideDuration={3000}
      />
    </Stack>
  );
}
