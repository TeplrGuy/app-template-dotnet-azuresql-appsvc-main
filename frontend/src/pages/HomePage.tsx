import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { useStats } from '../features/stats/api';

const statCards = [
  { key: 'totalStudents', label: 'Total Students', icon: PeopleIcon, color: '#1565C0' },
  { key: 'activeCourses', label: 'Active Courses', icon: AutoStoriesIcon, color: '#2E7D32' },
  { key: 'facultyMembers', label: 'Faculty Members', icon: SchoolIcon, color: '#7B1FA2' },
  { key: 'totalEnrollments', label: 'Total Enrollments', icon: TrendingUpIcon, color: '#E65100' },
] as const;

const quickAccess = [
  { title: 'Students', desc: 'View and manage student records, enrollments, and academic information.', path: '/students', icon: PeopleIcon, color: '#1565C0' },
  { title: 'Courses', desc: 'Browse course catalog, view descriptions, and manage course offerings.', path: '/courses', icon: AutoStoriesIcon, color: '#2E7D32' },
  { title: 'Teachers', desc: 'Meet our faculty members and explore department directories.', path: '/teachers', icon: GroupsIcon, color: '#7B1FA2' },
];

export function HomePage() {
  const { data: stats, isLoading } = useStats();

  return (
    <Stack spacing={4}>
      {/* Welcome */}
      <Box>
        <Typography variant="h4" gutterBottom>
          Welcome to Contoso University
        </Typography>
        <Typography color="text.secondary">
          Access student information, course catalogs, and faculty directories.
        </Typography>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={3}>
        {statCards.map((s) => (
          <Grid size={{ xs: 6, md: 3 }} key={s.key}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: `${s.color}14`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 1.5,
                  }}
                >
                  <s.icon sx={{ color: s.color, fontSize: 28 }} />
                </Box>
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats?.[s.key]?.toLocaleString() ?? '–'}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {s.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Access */}
      <Box>
        <Typography variant="h5" gutterBottom>
          Quick Access
        </Typography>
        <Grid container spacing={3}>
          {quickAccess.map((qa) => (
            <Grid size={{ xs: 12, md: 4 }} key={qa.title}>
              <Card>
                <CardActionArea component={RouterLink} to={qa.path}>
                  <CardContent sx={{ py: 3 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        bgcolor: `${qa.color}14`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      <qa.icon sx={{ color: qa.color, fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {qa.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {qa.desc}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Stack>
  );
}
