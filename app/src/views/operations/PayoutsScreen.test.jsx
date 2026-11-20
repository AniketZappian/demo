import { describe, expect, it } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';
import { setDemoMode } from '../../rmx/demoMode';
import PayoutsScreen from './PayoutsScreen';

const OWN = 'You proposed this change; another approver must decide it.';

async function pendingRow(id) {
  const table = await screen.findByRole('table', { name: 'Pending' });
  return within(table).getByText(id).closest('tr');
}

describe('PayoutsScreen', () => {
  it('shows loading first', () => {
    renderWithProviders(<PayoutsScreen />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('shows the error state', async () => {
    setDemoMode('error');
    renderWithProviders(<PayoutsScreen />);
    expect(await screen.findByText(/Sample error/)).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    setDemoMode('empty');
    renderWithProviders(<PayoutsScreen />);
    expect(await screen.findByText('No payout proposals.')).toBeInTheDocument();
  });

  it('lists pending and history', async () => {
    renderWithProviders(<PayoutsScreen />, { role: 'RMX_VIEWER' });
    const pending = await screen.findByRole('table', { name: 'Pending' });
    expect(within(pending).getByText('pc-1')).toBeInTheDocument();
    expect(within(pending).getByText('pc-2')).toBeInTheDocument();
    const history = screen.getByRole('table', { name: 'History' });
    expect(within(history).getByText('pc-3')).toBeInTheDocument();
    expect(within(history).getByText('pc-4')).toBeInTheDocument();
  });

  it('as Approver disables Approve on own proposal pc-2 with the reason', async () => {
    renderWithProviders(<PayoutsScreen />, { role: 'RMX_APPROVER' });
    const row = await pendingRow('pc-2');
    expect(within(row).getByRole('button', { name: 'Approve' })).toBeDisabled();
    expect(within(row).getAllByLabelText(OWN).length).toBeGreaterThan(0);
  });

  it('as Approver, approving pc-1 moves it to History', async () => {
    const { user } = renderWithProviders(<PayoutsScreen />, { role: 'RMX_APPROVER' });
    const row = await pendingRow('pc-1');
    await user.click(within(row).getByRole('button', { name: 'Approve' }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Apply' })).toBeEnabled());
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    await waitFor(() => {
      const history = screen.getByRole('table', { name: 'History' });
      expect(within(history).getByText('pc-1')).toBeInTheDocument();
    });
    const pending = screen.getByRole('table', { name: 'Pending' });
    expect(within(pending).queryByText('pc-1')).not.toBeInTheDocument();
    expect(await screen.findByText('Applied.')).toBeInTheDocument();
  });

  it('Reject dialog focuses Cancel', async () => {
    const { user } = renderWithProviders(<PayoutsScreen />, { role: 'RMX_APPROVER' });
    const row = await pendingRow('pc-1');
    await user.click(within(row).getByRole('button', { name: 'Reject' }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus());
  });

  it('as Operator, Approve is disabled and Propose works', async () => {
    const { user } = renderWithProviders(<PayoutsScreen />, { role: 'RMX_OPERATOR' });
    const row = await pendingRow('pc-1');
    expect(within(row).getByRole('button', { name: 'Approve' })).toBeDisabled();
    expect(within(row).getByRole('button', { name: 'Reject' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Propose a change' }));
    const form = await screen.findByRole('dialog', { name: 'Propose a payout change' });
    await user.click(within(form).getByRole('combobox', { name: 'Offer' }));
    await user.click(await screen.findByRole('option', { name: /dg-101/ }));
    await user.type(within(form).getByLabelText('Value'), '47');
    await user.type(within(form).getByLabelText('Note'), 'Test note');
    await user.click(within(form).getByRole('button', { name: 'Submit' }));
    const review = await screen.findByRole('dialog', { name: 'Review payout proposal' });
    await waitFor(() => expect(within(review).getByRole('button', { name: 'Apply' })).toBeEnabled());
    await user.click(within(review).getByRole('button', { name: 'Apply' }));
    await waitFor(() => {
      const pending = screen.getByRole('table', { name: 'Pending' });
      expect(within(pending).getByText('Test note')).toBeInTheDocument();
    });
  });

  it('keeps the form values when the review is cancelled, and clears them once applied', async () => {
    const { user } = renderWithProviders(<PayoutsScreen />, { role: 'RMX_OPERATOR' });
    await pendingRow('pc-1');
    await user.click(screen.getByRole('button', { name: 'Propose a change' }));
    let form = await screen.findByRole('dialog', { name: 'Propose a payout change' });
    await user.click(within(form).getByRole('combobox', { name: 'Offer' }));
    await user.click(await screen.findByRole('option', { name: /dg-101/ }));
    await user.type(within(form).getByLabelText('Value'), '47');
    await user.type(within(form).getByLabelText('Note'), 'Keep me');
    await user.click(within(form).getByRole('button', { name: 'Submit' }));
    let review = await screen.findByRole('dialog', { name: 'Review payout proposal' });
    await user.click(within(review).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Review payout proposal' })).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Propose a change' }));
    form = await screen.findByRole('dialog', { name: 'Propose a payout change' });
    expect(within(form).getByLabelText('Value')).toHaveValue(47);
    expect(within(form).getByLabelText('Note')).toHaveValue('Keep me');
    await user.click(within(form).getByRole('button', { name: 'Submit' }));
    review = await screen.findByRole('dialog', { name: 'Review payout proposal' });
    await waitFor(() => expect(within(review).getByRole('button', { name: 'Apply' })).toBeEnabled());
    await user.click(within(review).getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Review payout proposal' })).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Propose a change' }));
    form = await screen.findByRole('dialog', { name: 'Propose a payout change' });
    expect(within(form).getByLabelText('Value')).toHaveValue(null);
    expect(within(form).getByLabelText('Note')).toHaveValue('');
  });

  it('as Viewer, Propose and Approve are disabled', async () => {
    renderWithProviders(<PayoutsScreen />, { role: 'RMX_VIEWER' });
    const row = await pendingRow('pc-1');
    expect(within(row).getByRole('button', { name: 'Approve' })).toBeDisabled();
    expect(within(row).getByRole('button', { name: 'Reject' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Propose a change' })).toBeDisabled();
  });
});
