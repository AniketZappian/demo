import { describe, expect, it } from 'vitest';
import { act, screen, within, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';
import { setDemoMode } from '../../rmx/demoMode';
import NewVerticalScreen from './NewVerticalScreen';

describe('NewVerticalScreen', () => {
  it('shows loading first', () => {
    renderWithProviders(<NewVerticalScreen />);
    expect(screen.getAllByRole('status', { name: 'Loading' }).length).toBeGreaterThan(0);
  });

  it('shows the error state', async () => {
    setDemoMode('error');
    renderWithProviders(<NewVerticalScreen />);
    expect((await screen.findAllByText(/Sample error/)).length).toBeGreaterThan(0);
  });

  it('shows the empty states', async () => {
    setDemoMode('empty');
    renderWithProviders(<NewVerticalScreen />);
    expect(await screen.findByText('No checklist steps.')).toBeInTheDocument();
    expect(await screen.findByText('No drafts yet.')).toBeInTheDocument();
  });

  it('shows the three checklist status labels', async () => {
    renderWithProviders(<NewVerticalScreen />);
    const table = await screen.findByRole('table', { name: 'Checklist' });
    expect(within(table).getAllByText('Done').length).toBe(2);
    expect(within(table).getAllByText('Waiting on Counsel').length).toBe(2);
    expect(within(table).getByText('Waiting on Tech lead')).toBeInTheDocument();
    expect(within(table).getAllByText('Not started').length).toBe(4);
  });

  it('as Config editor, a valid save appears in drafts', async () => {
    const { user } = renderWithProviders(<NewVerticalScreen />, { role: 'RMX_CONFIG_EDITOR' });
    await screen.findByRole('table', { name: 'Checklist' });
    await user.type(screen.getByLabelText('Name'), 'auto_loans');
    await user.click(screen.getByRole('button', { name: 'Save draft' }));
    const drafts = await screen.findByRole('table', { name: 'Saved drafts' });
    await waitFor(() => expect(within(drafts).getByText('auto_loans')).toBeInTheDocument());
    expect(within(drafts).getByText('editor@example.com')).toBeInTheDocument();
  });

  it('shows the field error for name "Bad Name"', async () => {
    const { user } = renderWithProviders(<NewVerticalScreen />, { role: 'RMX_CONFIG_EDITOR' });
    await screen.findByRole('table', { name: 'Checklist' });
    await user.type(screen.getByLabelText('Name'), 'Bad Name');
    await user.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(await screen.findByText('Use lower-case letters and underscores only.')).toBeInTheDocument();
  });

  it('disables Save draft for Operator', async () => {
    renderWithProviders(<NewVerticalScreen />, { role: 'RMX_OPERATOR' });
    await screen.findByRole('table', { name: 'Checklist' });
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled();
  });

  it('shows a publishers read failure with a retry in the form', async () => {
    setDemoMode('error');
    renderWithProviders(<NewVerticalScreen />, { role: 'RMX_CONFIG_EDITOR' });
    const form = (await screen.findByText('Start a new vertical')).parentElement;
    expect(await within(form).findByText(/Sample error/)).toBeInTheDocument();
    expect(within(form).getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('renders a non-field save failure in an alert', async () => {
    const { user } = renderWithProviders(<NewVerticalScreen />, { role: 'RMX_CONFIG_EDITOR' });
    await screen.findByRole('table', { name: 'Checklist' });
    await user.type(screen.getByLabelText('Name'), 'auto_loans');
    act(() => setDemoMode('error'));
    await user.click(screen.getByRole('button', { name: 'Save draft' }));
    const form = screen.getByText('Start a new vertical').parentElement;
    expect(await within(form).findAllByRole('alert')).not.toHaveLength(0);
    expect(within(form).getAllByText(/Sample error/).length).toBeGreaterThan(0);
  });
});
