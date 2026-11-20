// In-memory stand-in for the RedirectMax internal API. Every read and action in the demo goes through rmxCall.
//
// Config draft fields: id, title, kind, target, proposed, status (draft | validated | approved | exported),
// createdBy, createdAt, validation ({ errors, warnings, diff } or null), approvedBy, approvedAt, counselRef, history.
// Set on export, and computed on read for an exported draft that has none (the seeded cfg-d-3):
//   prTitle (string), prBody (string, the pull request text), diff (array of '- path: old' / '+ path: new' lines).
// Statuses: draft -> validated -> pr_open (approval opens the pull request automatically) -> merged; or rejected.
// Merging is the tech lead's step in GitHub; the demo simulates it with configMerge.
import { can, deniedReason } from './roles';
import { getDemoMode } from './demoMode';
import { seedState, emptyState, DEMO_TODAY } from './sampleData';
import { dashboardSample, emptyDashboard } from './sampleDashboard';

export class RmxError extends Error {
  constructor(code, message, fields) {
    super(message);
    this.name = 'RmxError';
    this.code = code;
    if (fields) this.fields = fields;
  }
}

export const R = {
  dashboard: '/lds/dashboard/home',
  overview: '/lds/rmx/overview',
  offers: '/lds/rmx/offers',
  offerCatalog: '/lds/rmx/offers/catalog',
  offerRules: '/lds/rmx/offers/rules',
  payouts: '/lds/rmx/payouts',
  payoutPropose: '/lds/rmx/payouts/propose',
  payoutDecide: '/lds/rmx/payouts/decide',
  decisions: '/lds/rmx/decisions',
  simulate: '/lds/rmx/simulate',
  syncs: '/lds/rmx/catalog-syncs',
  reconciliation: '/lds/rmx/reconciliation',
  audit: '/lds/rmx/audit',
  verticals: '/lds/rmx/verticals',
  checklist: '/lds/rmx/verticals/checklist',
  verticalDrafts: '/lds/rmx/verticals/drafts',
  verticalDraftSave: '/lds/rmx/verticals/draft',
  configDrafts: '/lds/rmx/config/drafts',
  configSave: '/lds/rmx/config/draft/save',
  configValidate: '/lds/rmx/config/validate',
  configApprove: '/lds/rmx/config/approve',
  configReject: '/lds/rmx/config/reject',
  configMerge: '/lds/rmx/config/merge',
  reviewQueue: '/lds/rmx/review',
  questionSets: '/lds/rmx/question-sets',
  publishers: '/lds/rmx/publishers',
  settings: '/lds/rmx/settings',
};

const LATENCY_MS = 250;
const SLOW_EXTRA_MS = 1500;
const PERSONAL_KEYS = ['email', 'phone', 'ssn', 'first_name', 'last_name', 'address', 'dob', 'ip', 'lead_ref', 'visit_id'];
const normalKey = (k) => String(k).toLowerCase().replace(/_/g, '');
const PERSONAL_NORMAL = PERSONAL_KEYS.map(normalKey).concat('emailaddress');
const HUBCTL_KEYS = ['mlaCompliant', 'counselApproved', 'counselRef'];
const STATE_RE = /^[A-Z]{2}$/;
const PAYOUT_MODELS = ['CPA', 'CPL', 'CPC', 'revshare', 'other'];
const CONFIG_KINDS = ['gate', 'blocked_states', 'jev_wording', 'question_set'];
const FORM_FILE = 'config/forms/example-debt-site.example-debt-site.json';

const clone = (v) => JSON.parse(JSON.stringify(v));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const has = (o, k) => Object.prototype.hasOwnProperty.call(o ?? {}, k);

let state = seedState();
let version = 0;
const listeners = new Set();

