import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';

import { useDepartmentsList } from '../../features/departments/api';
import { useInstructorsList } from '../../features/instructors/api';

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function TeachersListPage() {
  const { data: instructors, isLoading, isError } = useInstructorsList();
  const { data: departments } = useDepartmentsList();

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Teachers
        </Typography>
        <Typography color="text.secondary">
          Meet our distinguished faculty members.
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Typography color="error">Failed to load teachers.</Typography>
      ) : (
        <>
          <Grid container spacing={3}>
            {(instructors ?? []).map((t) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={t.instructorId}>
                <Card>
                  <CardContent>
                    <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          bgcolor: '#F3E5F5',
                          color: '#7B1FA2',
                          width: 56,
                          height: 56,
                          fontSize: 20,
                          fontWeight: 600,
                        }}
                      >
                        {initials(t.firstName, t.lastName)}
                      </Avatar>

                      <Box>
                        <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
                          {t.firstName} {t.lastName}
                        </Typography>
                        <Chip
                          label={t.department}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>

                      <Stack spacing={0.5} alignItems="center">
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {t.email}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {t.office}
                          </Typography>
                        </Stack>
                      </Stack>

                      <Chip label="Faculty Member" size="small" color="primary" />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {departments && departments.length > 0 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Faculty by Department
              </Typography>
              <Grid container spacing={2}>
                {departments
                  .filter((d) => d.instructorCount > 0)
                  .map((d) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={d.departmentId}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="h5" fontWeight={700} color="primary">
                            {d.instructorCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {d.name}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </Box>
          )}
        </>
      )}
    </Stack>
  );
}
