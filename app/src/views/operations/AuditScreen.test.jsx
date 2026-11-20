import { describe, it, expect } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import AuditScreen from './AuditScreen';
import { renderWithProviders } from '../../test/render';
import { setDemoMode } from '../../rmx/demoMode';
import { rmxCall, R } from '../../rmx/store';

const table = async () => screen.findByRole('table', { name: 'Audit log' });

describe('AuditScreen', () => {
  it('shows the loading state first', () => {
    renderWithProviders(<AuditScreen />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('shows the error state', async () => {
    setDemoMode('error');
    renderWithProviders(<AuditScreen />);
    expect(await screen.findByText(/Sample error/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    setDemoMode('empty');
    renderWithProviders(<AuditScreen />);
    expect(await screen.findByText('No audit rows.')).toBeInTheDocument();
  });

  it('shows the seeded rows with before and after values', async () => {
    renderWithProviders(<AuditScreen />);
    const t = await table();
    expect(screen.getByRole('heading', { name: 'Audit' })).toBeInTheDocument();
    expect(within(t).getAllByRole('row')).toHaveLength(7);
    expect(within(t).getAllByText('ops-admin (hubctl)')).toHaveLength(2);
    expect(within(t).getAllByText('dailyCap: 100')).toHaveLength(1);
    expect(within(t).getAllByText('dailyCap: 50')).toHaveLength(1);
  });

  it('filters by action', async () => {
    const { user } = renderWithProviders(<AuditScreen />);
    await table();
    await user.click(screen.getByRole('combobox', { name: 'Action' }));
    await user.click(await screen.findByRole('option', { name: 'Payout rejected' }));
    await waitFor(() => expect(within(screen.getByRole('table', { name: 'Audit log' })).getAllByRole('row')).toHaveLength(2));
    expect(within(screen.getByRole('table', { name: 'Audit log' })).getByText('dg-108')).toBeInTheDocument();
  });

  it('filters by offer id', async () => {
    const { user } = renderWithProviders(<AuditScreen />);
    await table();
    await user.type(screen.getByLabelText('Offer id'), 'dg-107');
    await waitFor(() => expect(within(screen.getByRole('table', { name: 'Audit log' })).getAllByRole('row')).toHaveLength(3));
  });

  it('shows a new row after a catalog change', async () => {
    renderWithProviders(<AuditScreen />);
    await table();
    await rmxCall(R.offerCatalog, { offerId: 'dg-101', operatorStatus: 'paused', dryRun: false },
      { email: 'operator@example.com', role: 'RMX_OPERATOR' });
    await waitFor(() => expect(within(screen.getByRole('table', { name: 'Audit log' })).getAllByRole('row')).toHaveLength(8));
    const t = screen.getByRole('table', { name: 'Audit log' });
    const first = within(t).getAllByRole('row')[1];
    expect(within(first).getByText('operator@example.com via lds-api')).toBeInTheDocument();
    expect(within(first).getByText('dg-101')).toBeInTheDocument();
    expect(within(first).getByText('Catalog set')).toBeInTheDocument();
    expect(within(first).getByText('operatorStatus: active')).toBeInTheDocument();
    expect(within(first).getByText('operatorStatus: paused')).toBeInTheDocument();
  });
});
