import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink, Outlet } from 'react-router-dom';

export default function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ width: '100%' }}
          >
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}
              aria-label="Go to home"
            >
              Contoso University
            </Typography>

            <Button
              color="inherit"
              component={RouterLink}
              to="/"
              aria-label="Home"
            >
              Home
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/students"
              aria-label="Students"
            >
              Students
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/courses"
              aria-label="Courses"
            >
              Courses
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flex: 1, py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
