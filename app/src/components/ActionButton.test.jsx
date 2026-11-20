import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../theme/theme";
import { RoleProvider } from "../rmx/RoleContext";

const wrap = (ui, role) => render(<ThemeProvider theme={theme}><RoleProvider initialRole={role}>{ui}</RoleProvider></ThemeProvider>);

import ActionButton from './ActionButton';
it('enabled for allowed role', async () => {
  const onClick = vi.fn();
  wrap(<ActionButton action='offer.catalog' onClick={onClick}>Pause</ActionButton>, 'RMX_OPERATOR');
  await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
  expect(onClick).toHaveBeenCalled();
});
it('disabled with tooltip for denied role', async () => {
  wrap(<ActionButton action='offer.catalog'>Pause</ActionButton>, 'RMX_VIEWER');
  const b = screen.getByRole('button', { name: 'Pause' });
  expect(b).toBeDisabled();
  await userEvent.hover(b.parentElement);
  expect(await screen.findByText('Viewer cannot pause, resume or change caps and budgets.')).toBeInTheDocument();
});
it('disabledReason wins', async () => {
  wrap(<ActionButton disabledReason='Because'>Go</ActionButton>, 'RMX_OPERATOR');
  expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled();
  await userEvent.hover(screen.getByRole('button', { name: 'Go' }).parentElement);
  expect(await screen.findByText('Because')).toBeInTheDocument();
});
