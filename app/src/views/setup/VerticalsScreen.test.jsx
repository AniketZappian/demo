import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setDemoMode } from '../../rmx/demoMode';
import { renderWithProviders } from '../../test/render';
import VerticalsScreen from './VerticalsScreen';

const card = (name) => screen.getByRole('region', { name });

describe('VerticalsScreen', () => {
  it('shows loading first', async () => {
    renderWithProviders(<VerticalsScreen />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    await screen.findByRole('region', { name: 'debt' });
  });

  it('shows one card per vertical with status, blocked states and the MLA flag', async () => {
    renderWithProviders(<VerticalsScreen />);
    expect(screen.getByRole('heading', { name: 'Verticals' })).toBeInTheDocument();
    await screen.findByRole('region', { name: 'debt' });
    const debt = card('debt');
    expect(within(debt).getByText('Live')).toBeInTheDocument();
    expect(within(debt).queryByText('Draft: not live')).not.toBeInTheDocument();
    expect(within(debt).getByText('None')).toBeInTheDocument();
    const payday = card('payday');
    expect(within(payday).getByText('Draft')).toBeInTheDocument();
    expect(within(payday).getByText('Draft: not live')).toBeInTheDocument();
    expect(within(payday).getByText('None')).toBeInTheDocument();
    expect(within(payday).getByRole('checkbox')).toBeDisabled();
    expect(within(payday).getByText('stays in hubctl (Decision 5)')).toBeInTheDocument();
    expect(screen.getByText('Change via Config changes.')).toBeInTheDocument();
  });

  it('shows the empty text', async () => {
    setDemoMode('empty');
    renderWithProviders(<VerticalsScreen />);
    expect(await screen.findByText('No verticals.')).toBeInTheDocument();
  });

  it('shows the error with Retry', async () => {
    setDemoMode('error');
    renderWithProviders(<VerticalsScreen />);
    expect(await screen.findByText(/Sample error: the RedirectMax internal API did not answer\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
