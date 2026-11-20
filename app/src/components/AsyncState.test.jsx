import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../theme/theme";
import { RoleProvider } from "../rmx/RoleContext";

const wrap = (ui, role) => render(<ThemeProvider theme={theme}><RoleProvider initialRole={role}>{ui}</RoleProvider></ThemeProvider>);

import AsyncState from './AsyncState';
it('loading', () => {
  wrap(<AsyncState loading>kids</AsyncState>);
  expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  expect(screen.queryByText('kids')).toBeNull();
});
it('error with retry', async () => {
  const onRetry = vi.fn();
  wrap(<AsyncState error='Boom' onRetry={onRetry}>kids</AsyncState>);
  expect(screen.getByRole('alert')).toHaveTextContent('Boom');
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(onRetry).toHaveBeenCalled();
});
it('empty', () => {
  wrap(<AsyncState isEmpty emptyText='Nothing here'>kids</AsyncState>);
  expect(screen.getByText('Nothing here')).toBeInTheDocument();
  expect(screen.queryByText('kids')).toBeNull();
});
it('children', () => {
  wrap(<AsyncState>kids</AsyncState>);
  expect(screen.getByText('kids')).toBeInTheDocument();
});
