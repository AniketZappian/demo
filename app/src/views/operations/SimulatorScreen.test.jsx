import { screen, within } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { setDemoMode } from '../../rmx/demoMode';
import { renderWithProviders } from '../../test/render';
import SimulatorScreen from './SimulatorScreen';

describe('SimulatorScreen', () => {
  afterEach(() => act(() => setDemoMode('normal')));

  it('shows the title, caption and pre-run empty text', () => {
    renderWithProviders(<SimulatorScreen />);
    expect(screen.getByRole('heading', { name: 'Simulator' })).toBeInTheDocument();
    expect(screen.getByText('Enter inputs and run.')).toBeInTheDocument();
    expect(screen.getByText(/No Jev call\. Nothing is saved\./)).toBeInTheDocument();
  });

  it('shows vertical-dependent inputs', async () => {
    const { user } = renderWithProviders(<SimulatorScreen />);
    expect(screen.getByLabelText('Debt amount')).toBeInTheDocument();
    expect(screen.queryByLabelText('Loan amount')).not.toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Vertical' }));
    await user.click(await screen.findByRole('option', { name: /payday/ }));
    expect(screen.getByLabelText('Loan amount')).toBeInTheDocument();
    expect(screen.queryByLabelText('Debt amount')).not.toBeInTheDocument();
  });

  it('runs a debt simulation, showing loading then dg-103 failing operator_paused', async () => {
    const { user } = renderWithProviders(<SimulatorScreen />);
    await user.type(screen.getByLabelText('State'), 'CA');
    await user.type(screen.getByLabelText('Debt amount'), '20000');
    await user.click(screen.getByRole('button', { name: 'Run' }));
    const table = await screen.findByRole('table');
    const row = within(table).getByText('dg-103').closest('tr');
    expect(within(row).getByText('operator_paused')).toBeInTheDocument();
    expect(within(row).getByText('No')).toBeInTheDocument();
    expect(screen.queryByText('Enter inputs and run.')).not.toBeInTheDocument();
  });

  it('refuses a personal-data extra input with an alert', async () => {
    const { user } = renderWithProviders(<SimulatorScreen />);
    await user.type(screen.getByLabelText('Extra inputs'), 'email=x');
    await user.click(screen.getByRole('button', { name: 'Run' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Personal data keys are refused: email.');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('lets every role run it', async () => {
    renderWithProviders(<SimulatorScreen />, { role: 'RMX_VIEWER' });
    expect(screen.getByRole('button', { name: 'Run' })).toBeEnabled();
  });

  it('shows a loading status during a run', async () => {
    act(() => setDemoMode('slow'));
    const { user } = renderWithProviders(<SimulatorScreen />);
    await user.click(screen.getByRole('button', { name: 'Run' }));
    expect(await screen.findByRole('status', { name: 'Loading' })).toBeInTheDocument();
    await screen.findByRole('table', {}, { timeout: 4000 });
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
  });

  it('shows the sample error alert in error demo mode', async () => {
    act(() => setDemoMode('error'));
    const { user } = renderWithProviders(<SimulatorScreen />);
    await user.click(screen.getByRole('button', { name: 'Run' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sample error');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows an unknown-vertical alert in empty demo mode', async () => {
    act(() => setDemoMode('empty'));
    const { user } = renderWithProviders(<SimulatorScreen />);
    await user.click(screen.getByRole('button', { name: 'Run' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unknown vertical: debt.');
  });

  it('offers known values for employment status and pay frequency', async () => {
    const { user } = renderWithProviders(<SimulatorScreen />);
    expect(screen.queryByRole('textbox', { name: 'Employment status' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Employment status' }));
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Any', 'employed', 'self_employed']);
    await user.click(screen.getByRole('option', { name: 'employed' }));
    await user.click(screen.getByRole('button', { name: 'Run' }));
    const table = await screen.findByRole('table');
    expect(within(table).queryByText(/allowed_employment/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Vertical' }));
    await user.click(await screen.findByRole('option', { name: /payday/ }));
    await user.click(screen.getByRole('combobox', { name: 'Pay frequency' }));
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Any', 'weekly', 'biweekly', 'monthly']);
  });

  it('clears a refusal alert when the vertical changes', async () => {
    const { user } = renderWithProviders(<SimulatorScreen />);
    await user.type(screen.getByLabelText('Extra inputs'), 'email=x');
    await user.click(screen.getByRole('button', { name: 'Run' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Vertical' }));
    await user.click(await screen.findByRole('option', { name: /payday/ }));
    expect(screen.queryByRole('alert', { name: '' })).not.toHaveTextContent('Personal data keys');
    expect(screen.getByText('Enter inputs and run.')).toBeInTheDocument();
  });
});
