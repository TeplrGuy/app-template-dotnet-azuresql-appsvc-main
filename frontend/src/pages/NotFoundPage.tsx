import SearchOffIcon from '@mui/icons-material/SearchOff';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <SearchOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h4" gutterBottom>
        Page Not Found
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button component={RouterLink} to="/" variant="contained">
          Go Home
        </Button>
        <Button component={RouterLink} to="/students" variant="outlined">
          View Students
        </Button>
      </Stack>
    </Box>
  );
}
