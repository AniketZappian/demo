export const ROLES = ['RMX_VIEWER', 'RMX_OPERATOR', 'RMX_APPROVER', 'RMX_CONFIG_EDITOR', 'RMX_SUPER_ADMIN'];

export const ROLE_LABELS = {
  RMX_VIEWER: 'Viewer',
  RMX_OPERATOR: 'Operator',
  RMX_APPROVER: 'Approver',
  RMX_CONFIG_EDITOR: 'Config editor',
  RMX_SUPER_ADMIN: 'Super admin',
};

export const ROLE_USERS = {
  RMX_VIEWER: 'viewer@example.com',
  RMX_OPERATOR: 'operator@example.com',
  RMX_APPROVER: 'approver@example.com',
  RMX_CONFIG_EDITOR: 'editor@example.com',
  RMX_SUPER_ADMIN: 'admin@example.com',
};

export const ACTIONS = {
  SIMULATE: 'simulate',
  OFFER_CATALOG: 'offer.catalog',
  OFFER_RULES: 'offer.rules',
  PAYOUT_PROPOSE: 'payout.propose',
  PAYOUT_DECIDE: 'payout.decide',
  CONFIG_DRAFT: 'config.draft',
  CONFIG_APPROVE: 'config.approve',
  CONFIG_REJECT: 'config.reject',
  REVIEW_VIEW: 'review.view',
};

// The Super admin can do everything, but the same-person rules still apply:
// nobody approves a payout they proposed or a config draft they drafted.
const SA = 'RMX_SUPER_ADMIN';
const PERMISSIONS = {
  simulate: { roles: ROLES, verb: 'run the simulator' },
  'offer.catalog': { roles: ['RMX_OPERATOR', SA], verb: 'pause, resume or change caps and budgets' },
  'offer.rules': { roles: ['RMX_OPERATOR', SA], verb: 'change offer rules' },
  'payout.propose': { roles: ['RMX_OPERATOR', SA], verb: 'propose payouts' },
  'payout.decide': { roles: ['RMX_APPROVER', SA], verb: 'approve or reject payouts' },
  'config.draft': { roles: ['RMX_CONFIG_EDITOR', SA], verb: 'draft or validate config and vertical changes' },
  'config.approve': { roles: ['RMX_APPROVER', SA], verb: 'approve config drafts' },
  'config.reject': { roles: ['RMX_APPROVER', SA], verb: 'reject config drafts' },
  'review.view': { roles: ['RMX_APPROVER', SA], verb: 'review waiting changes' },
};

export function can(role, action) {
  const p = PERMISSIONS[action];
  return Boolean(p && p.roles.includes(role));
}

export function deniedReason(role, action) {
  const p = PERMISSIONS[action];
  const label = ROLE_LABELS[role] ?? String(role);
  return `${label} cannot ${p ? p.verb : action}.`;
}
