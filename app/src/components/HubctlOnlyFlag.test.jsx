import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../theme/theme";
import { RoleProvider } from "../rmx/RoleContext";

const wrap = (ui, role) => render(<ThemeProvider theme={theme}><RoleProvider initialRole={role}>{ui}</RoleProvider></ThemeProvider>);

import HubctlOnlyFlag from './HubctlOnlyFlag';
it('disabled switch and helper', () => {
  wrap(<HubctlOnlyFlag label='MLA compliant' checked />);
  const s = screen.getByRole('checkbox', { name: 'MLA compliant' });
  expect(s).toBeDisabled();
  expect(s).toBeChecked();
  expect(screen.getByText('stays in hubctl (Decision 5)')).toBeInTheDocument();
});
