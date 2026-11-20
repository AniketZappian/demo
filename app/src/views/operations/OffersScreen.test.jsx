import { describe, it, expect } from 'vitest';
import { act, screen, within, waitFor } from '@testing-library/react';
import OffersScreen from './OffersScreen';
import { renderWithProviders } from '../../test/render';
import { setDemoMode } from '../../rmx/demoMode';

const table = () => screen.findByRole('table', { name: 'Offers' });
const rowOf = (t, id) => within(t).getByText(id).closest('tr');

describe('OffersScreen', () => {
  it('shows the loading state first', () => {
    renderWithProviders(<OffersScreen />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('shows the error state', async () => {
    setDemoMode('error');
    renderWithProviders(<OffersScreen />);
    expect(await screen.findByText(/Sample error/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    setDemoMode('empty');
    renderWithProviders(<OffersScreen />);
    expect(await screen.findByText('No offers match.')).toBeInTheDocument();
  });

  it('lists offers and marks dg-102 as Capped', async () => {
    renderWithProviders(<OffersScreen />);
    const t = await table();
    expect(screen.getByRole('heading', { name: 'Offers' })).toBeInTheDocument();
    expect(within(rowOf(t, 'dg-102')).getByText('Capped')).toBeInTheDocument();
    expect(within(rowOf(t, 'dg-101')).queryByText('Capped')).not.toBeInTheDocument();
    expect(within(rowOf(t, 'dg-101')).getByText('CPL $42.50')).toBeInTheDocument();
  });

  it('filters by vertical', async () => {
    const { user } = renderWithProviders(<OffersScreen />);
    const t = await table();
    expect(within(t).getByText('sp-201')).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Vertical' }));
    await user.click(await screen.findByRole('option', { name: 'payday' }));
    await waitFor(() => expect(within(screen.getByRole('table', { name: 'Offers' })).queryByText('dg-101')).not.toBeInTheDocument());
    expect(within(screen.getByRole('table', { name: 'Offers' })).getByText('sp-201')).toBeInTheDocument();
  });

  it('opens the drawer on a row click and Pause + Apply turns the row to Paused', async () => {
    const { user } = renderWithProviders(<OffersScreen />);
    const t = await table();
    expect(within(rowOf(t, 'dg-101')).getByText('Active')).toBeInTheDocument();
    await user.click(within(t).getByText('dg-101'));
    expect(await screen.findByRole('tab', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Rules' })).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Pause' }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(within(dialog).getByText('paused')).toBeInTheDocument());
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    // The modal drawer hides the page behind it from the accessibility tree.
    await waitFor(() => expect(within(rowOf(screen.getByRole('table', { name: 'Offers', hidden: true }), 'dg-101')).getByText('Paused')).toBeInTheDocument());
    expect(await screen.findByRole('button', { name: 'Resume' })).toBeInTheDocument();
  });

  it('shows No cap, not None, for a null daily cap and cap remaining', async () => {
    renderWithProviders(<OffersScreen />);
    const t = await table();
    const row = rowOf(t, 'dg-106');
    expect(within(row).getAllByText('No cap')).toHaveLength(2);
    expect(within(row).queryByText('None')).not.toBeInTheDocument();
  });

  it('keeps the drawer on the latest copy when data goes null after a pause', async () => {
    const { user } = renderWithProviders(<OffersScreen />);
    const t = await table();
    await user.click(within(t).getByText('dg-101'));
    await user.click(await screen.findByRole('button', { name: 'Pause' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(await within(dialog).findByRole('button', { name: 'Apply' }));
    expect(await screen.findByRole('button', { name: 'Resume' })).toBeInTheDocument();
    act(() => setDemoMode('error'));
    expect(await screen.findByText(/Sample error/, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
  });
});
