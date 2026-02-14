import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { expect, test } from 'vitest';

import App from './App';

test('renders app header', () => {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <App />,
      children: [{ index: true, element: <div>Home</div> }],
    },
  ]);

  render(<RouterProvider router={router} />);

  expect(screen.getByText('Contoso University')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Go to home' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Students' })).toBeInTheDocument();
});
