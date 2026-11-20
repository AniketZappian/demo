import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';
import { rmxCall, R } from '../../../rmx/store';
import OfferRulesTab from './OfferRulesTab';

async function getOffer(id) {
  const { data } = await rmxCall(R.offers, {});
  return data.find((o) => o.offerId === id);
}

describe('OfferRulesTab', () => {
  it('shows before/after for a changed minDebt and Apply adds an audit row', async () => {
    const offer = await getOffer('dg-101');
    const { user } = renderWithProviders(<OfferRulesTab offer={offer} />, { role: 'RMX_OPERATOR' });
    const field = screen.getByLabelText('Minimum debt');
    await user.clear(field);
    await user.type(field, '15000');
    await user.click(screen.getByRole('button', { name: 'Review changes' }));
    const dialog = await screen.findByRole('dialog');
    const table = await within(dialog).findByRole('table', { name: 'Changes' });
    expect(within(table).getByText('Min debt')).toBeInTheDocument();
    expect(within(table).getByText('10000')).toBeInTheDocument();
    expect(within(table).getByText('15000')).toBeInTheDocument();
    expect(within(table).queryByText('Is new')).not.toBeInTheDocument();
    const before = (await rmxCall(R.audit, { offerId: 'dg-101' })).data.length;
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    await screen.findByText('Applied.');
    const rows = (await rmxCall(R.audit, { offerId: 'dg-101' })).data;
    expect(rows.length).toBe(before + 1);
  });

  it('disables Review changes for a Viewer', async () => {
    const offer = await getOffer('dg-101');
    renderWithProviders(<OfferRulesTab offer={offer} />, { role: 'RMX_VIEWER' });
    expect(screen.getByRole('button', { name: 'Review changes' })).toBeDisabled();
  });

  it('shows payday fields and MLA compliant as hubctl only', async () => {
    const offer = await getOffer('sp-201');
    renderWithProviders(<OfferRulesTab offer={offer} />, { role: 'RMX_OPERATOR' });
    expect(screen.getByLabelText('Minimum loan amount')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'MLA compliant' })).toBeDisabled();
    expect(screen.getByText('stays in hubctl (Decision 5)')).toBeInTheDocument();
    expect(screen.getByText('Assumed until the Swift form fixes it')).toBeInTheDocument();
  });

  it('shows the validation error in the dialog for pConv 2', async () => {
    const offer = await getOffer('dg-101');
    const { user } = renderWithProviders(<OfferRulesTab offer={offer} />, { role: 'RMX_OPERATOR' });
    const field = screen.getByLabelText('pConv');
    await user.clear(field);
    await user.type(field, '2');
    await user.click(screen.getByRole('button', { name: 'Review changes' }));
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Enter a number from 0 to 1, or leave empty.')).toBeInTheDocument();
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('Check the highlighted fields.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('flags a bad excluded state on its own field', async () => {
    const offer = await getOffer('dg-101');
    const { user } = renderWithProviders(<OfferRulesTab offer={offer} />, { role: 'RMX_OPERATOR' });
    const field = screen.getByLabelText('Excluded states');
    await user.clear(field);
    await user.type(field, 'NY, Texas');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Use two-letter state codes: Texas')).toBeInTheDocument();
    expect(screen.getByLabelText('pConv')).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('flags a negative money field on payday', async () => {
    const offer = await getOffer('sp-201');
    const { user } = renderWithProviders(<OfferRulesTab offer={offer} />, { role: 'RMX_OPERATOR' });
    const field = screen.getByLabelText('Minimum loan amount');
    await user.clear(field);
    await user.type(field, '-5');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Enter a number, 0 or more.')).toBeInTheDocument();
  });
});