export function resetStore() {
  state = seedState();
  version += 1;
  listeners.forEach((fn) => fn());
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getVersion() {
  return version;
}

function bump() {
  version += 1;
  listeners.forEach((fn) => fn());
}

function nowIso() {
  return `${DEMO_TODAY}T${new Date().toISOString().slice(11, 19)}Z`;
}

function nextId(list, prefix, pad = 0) {
  const max = list.reduce((m, row) => {
    const n = Number(String(row.id).slice(prefix.length));
    return Number.isFinite(n) && String(row.id).startsWith(prefix) ? Math.max(m, n) : m;
  }, 0);
  return `${prefix}${pad ? String(max + 1).padStart(pad, '0') : max + 1}`;
}

function requireActor(actor, action) {
  if (!actor || !can(actor.role, action)) {
    throw new RmxError('forbidden', deniedReason(actor?.role, action));
  }
}

function addAudit(actor, offerId, action, before, after) {
  const id = nextId(state.audit, 'aud-', 3);
  state.audit.unshift({ id, at: nowIso(), actor: `${actor.email} via lds-api`, offerId, action, before, after });
  return id;
}

function findOffer(id) {
  const offer = state.offers.find((o) => o.offerId === id);
  if (!offer) throw new RmxError('not_found', `Offer ${id} was not found.`);
  return offer;
}

function refuseQa(offer) {
  if (offer.isQaTest) throw new RmxError('invalid', 'The QA test offer is not editable.');
}

const isNonNegInt = (v) => Number.isInteger(v) && v >= 0;
const isStateList = (v) => Array.isArray(v) && v.every((s) => typeof s === 'string' && STATE_RE.test(s));

// ---- reads ----

function overview(st) {
  const verticals = Object.keys(st.routerFile.verticals).map((key) => ({ key, status: st.verticalMeta[key] ?? 'draft', ...counts(st, key) }));
  const decisionsToday = { clicked: 0, no_redirect: 0, pending: 0, bounced: 0 };
  st.decisions.forEach((d) => {
    if (String(d.decidedAt).startsWith(DEMO_TODAY) && has(decisionsToday, d.outcome)) decisionsToday[d.outcome] += 1;
  });
  return {
    gate: st.routerFile.confidence_gate,
    verticals,
    decisionsToday,
    lastOfferPush: st.catalogSyncs[0] ?? null,
    lastReconciliation: st.reconciliations[0] ?? null,
    pendingPayouts: st.payouts.filter((p) => p.outcome === null).length,
    servers: st.servers,
  };
}

function counts(st, key) {
  const list = st.offers.filter((o) => o.vertical === key);
  const active = list.filter((o) => o.operatorStatus === 'active');
  return {
    active: active.length,
    paused: list.length - active.length,
    capped: active.filter((o) => o.capRemaining === 0).length,
  };
}

function verticals(st) {
  return Object.entries(st.routerFile.verticals).map(([key, v]) => ({
    key,
    status: st.verticalMeta[key] ?? 'draft',
    instructions: v.instructions,
    profileIntro: v.profile_intro,
    catalogSource: v.catalog_source,
    websites: v.publishers ?? [],
    blockedStates: v.blocked_states ?? [],
    mlaRule: has(v, 'unknown_military_is_covered') ? v.unknown_military_is_covered === true : null,
    offerCounts: counts(st, key),
  }));
}

const newestFirst = (list, field) => [...list].sort((a, b) => String(b[field]).localeCompare(String(a[field])));

const READS = {
  [R.dashboard]: (st, d) => (st === state ? dashboardSample(d.preset ?? 'today') : emptyDashboard()),
  [R.overview]: (st) => overview(st),
  [R.offers]: (st, d) => st.offers.filter((o) => !d.vertical || o.vertical === d.vertical),
  [R.payouts]: (st) => newestFirst(st.payouts, 'proposedAt'),
  [R.decisions]: (st, d) => newestFirst(st.decisions, 'decidedAt')
    .filter((x) => (!d.outcome || x.outcome === d.outcome) && (!d.offerId || x.offerId === d.offerId)),
  [R.syncs]: (st) => newestFirst(st.catalogSyncs, 'at'),
  [R.reconciliation]: (st) => newestFirst(st.reconciliations, 'date'),
  [R.audit]: (st, d) => st.audit.filter((a) => (!d.offerId || a.offerId === d.offerId) && (!d.action || a.action === d.action)),
  [R.verticals]: (st) => verticals(st),
  [R.checklist]: (st, d) => {
    if (d.vertical && st.checklist.vertical !== d.vertical) return { vertical: d.vertical, steps: [] };
    return st.checklist;
  },
  [R.verticalDrafts]: (st) => newestFirst(st.verticalDrafts, 'createdAt'),
  [R.configDrafts]: (st) => (st === state ? st.configDrafts.map(withExport) : st.configDrafts),
  [R.questionSets]: (st) => st.questionSets,
  [R.publishers]: (st) => st.publishers.map(({ publisherId, name, verticals: v, hasKey, keyCreatedAt }) => ({
    publisherId, name, verticals: v, hasKey, keyCreatedAt,
  })),
  [R.settings]: (st) => st.settings.map(({ key, source, on }) => ({ key, source, on })),
  [R.simulate]: (st, d, actor) => simulate(st, d, actor),
  [R.reviewQueue]: (st) => ({
    configDrafts: st.configDrafts.filter((c) => c.status === 'validated'),
    payouts: newestFirst(st.payouts.filter((p) => !p.outcome), 'proposedAt'),
    pullRequests: (st === state ? st.configDrafts.map(withExport) : st.configDrafts).filter((c) => c.status === 'pr_open'),
  }),
};

// ---- simulate ----

function simulate(st, d, actor) {
  requireActor(actor, 'simulate');
  const inputs = d.inputs ?? {};
  const bad = Object.keys(inputs).filter((k) => PERSONAL_NORMAL.includes(normalKey(k))).map((k) => k.toLowerCase());
  if (bad.length) throw new RmxError('invalid', `Personal data keys are refused: ${bad.join(', ')}.`);
  const vertical = st.routerFile.verticals[d.vertical];
  if (!vertical) throw new RmxError('invalid', `Unknown vertical: ${d.vertical}.`, { vertical: 'Unknown vertical.' });
  const blocked = [...(st.routerFile.blocked_states ?? []), ...(vertical.blocked_states ?? [])];
  const given = (k) => inputs[k] !== undefined && inputs[k] !== null && inputs[k] !== '';
  const stateCode = given('state') ? String(inputs.state).toUpperCase() : null;
  const results = st.offers.filter((o) => o.vertical === d.vertical).map((o) => {
    const r = o.rules;
    const failed = [];
    if (o.operatorStatus === 'paused') failed.push('operator_paused');
    if (o.dailyCap !== null && o.capRemaining === 0) failed.push('cap_reached');
    if (stateCode && blocked.includes(stateCode)) failed.push('blocked_state');
    if (stateCode && r.excludedStates.includes(stateCode)) failed.push('excluded_states');
    if (given('debtAmount') && Number(inputs.debtAmount) < r.minDebt) failed.push('min_debt');
    if (given('employmentStatus') && r.allowedEmployment && !r.allowedEmployment.includes(inputs.employmentStatus)) {
      failed.push('allowed_employment');
    }
    if (given('loanAmount') && (Number(inputs.loanAmount) < r.minLoanAmount || (r.maxLoanAmount > 0 && Number(inputs.loanAmount) > r.maxLoanAmount))) {
      failed.push('loan_range');
    }
    if (given('payFrequency') && r.allowedPayFrequency && !r.allowedPayFrequency.includes(inputs.payFrequency)) {
      failed.push('pay_frequency');
    }
    if (given('monthlyIncome') && Number(inputs.monthlyIncome) < r.minMonthlyIncome) failed.push('min_monthly_income');
    return { offerId: o.offerId, name: o.name, qualifies: failed.length === 0, failedRules: failed };
  });
  return { vertical: d.vertical, gate: st.routerFile.confidence_gate, results };
}

// ---- offers ----

function offerCatalog(d, actor) {
  requireActor(actor, 'offer.catalog');
  const offer = findOffer(d.offerId);
  refuseQa(offer);
  const fields = {};
  if (has(d, 'operatorStatus') && !['active', 'paused'].includes(d.operatorStatus)) fields.operatorStatus = 'Must be active or paused.';
  if (has(d, 'dailyCap') && d.dailyCap !== null && !isNonNegInt(d.dailyCap)) fields.dailyCap = 'Must be a whole number, 0 or more, or empty.';
  if (has(d, 'dailyBudget') && d.dailyBudget !== null && !isNonNegInt(d.dailyBudget)) fields.dailyBudget = 'Must be a whole number, 0 or more, or empty.';
  if (Object.keys(fields).length) throw new RmxError('invalid', 'Check the highlighted fields.', fields);
  if (d.operatorStatus === 'active' && offer.mode === 'data_pass' && (!offer.counselApproved || !offer.counselRef)) {
    throw new RmxError('invalid', 'A data-pass offer cannot go live without counsel approval and a counsel reference.');
  }
  const before = {};
  const after = {};
  ['operatorStatus', 'dailyCap', 'dailyBudget'].forEach((k) => {
    if (has(d, k) && !same(d[k], offer[k])) {
      before[k] = offer[k];
      after[k] = d[k];
    }
  });
  if (!Object.keys(after).length) throw new RmxError('invalid', 'Nothing to change.');
  if (d.dryRun) return { before, after, applied: false, auditId: null };
  if (has(after, 'dailyCap')) {
    const used = offer.dailyCap === null ? 0 : offer.dailyCap - (offer.capRemaining ?? offer.dailyCap);
    offer.capRemaining = after.dailyCap === null ? null : Math.max(0, after.dailyCap - used);
  }
  Object.assign(offer, after);
  const auditId = addAudit(actor, offer.offerId, 'catalog_set', before, after);
  bump();
  return { before, after, applied: true, auditId };
}

function offerRules(d, actor) {
  requireActor(actor, 'offer.rules');
  const offer = findOffer(d.offerId);
  refuseQa(offer);
  const rules = d.rules ?? {};
  const fields = {};
  HUBCTL_KEYS.filter((k) => has(rules, k)).forEach((k) => { fields[k] = `${k} stays in hubctl (Decision 5).`; });
  if (has(rules, 'pConv') && rules.pConv !== null && !(typeof rules.pConv === 'number' && rules.pConv >= 0 && rules.pConv <= 1)) {
    fields.pConv = 'Must be between 0 and 1, or empty.';
  }
  if (has(rules, 'excludedStates') && !isStateList(rules.excludedStates)) fields.excludedStates = 'Use two upper-case letters per state.';
  ['minDebt', 'minLoanAmount', 'maxLoanAmount', 'minMonthlyIncome'].forEach((k) => {
    if (has(rules, k) && !(typeof rules[k] === 'number' && rules[k] >= 0)) fields[k] = 'Must be a number, 0 or more.';
  });
  const merged = { ...offer.rules, ...rules };
  if (!fields.minLoanAmount && !fields.maxLoanAmount && merged.maxLoanAmount > 0 && merged.minLoanAmount > merged.maxLoanAmount) {
    fields[has(rules, 'minLoanAmount') ? 'minLoanAmount' : 'maxLoanAmount'] = 'Minimum loan amount cannot be above the maximum.';
  }
  if (Object.keys(fields).length) {
    const hub = Object.keys(fields).find((k) => HUBCTL_KEYS.includes(k));
    throw new RmxError('invalid', hub ? fields[hub] : 'Check the highlighted fields.', fields);
  }
  const before = {};
  const after = {};
  Object.keys(rules).forEach((k) => {
    if (!same(rules[k], offer.rules[k])) {
      before[k] = offer.rules[k];
      after[k] = rules[k];
    }
  });
  if (!Object.keys(after).length) throw new RmxError('invalid', 'Nothing to change.');
  if (d.dryRun) return { before, after, applied: false, auditId: null };
  Object.assign(offer.rules, after);
  const auditId = addAudit(actor, offer.offerId, 'catalog_set', before, after);
  bump();
  return { before, after, applied: true, auditId };
}

// ---- payouts ----

function payoutPropose(d, actor) {
  requireActor(actor, 'payout.propose');
  const offer = findOffer(d.offerId);
  refuseQa(offer);
  const fields = {};
  if (!PAYOUT_MODELS.includes(d.payoutModel)) fields.payoutModel = 'Choose a payout model.';
  if (!(typeof d.payoutValue === 'number' && d.payoutValue >= 0)) fields.payoutValue = 'Must be a number, 0 or more.';
  if (Object.keys(fields).length) throw new RmxError('invalid', 'Check the highlighted fields.', fields);
  const before = { payoutModel: offer.payoutModel, payoutValue: offer.payoutValue };
  const after = { payoutModel: d.payoutModel, payoutValue: d.payoutValue };
  if (d.dryRun) return { before, after, applied: false, id: null };
  const id = nextId(state.payouts, 'pc-');
  state.payouts.unshift({
    id, offerId: offer.offerId, payoutModel: d.payoutModel, payoutValue: d.payoutValue, currentModel: offer.payoutModel,
    currentValue: offer.payoutValue, note: d.note ?? '', proposedBy: actor.email, proposedAt: nowIso(),
    decidedBy: null, decidedAt: null, outcome: null,
  });
  addAudit(actor, offer.offerId, 'payout_proposed', before, after);
  bump();
  return { before, after, applied: true, id };
}

function payoutDecide(d, actor) {
  requireActor(actor, 'payout.decide');
  const change = state.payouts.find((p) => p.id === d.id);
  if (!change) throw new RmxError('not_found', `Payout change ${d.id} was not found.`);
  if (!['approved', 'rejected'].includes(d.outcome)) throw new RmxError('invalid', 'Outcome must be approved or rejected.', { outcome: 'Choose approved or rejected.' });
  if (change.proposedBy === actor.email) {
    throw new RmxError('forbidden', 'You proposed this change; another approver must decide it.');
  }
  if (change.outcome) throw new RmxError('conflict', 'Already decided.');
  const stale = state.payouts.some((p) => p.id !== change.id && p.offerId === change.offerId && p.outcome === 'approved' && p.proposedAt > change.proposedAt);
  if (stale) throw new RmxError('conflict', 'Stale: a later proposal for this offer was approved.');
  const offer = findOffer(change.offerId);
  refuseQa(offer);
  const before = { outcome: null, payoutModel: offer.payoutModel, payoutValue: offer.payoutValue };
  const approve = d.outcome === 'approved';
  const after = {
    outcome: d.outcome,
    payoutModel: approve ? change.payoutModel : offer.payoutModel,
    payoutValue: approve ? change.payoutValue : offer.payoutValue,
  };
  if (d.dryRun) return { before, after, applied: false };
  Object.assign(change, { outcome: d.outcome, decidedBy: actor.email, decidedAt: nowIso() });
  if (approve) Object.assign(offer, { payoutModel: change.payoutModel, payoutValue: change.payoutValue });
  addAudit(actor, offer.offerId, approve ? 'payout_approved' : 'payout_rejected',
    { payoutModel: before.payoutModel, payoutValue: before.payoutValue },
    { payoutModel: change.payoutModel, payoutValue: change.payoutValue });
  bump();
  return { before, after, applied: true };
}

// ---- verticals ----

function verticalDraftSave(d, actor) {
  requireActor(actor, 'config.draft');
  const fields = {};
  const name = String(d.name ?? '').trim();
  if (!name) fields.name = 'Name is required.';
  else if (!/^[a-z_]+$/.test(name)) fields.name = 'Use lower-case letters and underscores only.';
  else if (has(state.routerFile.verticals, name) || state.verticalDrafts.some((v) => v.name === name)) {
    fields.name = 'A vertical or draft with this name already exists.';
  }
  const blockedStates = d.blockedStates ?? [];
  if (!isStateList(blockedStates)) fields.blockedStates = 'Use two upper-case letters per state.';
  if (Object.keys(fields).length) throw new RmxError('invalid', 'Check the highlighted fields.', fields);
  const at = nowIso();
  const draft = {
    id: nextId(state.verticalDrafts, 'vd-'), name, instructions: d.instructions ?? '', leadDescription: d.leadDescription ?? '',
    catalogSource: d.catalogSource ?? '', websites: d.websites ?? [], blockedStates, status: 'draft',
    createdBy: actor.email, createdAt: at, history: [{ at, actor: actor.email, step: 'drafted' }],
  };
  state.verticalDrafts.unshift(draft);
  bump();
  return draft;
}

// ---- config ----

function findDraft(id) {
  const draft = state.configDrafts.find((c) => c.id === id);
  if (!draft) throw new RmxError('not_found', `Config draft ${id} was not found.`);
  return draft;
}

const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);

