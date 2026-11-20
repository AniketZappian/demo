import { screen, within } from '@testing-library/react';
import { renderApp, renderWithProviders } from '../../test/render';
import { setDemoMode } from '../../rmx/demoMode';
import ReviewQueueScreen from './ReviewQueueScreen';

const section = (name) => screen.getByRole('region', { name });

describe('ReviewQueueScreen', () => {
  it('lists config drafts, payouts and open pull requests for a Super admin', async () => {
    renderWithProviders(<ReviewQueueScreen />, { role: 'RMX_SUPER_ADMIN' });
    expect(await screen.findByText('Config changes to approve (1)')).toBeInTheDocument();
    expect(within(section('Config changes to approve')).getByText('Block WV for debt')).toBeInTheDocument();
    expect(screen.getByText('Payouts to decide (2)')).toBeInTheDocument();
    expect(screen.getByText('Pull requests waiting on the tech lead (1)')).toBeInTheDocument();
    expect(within(section('Pull requests waiting on the tech lead')).getByText('#238')).toBeInTheDocument();
    expect(screen.queryByText(/Only an Approver or a Super admin/)).not.toBeInTheDocument();
  });

  it('approves a config draft from the queue and moves it to the pull requests waiting on the tech lead', async () => {
    const { user } = renderWithProviders(<ReviewQueueScreen />, { role: 'RMX_SUPER_ADMIN' });
    await user.click(await screen.findByText('Block WV for debt'));
    const detail = screen.getByRole('region', { name: 'Draft detail' });
    await user.type(within(detail).getByLabelText('Counsel reference'), 'CR-2026-201');
    await user.click(within(detail).getByRole('button', { name: 'Approve and open PR' }));
    expect(await screen.findByText('Pull requests waiting on the tech lead (2)')).toBeInTheDocument();
    expect(screen.getByText('Config changes to approve (0)')).toBeInTheDocument();
    expect(within(section('Pull requests waiting on the tech lead')).getByText('CR-2026-201')).toBeInTheDocument();
  });

  it('decides a payout, and blocks deciding your own proposal', async () => {
    const { user } = renderWithProviders(<ReviewQueueScreen />, { role: 'RMX_APPROVER' });
    const table = await screen.findByRole('table', { name: 'Payouts to decide' });
    const own = within(table).getByText('dg-105').closest('tr');
    expect(within(own).getByRole('button', { name: 'Approve' })).toBeDisabled();
    const other = within(table).getByText('dg-101').closest('tr');
    await user.click(within(other).getByRole('button', { name: 'Approve' }));
    expect(await screen.findByText('Payouts to decide (1)')).toBeInTheDocument();
  });

  it('simulates the merge of an open pull request', async () => {
    const { user } = renderWithProviders(<ReviewQueueScreen />, { role: 'RMX_SUPER_ADMIN' });
    const prs = await screen.findByRole('table', { name: 'Pull requests waiting' });
    await user.click(within(prs).getByRole('button', { name: 'Demo: simulate merge' }));
    expect(await screen.findByText('Pull requests waiting on the tech lead (0)')).toBeInTheDocument();
  });

  it('is read-only for an Operator', async () => {
    renderWithProviders(<ReviewQueueScreen />, { role: 'RMX_OPERATOR' });
    expect(await screen.findByText(/Only an Approver or a Super admin can act here/)).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: 'Payouts to decide' });
    within(table).getAllByRole('button', { name: 'Approve' }).forEach((b) => expect(b).toBeDisabled());
  });

  it('shows the error state', async () => {
    setDemoMode('error');
    renderWithProviders(<ReviewQueueScreen />, { role: 'RMX_SUPER_ADMIN' });
    expect(await screen.findByText('Sample error: the RedirectMax internal API did not answer.')).toBeInTheDocument();
  });
});

describe('Review queue in the sidebar', () => {
  it('shows the Review queue with a count for a Super admin', async () => {
    renderApp('/redirectmax/review/queue', { role: 'RMX_SUPER_ADMIN' });
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    const link = within(nav).getByRole('link', { name: /Review queue/ });
    expect(link).toHaveAttribute('href', '/redirectmax/review');
    expect(await within(link).findByLabelText('3 waiting for review')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Review queue' })).toBeInTheDocument();
  });

  it('hides the Review queue from an Operator', () => {
    renderApp('/redirectmax/operations/overview', { role: 'RMX_OPERATOR' });
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).queryByRole('link', { name: /Review queue/ })).not.toBeInTheDocument();
  });
});
