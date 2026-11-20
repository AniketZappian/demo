import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../theme/theme";
import { RoleProvider } from "../rmx/RoleContext";

const wrap = (ui, role) => render(<ThemeProvider theme={theme}><RoleProvider initialRole={role}>{ui}</RoleProvider></ThemeProvider>);

import CodeBlock from './CodeBlock';
it('shows text and copies', async () => {
  const user = userEvent.setup();
  wrap(<CodeBlock text='hubctl x --help' ariaLabel='cmd' />);
  expect(screen.getByLabelText('cmd')).toHaveTextContent('hubctl x --help');
  await user.click(screen.getByRole('button', { name: 'Copy' }));
  expect(await navigator.clipboard.readText()).toBe('hubctl x --help');
});
