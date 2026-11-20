import { screen, within } from '@testing-library/react';
import { renderApp } from './test/render';
import { NAV, RMX_NAV } from './routes';
import { ROLES, ROLE_LABELS, ROLE_USERS } from './rmx/roles';

describe('shell', () => {
  it('lands "/" on /dashboard', async () => {
    renderApp('/');
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    const link = within(nav).getByRole('link', { name: 'Dashboard' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('shows every LeadScience label and the RedirectMax group', () => {
    renderApp('/dashboard');
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    NAV.flatMap((g) => g.items)
      .forEach((item) => {
        expect(within(nav).getByRole('link', { name: item.name })).toHaveAttribute('href', item.route);
      });
    expect(within(nav).getByRole('button', { name: 'RedirectMax' })).toBeInTheDocument();
    expect(RMX_NAV.items.map((i) => i.name)).toEqual(['Operations', 'Setup and changes', 'Review queue']);
  });

  it('puts the RedirectMax button directly under Dashboard, above Report & Analytics', () => {
    renderApp('/dashboard');
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    const dash = within(nav).getByRole('link', { name: 'Dashboard' });
    const rmx = within(nav).getByRole('button', { name: 'RedirectMax' });
    const report = within(nav).getByText('Report & Analytics');
    expect(dash.compareDocumentPosition(rmx) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(rmx.compareDocumentPosition(report) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(nav).getAllByText('RedirectMax')).toHaveLength(1);
  });

  it('RedirectMax is collapsed off its routes and expands and collapses on click', async () => {
    const { user } = renderApp('/dashboard');
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    const rmx = within(nav).getByRole('button', { name: 'RedirectMax' });
    expect(rmx).toHaveAttribute('aria-expanded', 'false');
    expect(within(nav).queryByRole('link', { name: 'Operations' })).not.toBeInTheDocument();
    await user.click(rmx);
    expect(rmx).toHaveAttribute('aria-expanded', 'true');
    expect(within(nav).getByRole('link', { name: 'Operations' })).toHaveAttribute('href', '/redirectmax/operations');
    expect(within(nav).getByRole('link', { name: 'Setup and changes' })).toHaveAttribute('href', '/redirectmax/setup');
    await user.click(rmx);
    expect(rmx).toHaveAttribute('aria-expanded', 'false');
    expect(within(nav).queryByRole('link', { name: 'Operations' })).not.toBeInTheDocument();
  });

  it('RedirectMax is expanded and highlighted on /redirectmax routes', () => {
    renderApp('/redirectmax/setup');
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    const rmx = within(nav).getByRole('button', { name: 'RedirectMax' });
    expect(rmx).toHaveAttribute('aria-expanded', 'true');
    expect(rmx).toHaveClass('active');
    expect(within(nav).getByRole('link', { name: 'Setup and changes' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows the demo banner and Data mode select', async () => {
    const { user } = renderApp('/dashboard');
    expect(screen.getByText('Demo: sample data')).toBeInTheDocument();
    expect(screen.getByText(/Nothing here talks to RedirectMax or lds-api\./)).toBeInTheDocument();
    const select = screen.getByRole('combobox', { name: /Data mode/ });
    expect(select).toHaveTextContent('Normal');
    await user.click(select);
    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['Normal', 'Slow', 'Empty', 'Error']);
  });

  it('lists 5 roles and changes the shown email', async () => {
    const { user } = renderApp('/dashboard');
    const switcher = screen.getByRole('combobox', { name: 'Role' });
    expect(switcher).toHaveTextContent(ROLE_USERS.RMX_OPERATOR);
    await user.click(switcher);
    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options).toHaveLength(5);
    ROLES.forEach((r, i) => {
      expect(options[i]).toHaveTextContent(ROLE_LABELS[r]);
      expect(options[i]).toHaveTextContent(ROLE_USERS[r]);
    });
    await user.click(options[2]);
    expect(screen.getByRole('combobox', { name: 'Role' })).toHaveTextContent(ROLE_USERS.RMX_APPROVER);
  });

  it('shows "not part of the demo" on other LeadScience pages', () => {
    renderApp('/buyers');
    expect(screen.getByRole('heading', { name: 'Buyers' })).toBeInTheDocument();
    expect(screen.getByText(/not part of the demo/)).toBeInTheDocument();
  });

  it('Operations shows 7 tabs', () => {
    renderApp('/redirectmax/operations');
    const tabs = within(screen.getByRole('tablist')).getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual([
      'Overview', 'Offers', 'Payouts', 'Decisions', 'Simulator', 'Syncs and reconciliation', 'Audit',
    ]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('Setup shows 6 tabs', () => {
    renderApp('/redirectmax/setup');
    const tabs = within(screen.getByRole('tablist')).getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual([
      'Verticals', 'New vertical', 'Config changes', 'Question sets', 'Websites', 'Settings',
    ]);
  });

  it('sends unknown paths to the dashboard', () => {
    renderApp('/nope');
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('demo sign-in link', () => {
  it('maps ?as= to a role and ignores anything else', async () => {
    const { roleFromQuery } = await import('./App');
    expect(roleFromQuery('?as=super-admin')).toBe('RMX_SUPER_ADMIN');
    expect(roleFromQuery('?as=config-editor')).toBe('RMX_CONFIG_EDITOR');
    expect(roleFromQuery('?as=root')).toBeUndefined();
    expect(roleFromQuery('')).toBeUndefined();
  });
});
