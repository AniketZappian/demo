import { describe, it, expect } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';
import { rmxCall, R } from '../../../rmx/store';
import OfferDetailsTab from './OfferDetailsTab';

async function getOffer(id) {
  const res = await rmxCall(R.offers, {});
  return res.data.find((o) => o.offerId === id);
}

async function setup(id, role) {
  const offer = await getOffer(id);
  const utils = renderWithProviders(<OfferDetailsTab offer={offer} />, { role });
  return { offer, ...utils };
}

describe('OfferDetailsTab', () => {
  it('Pause on dg-101 opens the dialog with Cancel focused and Apply calls the store', async () => {
    const { user } = await setup('dg-101', 'RMX_OPERATOR');
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(within(dialog).getByText('paused')).toBeInTheDocument());
    expect(within(dialog).getByText('active')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const audit = (await rmxCall(R.audit, { offerId: 'dg-101' })).data;
    expect(audit[0].after).toEqual({ operatorStatus: 'paused' });
    expect((await getOffer('dg-101')).operatorStatus).toBe('paused');
  });

  it('Resume on dg-104 shows the data-pass error in the dialog', async () => {
    const { user } = await setup('dg-104', 'RMX_OPERATOR');
    await user.click(screen.getByRole('button', { name: 'Resume' }));
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText(/cannot go live without counsel approval/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('qa-test-1 shows the QA error', async () => {
    const { user } = await setup('qa-test-1', 'RMX_OPERATOR');
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('The QA test offer is not editable.')).toBeInTheDocument();
  });

  it('Viewer sees Pause disabled', async () => {
    await setup('dg-101', 'RMX_VIEWER');
    expect(screen.getByRole('button', { name: 'Pause' })).toBeDisabled();
  });

  it('cap change sends only dailyCap', async () => {
    const { user } = await setup('dg-101', 'RMX_OPERATOR');
    const cap = screen.getByLabelText('Daily cap');
    await user.clear(cap);
    await user.type(cap, '250');
    await user.click(screen.getByRole('button', { name: 'Review change' }));
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('250')).toBeInTheDocument();
    const table = within(dialog).getByRole('table', { name: 'Changes' });
    expect(within(table).getByText('Daily cap')).toBeInTheDocument();
    expect(within(table).queryByText('Daily budget')).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const audit = (await rmxCall(R.audit, { offerId: 'dg-101' })).data;
    expect(audit[0].after).toEqual({ dailyCap: 250 });
  });

  it('Review change is disabled until the cap or budget differs', async () => {
    const { user } = await setup('dg-101', 'RMX_OPERATOR');
    const button = screen.getByRole('button', { name: 'Review change' });
    expect(button).toBeDisabled();
    const cap = screen.getByLabelText('Daily cap');
    await user.type(cap, '1');
    expect(screen.getByRole('button', { name: 'Review change' })).toBeEnabled();
  });

  it('shows hubctl flags, website fields and the payday MLA flag', async () => {
    await setup('sp-201', 'RMX_OPERATOR');
    expect(screen.getByText('Counsel approved')).toBeInTheDocument();
    expect(screen.getByText('MLA compliant')).toBeInTheDocument();
    expect(screen.getAllByText('stays in hubctl (Decision 5)').length).toBe(2);
    expect(screen.getByText('Website fields')).toBeInTheDocument();
    expect(screen.getByText('Change this on the website.')).toBeInTheDocument();
  });
});
