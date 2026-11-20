import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import DashboardScreen from './DashboardScreen';
import { renderWithProviders } from '../../test/render';
import { setDemoMode } from '../../rmx/demoMode';

describe('DashboardScreen', () => {
  it('shows the loading state first', () => {
    renderWithProviders(<DashboardScreen />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('shows the error state', async () => {
    setDemoMode('error');
    renderWithProviders(<DashboardScreen />);
    expect(await screen.findByText(/Sample error/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Operations' })).toHaveAttribute('href', '/redirectmax/operations');
    expect(screen.getByRole('link', { name: 'Setup and changes' })).toHaveAttribute('href', '/redirectmax/setup');
  });

  it('shows the empty state', async () => {
    setDemoMode('empty');
    renderWithProviders(<DashboardScreen />);
    expect(await screen.findByText('No leads in this period.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Operations' })).toHaveAttribute('href', '/redirectmax/operations');
    expect(screen.getByRole('link', { name: 'Setup and changes' })).toHaveAttribute('href', '/redirectmax/setup');
  });

  it('shows tiles, tables and health', async () => {
    renderWithProviders(<DashboardScreen />);
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    for (const t of ['Received', 'Sold', 'Sell-through', 'Revenue', 'Avg sold price']) {
      expect(await screen.findByTestId(`tile-${t}`)).toHaveTextContent(t);
    }
    expect(screen.getByTestId('tile-Received')).toHaveTextContent('312');
    expect(screen.getByTestId('tile-Sell-through')).toHaveTextContent('77.2%');
    expect(screen.getByTestId('tile-Revenue')).toHaveTextContent('$6,120.50');
    expect(screen.getByRole('table', { name: 'Top campaigns' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Top buyers' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Top publishers' })).toBeInTheDocument();
    expect(screen.getByText('Sample Debt Relief A')).toBeInTheDocument();
    const health = screen.getByRole('table', { name: 'Last-hour health' });
    expect(within(health).getByText('Reconciliation')).toBeInTheDocument();
    expect(within(health).getByText('Alert')).toBeInTheDocument();
  });

  it('switching to Last 7 days changes Received', async () => {
    const { user } = renderWithProviders(<DashboardScreen />);
    expect(await screen.findByTestId('tile-Received')).toHaveTextContent('312');
    await user.click(screen.getByRole('button', { name: 'Last 7 days' }));
    expect(await screen.findByText('2104')).toBeInTheDocument();
    expect(screen.getByTestId('tile-Received')).toHaveTextContent('2104');
  });

  it('links to the RedirectMax console', async () => {
    renderWithProviders(<DashboardScreen />);
    expect(await screen.findByText('RedirectMax console')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Operations' })).toHaveAttribute('href', '/redirectmax/operations');
    expect(screen.getByRole('link', { name: 'Setup and changes' })).toHaveAttribute('href', '/redirectmax/setup');
  });
});
