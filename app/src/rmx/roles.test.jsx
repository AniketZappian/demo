import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ROLES, ROLE_LABELS, ROLE_USERS, ACTIONS, can, deniedReason } from './roles';
import { RoleProvider, useRole } from './RoleContext';
import { DEMO_MODES, getDemoMode, setDemoMode, subscribeDemoMode, useDemoMode } from './demoMode';

const SA = 'RMX_SUPER_ADMIN';
const ALL = ['RMX_VIEWER', 'RMX_OPERATOR', 'RMX_APPROVER', 'RMX_CONFIG_EDITOR', SA];
const TABLE = {
  simulate: [ALL, 'run the simulator'],
  'offer.catalog': [['RMX_OPERATOR', SA], 'pause, resume or change caps and budgets'],
  'offer.rules': [['RMX_OPERATOR', SA], 'change offer rules'],
  'payout.propose': [['RMX_OPERATOR', SA], 'propose payouts'],
  'payout.decide': [['RMX_APPROVER', SA], 'approve or reject payouts'],
  'config.draft': [['RMX_CONFIG_EDITOR', SA], 'draft or validate config and vertical changes'],
  'config.approve': [['RMX_APPROVER', SA], 'approve config drafts'],
  'config.reject': [['RMX_APPROVER', SA], 'reject config drafts'],
  'review.view': [['RMX_APPROVER', SA], 'review waiting changes'],
};
const LABELS = { RMX_VIEWER: 'Viewer', RMX_OPERATOR: 'Operator', RMX_APPROVER: 'Approver', RMX_CONFIG_EDITOR: 'Config editor', [SA]: 'Super admin' };
const EMAILS = { RMX_VIEWER: 'viewer@example.com', RMX_OPERATOR: 'operator@example.com', RMX_APPROVER: 'approver@example.com', RMX_CONFIG_EDITOR: 'editor@example.com', [SA]: 'admin@example.com' };

describe('roles', () => {
  it('exports constants', () => {
    expect(ROLES).toEqual(ALL);
    expect(ROLE_LABELS).toEqual(LABELS);
    expect(ROLE_USERS).toEqual(EMAILS);
    expect(Object.values(ACTIONS).sort()).toEqual(Object.keys(TABLE).sort());
  });

  const cases = [];
  for (const [action, [allowed]] of Object.entries(TABLE)) {
    for (const role of ALL) cases.push([role, action, allowed.includes(role)]);
  }
  it.each(cases)('%s / %s -> %s', (role, action, expected) => {
    expect(can(role, action)).toBe(expected);
  });

  it.each(cases)('deniedReason %s / %s', (role, action) => {
    expect(deniedReason(role, action)).toBe(`${LABELS[role]} cannot ${TABLE[action][1]}.`);
  });

  it('denies unknown role or action', () => {
    expect(can('NOPE', 'simulate')).toBe(false);
    expect(can('RMX_OPERATOR', 'nope')).toBe(false);
  });
});

function Probe() {
  const r = useRole();
  return (
    <div>
      <span data-testid="role">{r.role}</span>
      <span data-testid="label">{r.label}</span>
      <span data-testid="email">{r.email}</span>
      <span data-testid="can">{String(r.can('payout.decide'))}</span>
      <span data-testid="why">{r.deniedReason('payout.decide')}</span>
      <button onClick={() => r.setRole('RMX_APPROVER')}>switch</button>
    </div>
  );
}

describe('RoleProvider', () => {
  it('defaults to operator', () => {
    render(<RoleProvider><Probe /></RoleProvider>);
    expect(screen.getByTestId('role')).toHaveTextContent('RMX_OPERATOR');
    expect(screen.getByTestId('email')).toHaveTextContent('operator@example.com');
    expect(screen.getByTestId('can')).toHaveTextContent('false');
    expect(screen.getByTestId('why')).toHaveTextContent('Operator cannot approve or reject payouts.');
  });

  it('setRole switches role, label and email', async () => {
    const user = userEvent.setup();
    render(<RoleProvider initialRole="RMX_VIEWER"><Probe /></RoleProvider>);
    expect(screen.getByTestId('email')).toHaveTextContent('viewer@example.com');
    await user.click(screen.getByText('switch'));
    expect(screen.getByTestId('label')).toHaveTextContent('Approver');
    expect(screen.getByTestId('email')).toHaveTextContent('approver@example.com');
    expect(screen.getByTestId('can')).toHaveTextContent('true');
  });
});

describe('demo mode', () => {
  afterEach(() => act(() => setDemoMode('normal')));

  it('has modes and a default', () => {
    expect(DEMO_MODES).toEqual(['normal', 'slow', 'empty', 'error']);
    expect(getDemoMode()).toBe('normal');
  });

  it('notifies subscribers and unsubscribes', () => {
    const fn = vi.fn();
    const off = subscribeDemoMode(fn);
    setDemoMode('slow');
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    setDemoMode('error');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('useDemoMode re-renders on setDemoMode', () => {
    function M() {
      const [mode] = useDemoMode();
      return <span data-testid="mode">{mode}</span>;
    }
    render(<M />);
    expect(screen.getByTestId('mode')).toHaveTextContent('normal');
    act(() => setDemoMode('empty'));
    expect(screen.getByTestId('mode')).toHaveTextContent('empty');
  });
});
