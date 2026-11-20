import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../theme/theme";
import { RoleProvider } from "../rmx/RoleContext";

const wrap = (ui, role) => render(<ThemeProvider theme={theme}><RoleProvider initialRole={role}>{ui}</RoleProvider></ThemeProvider>);

import SimpleTable from './SimpleTable';
const columns = [{ key: 'id', label: 'Id' }, { key: 'n', label: 'N', align: 'right', render: (r) => 'v' + r.n }];
const rows = [{ id: 'a', n: 1 }, { id: 'b', n: 2 }];
it('renders rows, render fn and click', async () => {
  const onRowClick = vi.fn();
  wrap(<SimpleTable columns={columns} rows={rows} rowKey='id' onRowClick={onRowClick} ariaLabel='T' />);
  const t = screen.getByRole('table', { name: 'T' });
  expect(within(t).getByText('v2')).toBeInTheDocument();
  expect(within(t).getByRole('columnheader', { name: 'Id' })).toBeInTheDocument();
  await userEvent.click(within(t).getByText('a'));
  expect(onRowClick).toHaveBeenCalledWith(rows[0]);
});
it('rowKey function', () => {
  wrap(<SimpleTable columns={columns} rows={rows} rowKey={(r) => r.id} ariaLabel='T' />);
  expect(screen.getAllByRole('row')).toHaveLength(3);
});
