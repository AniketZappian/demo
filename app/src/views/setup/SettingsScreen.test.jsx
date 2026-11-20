import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';
import { setDemoMode } from '../../rmx/demoMode';
import SettingsScreen from './SettingsScreen';

describe('SettingsScreen', () => {
  it('shows the loading state', async () => {
    renderWithProviders(<SettingsScreen />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    await screen.findByText('reversal_deduct_limit');
  });

  it('shows the error state with Retry', async () => {
    setDemoMode('error');
    renderWithProviders(<SettingsScreen />);
    expect(await screen.findByText('Sample error: the RedirectMax internal API did not answer.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    setDemoMode('empty');
    renderWithProviders(<SettingsScreen />);
    expect(await screen.findByText('No switches.')).toBeInTheDocument();
  });

  it('shows on/off pills only and no values', async () => {
    renderWithProviders(<SettingsScreen />);
    const row = (await screen.findByText('reversal_deduct_limit')).closest('tr');
    expect(within(row).getByText('Off')).toBeInTheDocument();
    expect(screen.getByText('RMX_MODULE_ENABLED').closest('tr')).toHaveTextContent('On');
    expect(screen.getByText(/On\/off only/)).toBeInTheDocument();
    expect(screen.queryByText(/395/)).not.toBeInTheDocument();
    expect(screen.queryByText(/hash/i)).not.toBeInTheDocument();
  });
});
