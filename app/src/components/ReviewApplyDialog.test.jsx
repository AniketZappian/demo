import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../theme/theme";
import { RoleProvider } from "../rmx/RoleContext";

const wrap = (ui, role) => render(<ThemeProvider theme={theme}><RoleProvider initialRole={role}>{ui}</RoleProvider></ThemeProvider>);

import ReviewApplyDialog from './ReviewApplyDialog';
const base = { open: true, title: 'Pause offer', before: { status: 'active', cap: 5 }, after: { status: 'paused', cap: 5 }, onApply: () => {}, onCancel: () => {} };
it('shows preview text and table with changed rows', () => {
  wrap(<ReviewApplyDialog {...base} labels={{ status: 'Status' }} />);
  expect(screen.getByText('Preview (dry run): nothing has changed yet.')).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Field' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Before' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'After' })).toBeInTheDocument();
  const changed = screen.getByText('Status').closest('tr');
  const same = screen.getByText('Cap').closest('tr');
  expect(changed.className).toBeTruthy();
  expect(changed.className).not.toEqual(same.className);
});
it('apply fires, cancel focused when focusCancel', async () => {
  const onApply = vi.fn();
  wrap(<ReviewApplyDialog {...base} onApply={onApply} focusCancel applyLabel='Pause it' />);
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  await userEvent.click(screen.getByRole('button', { name: 'Pause it' }));
  expect(onApply).toHaveBeenCalled();
});
it.each([['loading', { loading: true }], ['error', { error: 'Nope' }], ['applying', { applying: true }]])('apply disabled when %s', (_n, p) => {
  wrap(<ReviewApplyDialog {...base} {...p} />);
  expect(screen.getByRole('button', { name: /Apply|Applying/ })).toBeDisabled();
});
it('shows error text', () => {
  wrap(<ReviewApplyDialog {...base} error='Nope' />);
  expect(screen.getByRole('alert')).toHaveTextContent('Nope');
});