// Errors, the changed router.json paths, and the full new file for a draft.
function planConfig(draft) {
  const errors = [];
  const paths = [];
  const router = clone(state.routerFile);
  const p = draft.proposed ?? {};
  const verticalKeys = Object.keys(router.verticals);
  let fileName = 'config/router.json';
  let file = router;
  if (draft.kind === 'gate') {
    if (draft.target !== 'global') errors.push('Unknown target: the gate is global.');
    if (!isNumber(p.confidence_gate) || p.confidence_gate < 0 || p.confidence_gate > 1) errors.push('The gate must be a number from 0 to 1.');
    else {
      paths.push(['confidence_gate', router.confidence_gate, p.confidence_gate]);
      router.confidence_gate = p.confidence_gate;
    }
  } else if (draft.kind === 'blocked_states') {
    const isGlobal = draft.target === 'global';
    if (!isGlobal && !verticalKeys.includes(draft.target)) errors.push(`Unknown target: ${draft.target}.`);
    if (!isStateList(p.blocked_states)) errors.push('Each blocked state must be two upper-case letters.');
    else if (isGlobal || verticalKeys.includes(draft.target)) {
      const holder = isGlobal ? router : router.verticals[draft.target];
      paths.push([isGlobal ? 'blocked_states' : `verticals.${draft.target}.blocked_states`, holder.blocked_states ?? [], p.blocked_states]);
      holder.blocked_states = p.blocked_states;
    }
  } else if (draft.kind === 'jev_wording') {
    if (!verticalKeys.includes(draft.target)) errors.push(`Unknown target: ${draft.target}.`);
    if (typeof p.instructions !== 'string' || !p.instructions.trim()) errors.push('The Jev wording cannot be empty.');
    else if (verticalKeys.includes(draft.target)) {
      paths.push([`verticals.${draft.target}.instructions`, router.verticals[draft.target].instructions, p.instructions]);
      router.verticals[draft.target].instructions = p.instructions;
    }
  } else if (draft.kind === 'question_set') {
    const form = clone(state.questionSets);
    const set = form.sets.find((s) => s.id === draft.target);
    fileName = FORM_FILE;
    file = form;
    if (!set) errors.push(`Unknown target: ${draft.target}.`);
    else {
      Object.keys(p).forEach((k) => {
        paths.push([`sets.${draft.target}.${k}`, set[k], p[k]]);
        set[k] = p[k];
      });
    }
  } else {
    errors.push(`Unknown kind: ${draft.kind}.`);
  }
  const diff = paths.filter(([, from, to]) => !same(from, to)).flatMap(([path, from, to]) => [
    `- ${path}: ${JSON.stringify(from)}`,
    `+ ${path}: ${JSON.stringify(to)}`,
  ]);
  return { errors, diff, fileName, file };
}

