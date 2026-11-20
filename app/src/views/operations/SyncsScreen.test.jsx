import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setDemoMode } from '../../rmx/demoMode';
import { renderWithProviders } from '../../test/render';
import SyncsScreen from './SyncsScreen';

describe('SyncsScreen', () => {
  it('shows loading first', async () => {
    renderWithProviders(<SyncsScreen />);
    expect(screen.getAllByRole('status', { name: 'Loading' }).length).toBeGreaterThan(0);
    await screen.findByRole('table', { name: 'Daily Tracker check' });
  });

  it('shows both tables with the failed push pill and the alert row', async () => {
    renderWithProviders(<SyncsScreen />);
    expect(screen.getByRole('heading', { name: 'Syncs and reconciliation' })).toBeInTheDocument();
    const pushes = await screen.findByRole('table', { name: 'Website offer pushes' });
    expect(within(pushes).getAllByRole('row')).toHaveLength(6);
    expect(within(pushes).getAllByText('Failed')).toHaveLength(1);
    const failedRow = within(pushes).getByText('Failed').closest('tr');
    expect(within(failedRow).getByText('Sample error: website did not answer.')).toBeInTheDocument();
    expect(within(failedRow).getByText('Failed').closest('.MuiChip-root')).toHaveClass('MuiChip-colorError');
    const recon = await screen.findByRole('table', { name: 'Daily Tracker check' });
    expect(within(recon).getAllByRole('row')).toHaveLength(8);
    const alertRow = within(recon).getByText('Alert').closest('tr');
    expect(within(alertRow).getByText('6.2%')).toBeInTheDocument();
  });

  it('shows both empty texts', async () => {
    setDemoMode('empty');
    renderWithProviders(<SyncsScreen />);
    expect(await screen.findByText('No offer pushes yet.')).toBeInTheDocument();
    expect(await screen.findByText('No reconciliation runs yet.')).toBeInTheDocument();
  });

  it('shows the error in each section', async () => {
    setDemoMode('error');
    renderWithProviders(<SyncsScreen />);
    const msgs = await screen.findAllByText(/Sample error: the RedirectMax internal API did not answer\./);
    expect(msgs).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Retry' })).toHaveLength(2);
  });
});
