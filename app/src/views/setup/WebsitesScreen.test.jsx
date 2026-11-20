import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';
import { setDemoMode } from '../../rmx/demoMode';
import WebsitesScreen from './WebsitesScreen';

describe('WebsitesScreen', () => {
  it('shows the loading state', async () => {
    renderWithProviders(<WebsitesScreen />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    await screen.findByText('example-debt-site');
  });

  it('shows the error state with Retry', async () => {
    setDemoMode('error');
    renderWithProviders(<WebsitesScreen />);
    expect(await screen.findByText('Sample error: the RedirectMax internal API did not answer.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    setDemoMode('empty');
    renderWithProviders(<WebsitesScreen />);
    expect(await screen.findByText('No websites.')).toBeInTheDocument();
  });

  it('shows keys status, the hubctl command and no hash text', async () => {
    renderWithProviders(<WebsitesScreen />);
    const swift = (await screen.findByText('swiftpaydayfund')).closest('tr');
    expect(within(swift).getByText('No key')).toBeInTheDocument();
    const debt = screen.getByText('example-debt-site').closest('tr');
    expect(within(debt).getByText('Has key')).toBeInTheDocument();
    expect(screen.getByText('hubctl publisher-add --help')).toBeInTheDocument();
    expect(screen.getByText(/never here/)).toBeInTheDocument();
    expect(screen.queryByText(/hash/i)).not.toBeInTheDocument();
  });
});