// PR text and diff for a draft; the export and the read of an exported draft share this builder.
function buildExport(draft) {
  const { fileName, file, diff } = planConfig(draft);
  const fileText = `${JSON.stringify(file, null, 2)}\n`;
  const prTitle = `config: ${draft.title}`;
  const prBody = [
    `Summary: ${draft.title} (${draft.kind}, target ${draft.target}).`,
    '',
    `Approved by: ${draft.approvedBy}`,
    `Counsel reference: ${draft.counselRef ?? 'none'}`,
    '',
    '```diff',
    ...diff,
    '```',
    '',
  ].join('\n');
  return { fileName, fileText, prTitle, prBody, diff };
}

const PR_STATUSES = ['pr_open', 'merged'];

function withExport(draft) {
  if (!PR_STATUSES.includes(draft.status) || draft.prBody) return draft;
  const { prTitle, prBody, diff } = buildExport(draft);
  return { ...draft, prTitle, prBody, diff };
}

function configWarnings(draft) {
  if (draft.kind === 'gate') return ['gate change: needs owner approval'];
  if (draft.kind === 'blocked_states' || draft.kind === 'question_set') return ['compliance change: counsel reference required'];
  return [];
}

function configSave(d, actor) {
  requireActor(actor, 'config.draft');
  const fields = {};
  if (!String(d.title ?? '').trim()) fields.title = 'Title is required.';
  if (!CONFIG_KINDS.includes(d.kind)) fields.kind = 'Choose a kind.';
  if (Object.keys(fields).length) throw new RmxError('invalid', 'Check the highlighted fields.', fields);
  const at = nowIso();
  if (d.id) {
    const draft = findDraft(d.id);
    if (!['draft', 'validated'].includes(draft.status)) {
      throw new RmxError('conflict', 'Only a draft or validated draft can be edited. Start a new draft instead.');
    }
    Object.assign(draft, {
      title: d.title, kind: d.kind, target: d.target, proposed: clone(d.proposed ?? {}), status: 'draft', validation: null,
      approvedBy: null, approvedAt: null, counselRef: null,
    });
    draft.history.push({ at, actor: actor.email, step: 'saved' });
    bump();
    return draft;
  }
  const draft = {
    id: nextId(state.configDrafts, 'cfg-d-'), title: d.title, kind: d.kind, target: d.target, proposed: clone(d.proposed ?? {}),
    status: 'draft', createdBy: actor.email, createdAt: at, validation: null, approvedBy: null, approvedAt: null,
    counselRef: null, history: [{ at, actor: actor.email, step: 'drafted' }],
  };
  state.configDrafts.push(draft);
  bump();
  return draft;
}

