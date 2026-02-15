import {
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { useCoursesList } from '../../features/courses/api';

export function CoursesListPage() {
  const { data, isLoading, isError } = useCoursesList();

  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h1">
        Courses
      </Typography>

      {isLoading ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={20} />
          <Typography>Loading courses…</Typography>
        </Stack>
      ) : isError ? (
        <Typography color="error">Failed to load courses.</Typography>
      ) : (
        <Paper variant="outlined">
          <Table size="small" aria-label="Courses table">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell align="right">Credits</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data ?? []).map((c) => (
                <TableRow key={c.courseId} hover>
                  <TableCell>{c.title}</TableCell>
                  <TableCell align="right">{c.credits}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
