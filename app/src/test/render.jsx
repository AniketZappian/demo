import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders, AppRoutes } from '../App';

export function renderWithProviders(ui, { role, path = '/' } = {}) {
  const user = userEvent.setup();
  const result = render(
    <AppProviders initialRole={role}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </AppProviders>,
  );
  return { ...result, user };
}

export function renderApp(path = '/', { role } = {}) {
  return renderWithProviders(<AppRoutes />, { role, path });
}
