import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../theme/theme";
import { RoleProvider } from "../rmx/RoleContext";

const wrap = (ui, role) => render(<ThemeProvider theme={theme}><RoleProvider initialRole={role}>{ui}</RoleProvider></ThemeProvider>);

import PageHeader from './PageHeader';
it('renders title, subtitle, actions', () => {
  wrap(<PageHeader title='Offers' subtitle='Sub' actions={<button>Go</button>} />);
  expect(screen.getByRole('heading', { name: 'Offers' })).toBeInTheDocument();
  expect(screen.getByText('Sub')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
});
