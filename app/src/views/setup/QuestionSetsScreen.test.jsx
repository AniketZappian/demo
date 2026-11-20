import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { Routes, Route, useLocation } from 'react-router-dom';
import QuestionSetsScreen from './QuestionSetsScreen';
import { renderWithProviders } from '../../test/render';
import { setDemoMode } from '../../rmx/demoMode';

function Where() {
  const loc = useLocation();
  return <div data-testid="where">{loc.pathname + loc.search}</div>;
}

const ui = (
  <Routes>
    <Route path="/redirectmax/setup/question-sets" element={<QuestionSetsScreen />} />
    <Route path="/redirectmax/setup/config" element={<Where />} />
  </Routes>
);
const path = '/redirectmax/setup/question-sets';

describe('QuestionSetsScreen', () => {
  it('shows the loading state first', () => {
    renderWithProviders(ui, { path });
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('shows the error state', async () => {
    setDemoMode('error');
    renderWithProviders(ui, { path });
    expect(await screen.findByText(/Sample error/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    setDemoMode('empty');
    renderWithProviders(ui, { path });
    expect(await screen.findByText('No question sets.')).toBeInTheDocument();
  });

  it('shows the form facts and the four sets with field chips', async () => {
    renderWithProviders(ui, { path });
    const t = await screen.findByRole('table', { name: 'Question sets' });
    expect(screen.getByRole('heading', { name: 'Question sets' })).toBeInTheDocument();
    expect(within(t).getAllByRole('row')).toHaveLength(5);
    ['standard', 'settlement_ready', 'low_debt', 'hardship'].forEach((id) => {
      expect(within(t).getByText(id)).toBeInTheDocument();
    });
    expect(within(t).getAllByText('owns_home').length).toBeGreaterThan(0);
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getAllByText('debt_types').length).toBeGreaterThan(0);
    expect(screen.getByText('Counsel reviews changes.')).toBeInTheDocument();
  });

  it('navigates to a prefilled config draft for a Config editor', async () => {
    const { user } = renderWithProviders(ui, { path, role: 'RMX_CONFIG_EDITOR' });
    const t = await screen.findByRole('table', { name: 'Question sets' });
    const row = within(t).getByText('low_debt').closest('tr');
    await user.click(within(row).getByRole('button', { name: 'Draft a change' }));
    expect(await screen.findByTestId('where')).toHaveTextContent(
      '/redirectmax/setup/config?kind=question_set&target=low_debt',
    );
  });

  it('disables Draft a change for an Operator', async () => {
    renderWithProviders(ui, { path, role: 'RMX_OPERATOR' });
    const t = await screen.findByRole('table', { name: 'Question sets' });
    const buttons = within(t).getAllByRole('button', { name: 'Draft a change' });
    expect(buttons).toHaveLength(4);
    buttons.forEach((b) => expect(b).toBeDisabled());
  });
});
