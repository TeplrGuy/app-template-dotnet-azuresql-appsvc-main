import SchoolIcon from '@mui/icons-material/School';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Students', path: '/students' },
  { label: 'Courses', path: '/courses' },
  { label: 'Teachers', path: '/teachers' },
];

function getTabIndex(pathname: string) {
  if (pathname === '/') return 0;
  const idx = navItems.findIndex(
    (n, i) => i > 0 && pathname.startsWith(n.path),
  );
  return idx >= 0 ? idx : 0;
}

export default function App() {
  const { pathname } = useLocation();
  const tabIndex = getTabIndex(pathname);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Gradient header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1976D2 100%)',
          color: 'white',
          px: 3,
          pt: 2,
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <SchoolIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{ color: 'inherit', textDecoration: 'none', lineHeight: 1.2 }}
              aria-label="Go to home"
            >
              Contoso University
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.85 }}>
              Student Information System
            </Typography>
          </Box>
        </Box>

        <Tabs
          value={tabIndex}
          variant="scrollable"
          scrollButtons="auto"
          textColor="inherit"
          TabIndicatorProps={{ sx: { backgroundColor: 'white', height: 3, borderRadius: 1.5 } }}
          sx={{ minHeight: 40 }}
        >
          {navItems.map((n) => (
            <Tab
              key={n.path}
              label={n.label}
              component={RouterLink}
              to={n.path}
              aria-label={n.label}
              sx={{ minHeight: 40, py: 0.5, color: 'rgba(255,255,255,0.8)', '&.Mui-selected': { color: 'white' } }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Page body */}
      <Box
        component="main"
        sx={{
          flex: 1,
          bgcolor: 'background.default',
          py: 4,
          px: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