function configValidate(d, actor) {
  requireActor(actor, 'config.draft');
  const draft = findDraft(d.id);
  if (draft.status !== 'draft' && draft.status !== 'validated') throw new RmxError('conflict', 'Only a draft or validated draft can be validated.');
  const { errors, diff } = planConfig(draft);
  draft.validation = { errors, warnings: configWarnings(draft), diff };
  draft.status = errors.length ? 'draft' : 'validated';
  draft.history.push({ at: nowIso(), actor: actor.email, step: errors.length ? 'validation_failed' : 'validated' });
  bump();
  return draft;
}

function configApprove(d, actor) {
  requireActor(actor, 'config.approve');
  const draft = findDraft(d.id);
  if (draft.status !== 'validated') throw new RmxError('conflict', 'Only a validated draft can be approved.');
  const counselRef = String(d.counselRef ?? '').trim();
  if ((draft.kind === 'blocked_states' || draft.kind === 'question_set') && !counselRef) {
    throw new RmxError('invalid', 'A counsel reference is required for this change.', { counselRef: 'Enter the counsel reference.' });
  }
  if (draft.createdBy === actor.email) {
    throw new RmxError('forbidden', 'You drafted this change; another approver must approve it.');
  }
  const at = nowIso();
  Object.assign(draft, { approvedBy: actor.email, approvedAt: at, counselRef: counselRef || null });
  draft.history.push({ at, actor: actor.email, step: 'approved' });
  // Approval opens the pull request automatically (a GitHub App that can open PRs but never merge).
  const out = buildExport(draft);
  state.nextPr += 1;
  Object.assign(draft, { status: 'pr_open', prNumber: state.nextPr, prTitle: out.prTitle, prBody: out.prBody, diff: out.diff });
  draft.history.push({ at, actor: 'console (GitHub App)', step: 'pr_opened' });
  bump();
  return { ...draft, fileName: out.fileName, fileText: out.fileText };
}

