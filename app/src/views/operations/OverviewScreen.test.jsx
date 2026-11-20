import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';
import { setDemoMode } from '../../rmx/demoMode';
import { rmxCall, R } from '../../rmx/store';
import OverviewScreen from './OverviewScreen';

describe('OverviewScreen', () => {
  it('shows loading first', async () => {
    renderWithProviders(<OverviewScreen />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(await screen.findByText('Confidence gate')).toBeInTheDocument();
  });

  it('shows the error with Retry', async () => {
    setDemoMode('error');
    renderWithProviders(<OverviewScreen />);
    expect(await screen.findByText(/Sample error/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows the empty text', async () => {
    setDemoMode('empty');
    renderWithProviders(<OverviewScreen />);
    expect(await screen.findByText('No verticals configured.')).toBeInTheDocument();
  });

  it('shows the gate as 0.02 and never 0.75', async () => {
    renderWithProviders(<OverviewScreen />);
    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByText('Confidence gate')).toBeInTheDocument();
    expect(screen.getByText('0.02')).toBeInTheDocument();
    expect(screen.getByText('router.json, live')).toBeInTheDocument();
    expect(screen.queryByText(/0\.75/)).toBeNull();
  });

  it('labels payday as Draft', async () => {
    renderWithProviders(<OverviewScreen />);
    const table = await screen.findByRole('table', { name: 'Verticals' });
    const row = within(table).getByText('payday').closest('tr');
    expect(within(row).getByText('Draft')).toBeInTheDocument();
  });

  it('counts dg-102 as capped', async () => {
    const { data } = await rmxCall(R.overview);
    const debt = data.verticals.find((v) => v.key === 'debt');
    expect(debt.capped).toBeGreaterThanOrEqual(1);
    renderWithProviders(<OverviewScreen />);
    const table = await screen.findByRole('table', { name: 'Verticals' });
    const row = within(table).getByText('debt').closest('tr');
    const cells = within(row).getAllByRole('cell');
    expect(cells[3]).toHaveTextContent(String(debt.capped));
  });

  it('lists both decide servers and the decision tiles', async () => {
    renderWithProviders(<OverviewScreen />);
    const table = await screen.findByRole('table', { name: 'Decide servers' });
    expect(within(table).getByText('decide-1')).toBeInTheDocument();
    expect(within(table).getByText('decide-2')).toBeInTheDocument();
    expect(within(table).getAllByText('cfg-7f3a2c1')).toHaveLength(2);
    expect(screen.getByText('Decisions today')).toBeInTheDocument();
    expect(screen.getByText('Pending payouts')).toBeInTheDocument();
    expect(screen.getByText('Last offer push')).toBeInTheDocument();
    expect(screen.getByText('Last reconciliation')).toBeInTheDocument();
  });
});
