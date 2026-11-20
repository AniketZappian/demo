import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../theme/theme";
import { RoleProvider } from "../rmx/RoleContext";

const wrap = (ui, role) => render(<ThemeProvider theme={theme}><RoleProvider initialRole={role}>{ui}</RoleProvider></ThemeProvider>);

import StatusPill from './StatusPill';
it.each([['active','Success'],['paused','Warning'],['failed','Error'],['exported','Info'],['pr_open','Info'],['merged','Success'],['capped','default'],['no_redirect','default']])('%s colour', (s, c) => {
  wrap(<StatusPill status={s} />);
  const chip = screen.getByText({ no_redirect: 'No redirect', pr_open: 'PR open' }[s] ?? s[0].toUpperCase() + s.slice(1)).closest('.MuiChip-root');
  if (c === 'default') expect(chip.className).not.toMatch(/MuiChip-color(Success|Warning|Error|Info)/);
  else expect(chip.className).toMatch(new RegExp('MuiChip-color' + c));
});
it('uses label override', () => {
  wrap(<StatusPill status='waiting' label='Waiting on Counsel' />);
  expect(screen.getByText('Waiting on Counsel')).toBeInTheDocument();
});
