import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PeopleIcon from '@mui/icons-material/People';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';

import { useCoursesList } from '../../features/courses/api';
import { useDepartmentsList } from '../../features/departments/api';

export function CoursesListPage() {
  const { data: courses, isLoading, isError } = useCoursesList();
  const { data: departments } = useDepartmentsList();

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Courses
        </Typography>
        <Typography color="text.secondary">
          Browse all available courses at Contoso University.
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Typography color="error">Failed to load courses.</Typography>
      ) : (
        <>
          <Grid container spacing={3}>
            {(courses ?? []).map((c) => (
              <Grid size={{ xs: 12, md: 6 }} key={c.courseId}>
                <Card>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          bgcolor: '#E8F5E9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <AutoStoriesIcon sx={{ color: '#2E7D32', fontSize: 22 }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {c.courseCode}
                        </Typography>
                        <Typography variant="h6" gutterBottom sx={{ lineHeight: 1.3 }}>
                          {c.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {c.description}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Chip label={`${c.credits} Credits`} size="small" variant="outlined" />
                          <Chip label={c.departmentName} size="small" color="primary" variant="outlined" />
                          <Chip
                            icon={<PeopleIcon sx={{ fontSize: 16 }} />}
                            label={`${c.studentCount} Students`}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {departments && departments.length > 0 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Departments
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {departments.map((d) => (
                  <Chip
                    key={d.departmentId}
                    label={`${d.name} (${d.courseCount})`}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}
        </>
      )}
    </Stack>
  );
}