function configReject(d, actor) {
  requireActor(actor, 'config.reject');
  const draft = findDraft(d.id);
  if (draft.status !== 'validated') throw new RmxError('conflict', 'Only a validated draft can be rejected.');
  const reason = String(d.reason ?? '').trim();
  if (!reason) throw new RmxError('invalid', 'Say why it is rejected.', { reason: 'Enter a reason.' });
  const at = nowIso();
  Object.assign(draft, { status: 'rejected', rejectedBy: actor.email, rejectedAt: at, rejectReason: reason });
  draft.history.push({ at, actor: actor.email, step: 'rejected' });
  bump();
  return draft;
}

// Demo only: stands in for the tech lead merging the pull request in GitHub, and the deploy that follows.
function configMerge(d, actor) {
  if (!actor) throw new RmxError('forbidden', 'Sign in first.');
  const draft = findDraft(d.id);
  if (draft.status !== 'pr_open') throw new RmxError('conflict', 'Only an open pull request can be merged.');
  const { errors, fileName, file } = planConfig(draft);
  if (errors.length) throw new RmxError('conflict', `The change no longer applies: ${errors.join(' ')}`);
  if (fileName === FORM_FILE) state.questionSets = file;
  else state.routerFile = file;
  const configVersion = `cfg-${shortHash(JSON.stringify(state.routerFile) + JSON.stringify(state.questionSets))}`;
  state.servers.forEach((srv) => { srv.configVersion = configVersion; });
  const at = nowIso();
  Object.assign(draft, { status: 'merged', mergedAt: at, configVersion });
  draft.history.push({ at, actor: 'tech lead in GitHub (simulated)', step: 'merged' });
  bump();
  return draft;
}

