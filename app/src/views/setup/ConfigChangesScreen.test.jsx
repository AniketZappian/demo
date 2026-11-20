import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';
import { setDemoMode } from '../../rmx/demoMode';
import { R, rmxCall } from '../../rmx/store';
import ConfigChangesScreen from './ConfigChangesScreen';

const EDITOR = { email: 'editor@example.com', role: 'RMX_CONFIG_EDITOR' };
const APPROVER = { email: 'approver@example.com', role: 'RMX_APPROVER' };

const detail = () => screen.getByRole('region', { name: 'Draft detail' });
const buttonIn = (name) => within(detail()).getByRole('button', { name });

describe('ConfigChangesScreen states', () => {
  it('shows the loading state', async () => {
    renderWithProviders(<ConfigChangesScreen />, { role: 'RMX_CONFIG_EDITOR' });
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    await screen.findByText('Block WV for debt');
  });

  it('shows the error state with Retry', async () => {
    setDemoMode('error');
    renderWithProviders(<ConfigChangesScreen />, { role: 'RMX_CONFIG_EDITOR' });
    expect(await screen.findByText('Sample error: the RedirectMax internal API did not answer.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    setDemoMode('empty');
    renderWithProviders(<ConfigChangesScreen />, { role: 'RMX_CONFIG_EDITOR' });
    expect(await screen.findByText('No drafts yet.')).toBeInTheDocument();
  });

  it('shows the drafts table on success', async () => {
    renderWithProviders(<ConfigChangesScreen />, { role: 'RMX_CONFIG_EDITOR' });
    expect(await screen.findByText('Raise confidence gate to 0.03')).toBeInTheDocument();
    expect(screen.getByText('Block WV for debt')).toBeInTheDocument();
    expect(screen.getByText('Tighten payday Jev wording')).toBeInTheDocument();
    expect(screen.getByText(/Merging in this demo is simulated/)).toBeInTheDocument();
  });
});

describe('ConfigChangesScreen route', () => {
  it('lets a Config editor create a gate 0.03 draft and validate it', async () => {
    const { user } = renderWithProviders(<ConfigChangesScreen />, { role: 'RMX_CONFIG_EDITOR' });
    await screen.findByText('Block WV for debt');
    await user.click(screen.getByRole('button', { name: 'New draft' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Title/), 'Gate to 0.03 again');
    await user.click(within(dialog).getByRole('combobox', { name: /Kind/ }));
    await user.click(await screen.findByRole('option', { name: 'Gate' }));
    expect(within(dialog).getByLabelText(/Target/)).toHaveValue('global');
    await user.type(within(dialog).getByLabelText(/Value/), '0.03');
    await user.click(within(dialog).getByRole('button', { name: 'Save draft' }));

    expect(await within(await screen.findByRole('region', { name: 'Draft detail' })).findByText('Gate to 0.03 again')).toBeInTheDocument();
    await user.click(buttonIn('Validate'));
    expect(await within(detail()).findByText('gate change: needs owner approval')).toBeInTheDocument();
    expect(within(detail()).getByText('+ confidence_gate: 0.03')).toBeInTheDocument();
  });

  it('opens the dialog prefilled from the query string', async () => {
    renderWithProviders(<ConfigChangesScreen />, { role: 'RMX_CONFIG_EDITOR', path: '/?kind=question_set&target=standard' });
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText(/Target/)).toHaveValue('standard');
    expect(within(dialog).getByRole('combobox', { name: /Kind/ })).toHaveTextContent('Question set');
  });

  it('lets an Approver approve cfg-d-2 only with a counsel reference, which opens the pull request', async () => {
    const { user } = renderWithProviders(<ConfigChangesScreen />, { role: 'RMX_APPROVER' });
    await user.click(await screen.findByText('Block WV for debt'));
    await user.click(buttonIn('Approve and open PR'));
    expect(await within(detail()).findByText('Enter the counsel reference.')).toBeInTheDocument();

    await user.type(within(detail()).getByLabelText('Counsel reference'), 'CR-2026-014');
    await user.click(buttonIn('Approve and open PR'));
    expect(await within(detail()).findByText(/Pull request #241 opened automatically/)).toBeInTheDocument();
    expect(within(detail()).getByText(/Approved by approver@example.com/)).toBeInTheDocument();
    expect(within(detail()).getByText(/Approved by approver@example.com at/)).toHaveTextContent('Counsel reference: CR-2026-014');
    expect(within(detail()).getByLabelText('PR description')).toHaveTextContent('CR-2026-014');
    expect(within(detail()).getByText('New file text (config/router.json)')).toBeInTheDocument();
  });

  it('lets an Approver reject cfg-d-2 only with a reason', async () => {
    const { user } = renderWithProviders(<ConfigChangesScreen />, { role: 'RMX_APPROVER' });
    await user.click(await screen.findByText('Block WV for debt'));
    await user.click(buttonIn('Reject'));
    expect(await within(detail()).findByText('Enter a reason.')).toBeInTheDocument();
    await user.type(within(detail()).getByLabelText('Reason, if rejecting'), 'Counsel has not signed off.');
    await user.click(buttonIn('Reject'));
    expect(await within(detail()).findByText(/Rejected by approver@example.com/)).toBeInTheDocument();
    expect(buttonIn('Approve and open PR')).toBeDisabled();
  });

  it('disables Approve and Reject for a Config editor', async () => {
    const { user } = renderWithProviders(<ConfigChangesScreen />, { role: 'RMX_CONFIG_EDITOR' });
    await user.click(await screen.findByText('Block WV for debt'));
    expect(buttonIn('Approve and open PR')).toBeDisabled();
    expect(buttonIn('Reject')).toBeDisabled();
    expect(buttonIn('Validate')).toBeEnabled();
  });

  it('disables Validate, and review of an unvalidated draft, for an Approver', async () => {
    const { user } = renderWithProviders(<ConfigChangesScreen />, { role: 'RMX_APPROVER' });
    await user.click(await screen.findByText('Raise confidence gate to 0.03'));
    expect(buttonIn('Validate')).toBeDisabled();
    expect(buttonIn('Approve and open PR')).toBeDisabled();
  });

  it('shows the pull request with the coloured diff after approval', async () => {
    await rmxCall(R.configValidate, { id: 'cfg-d-1' }, EDITOR);
    await rmxCall(R.configApprove, { id: 'cfg-d-1' }, APPROVER);
    const { user } = renderWithProviders(<ConfigChangesScreen />, { role: 'RMX_CONFIG_EDITOR' });
    await user.click(await screen.findByText('Raise confidence gate to 0.03'));

    const removed = await within(detail()).findByText('- confidence_gate: 0.02');
    const added = within(detail()).getByText('+ confidence_gate: 0.03');
    expect(removed).toHaveAttribute('data-diff', 'remove');
    expect(added).toHaveAttribute('data-diff', 'add');
    expect(within(detail()).getByLabelText('PR title')).toHaveTextContent('config: Raise confidence gate to 0.03');
    expect(within(detail()).getByLabelText('PR description')).toHaveTextContent('Approved by: approver@example.com');
  });

  it('shows the seeded open pull request cfg-d-3 and simulates the merge', async () => {
    const { user } = renderWithProviders(<ConfigChangesScreen />, { role: 'RMX_CONFIG_EDITOR' });
    await user.click(await screen.findByText('Tighten payday Jev wording'));
    expect(await within(detail()).findByLabelText('PR title')).toHaveTextContent('config: Tighten payday Jev wording');
    expect(within(detail()).getByLabelText('PR description')).not.toBeEmptyDOMElement();
    expect(within(detail()).getByLabelText('Pull request diff')).not.toBeEmptyDOMElement();
    expect(within(detail()).getByText(/Pull request #238 opened automatically/)).toBeInTheDocument();
    await user.click(buttonIn('Demo: simulate merge'));
    expect(await within(detail()).findByText(/Merged and live\. Both decide servers report config version cfg-/)).toBeInTheDocument();
  });

  it('creates a blocked_states draft with an empty value (unblock all)', async () => {
    const { user } = renderWithProviders(<ConfigChangesScreen />, { role: 'RMX_CONFIG_EDITOR' });
    await screen.findByText('Block WV for debt');
    await user.click(screen.getByRole('button', { name: 'New draft' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Title/), 'Unblock everything');
    await user.click(within(dialog).getByRole('combobox', { name: /Kind/ }));
    await user.click(await screen.findByRole('option', { name: 'Blocked states' }));
    await user.type(within(dialog).getByLabelText(/Target/), 'global');
    await user.click(within(dialog).getByRole('button', { name: 'Save draft' }));
    const region = await screen.findByRole('region', { name: 'Draft detail' });
    expect(await within(region).findByText('Unblock everything')).toBeInTheDocument();
    expect(within(region).getByLabelText('Proposed value')).toHaveTextContent('{"blocked_states":[]}');
  });

  it('still requires a value for a gate draft', async () => {
    const { user } = renderWithProviders(<ConfigChangesScreen />, { role: 'RMX_CONFIG_EDITOR' });
    await screen.findByText('Block WV for debt');
    await user.click(screen.getByRole('button', { name: 'New draft' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Title/), 'No value');
    await user.click(within(dialog).getByRole('combobox', { name: /Kind/ }));
    await user.click(await screen.findByRole('option', { name: 'Gate' }));
    await user.click(within(dialog).getByRole('button', { name: 'Save draft' }));
    expect(await within(dialog).findByText('Enter a value.')).toBeInTheDocument();
  });
});
