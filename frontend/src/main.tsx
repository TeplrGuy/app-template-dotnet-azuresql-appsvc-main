import { CssBaseline, ThemeProvider } from '@mui/material';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import './index.css';
import { ErrorBoundary } from './app/ErrorBoundary';
import { NotificationsProvider } from './app/NotificationsProvider';
import { QueryProvider } from './app/QueryProvider';
import { router } from './routes/router';
import { theme } from './theme/theme';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <NotificationsProvider>
          <QueryProvider>
            <RouterProvider router={router} />
          </QueryProvider>
        </NotificationsProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);