function shortHash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

const MUTATIONS = {
  [R.offerCatalog]: offerCatalog,
  [R.offerRules]: offerRules,
  [R.payoutPropose]: payoutPropose,
  [R.payoutDecide]: payoutDecide,
  [R.verticalDraftSave]: verticalDraftSave,
  [R.configSave]: configSave,
  [R.configValidate]: configValidate,
  [R.configApprove]: configApprove,
  [R.configReject]: configReject,
  [R.configMerge]: configMerge,
};

function execute(route, data, actor) {
  const mutation = MUTATIONS[route];
  if (mutation) return mutation(data, actor);
  const read = READS[route];
  if (!read) throw new RmxError('not_found', `Unknown route: ${route}`);
  const mode = getDemoMode();
  if (mode === 'error') {
    throw new RmxError('unavailable', 'Sample error: the RedirectMax internal API did not answer.');
  }
  return read(mode === 'empty' ? emptyState() : state, data, actor);
}

export function rmxCall(route, data = {}, actor = null) {
  const base = import.meta.env.MODE === 'test' ? 0 : LATENCY_MS;
  const delay = base + (getDemoMode() === 'slow' ? SLOW_EXTRA_MS : 0);
  const run = () => ({ data: clone(execute(route, data ?? {}, actor)) });
  if (delay === 0) return Promise.resolve().then(run);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(run());
      } catch (e) {
        reject(e);
      }
    }, delay);
  });
}
