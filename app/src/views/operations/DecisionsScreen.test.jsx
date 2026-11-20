import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';
import { setDemoMode } from '../../rmx/demoMode';
import DecisionsScreen from './DecisionsScreen';

describe('DecisionsScreen', () => {
  it('shows loading then the tables', async () => {
    renderWithProviders(<DecisionsScreen />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Decisions', level: 1 })).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: 'Decisions' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Failed rules by offer' })).toBeInTheDocument();
  });

  it('shows the error state', async () => {
    setDemoMode('error');
    renderWithProviders(<DecisionsScreen />);
    expect(await screen.findByText(/Sample error/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    setDemoMode('empty');
    renderWithProviders(<DecisionsScreen />);
    expect(await screen.findByText('No decisions today.')).toBeInTheDocument();
  });

  it('filters by outcome', async () => {
    const { user } = renderWithProviders(<DecisionsScreen />);
    const table = await screen.findByRole('table', { name: 'Decisions' });
    const dataRows = (t) => within(t).getAllByRole('row').filter((r) => within(r).queryByRole('button', { name: /^Expand / }));
    const all = dataRows(table).length;
    expect(all).toBeGreaterThan(2);
    await user.click(screen.getByRole('combobox', { name: 'Outcome' }));
    await user.click(await screen.findByRole('option', { name: 'Bounced' }));
    const filtered = await screen.findByRole('table', { name: 'Decisions' });
    const rows = dataRows(filtered);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(all);
    rows.forEach((r) => expect(within(r).getByText('Bounced')).toBeInTheDocument());
  });

  it('expands dec-001 to show failed rules and never renders lead_ref or visit_id', async () => {
    const { user } = renderWithProviders(<DecisionsScreen />);
    await screen.findByRole('table', { name: 'Decisions' });
    await user.click(screen.getByRole('button', { name: 'Expand dec-001' }));
    const detail = await screen.findByRole('region', { name: 'Failed rules for dec-001' });
    const row = within(detail).getByText('dg-104').closest('li');
    expect(within(row).getByText('excluded_states')).toBeInTheDocument();
    expect(within(row).getByText('min_debt')).toBeInTheDocument();
    expect(within(detail).getByText('dg-102')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/lead_ref|visit_id/);
  });
});
