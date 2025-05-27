import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { routes, routeObjects } from './providers/AppRoutes';

test('No errors on start!', async () => {
  render(
    <RouterProvider router={routes} future={{
      v7_startTransition: true,
    }}>
    </RouterProvider >
  );
});


test('login page rendering', () => {
  render(
    <RouterProvider router={routes} future={{
      v7_startTransition: true,
    }}>
    </RouterProvider >
  );

  const loginButton = screen.getByRole('button', { name: 'Login' });
  expect(loginButton).toBeInTheDocument();
});

test('login page worked successfully', async () => {
  (window as any).fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ token: 'abc123', username: 'test' }),
    })
  );

  const router = createMemoryRouter(routeObjects, {
    initialEntries: ['/login'],
  });
  
  render(
    <RouterProvider router={router} future={{
      v7_startTransition: true,
    }}>
    </RouterProvider >
  );

  const loginButton = screen.getByRole('button', { name: 'Login' });
  expect(loginButton).toBeInTheDocument();

  const input = screen.getByPlaceholderText('Username');
  expect(input).toBeInTheDocument();

  await userEvent.type(input, 'test');
  expect(input).toHaveValue('test');

  await userEvent.click(loginButton);
  await waitFor(() => {
    expect(screen.getByText('Welcome, test')).toBeInTheDocument();
  });});



