// Sample state for the RedirectMax console demo. Invented ids and @example.com emails only;
// owners are role titles. Every call returns a fresh copy.

export const DEMO_TODAY = '2026-11-19';

const ROUTER_FILE = {
  "confidence_gate": 0.02,
  "blocked_states": [],
  "catalog_max_end_share": 0.5,
  "default_vertical": "debt",
  "verticals": {
    "debt": {
      "instructions": "Choose the one offer that best fits this person's situation and what they said they want. Prefer an offer that helps with their debt; do not choose an offer that would likely make their situation worse.",
      "profile_intro": "A person who has just completed a form asking for help with debt.",
      "catalog_source": "example-debt-site",
      "publishers": []
    },
    "payday": {
      "instructions": "Choose the one offer that best fits this person's situation and what they asked for: the loan amount they want, their income and how often they are paid. Prefer an offer that is clear about its costs and that they are likely to qualify for; do not choose an offer that would likely make their situation worse.",
      "profile_intro": "A person who has just completed a form asking for a short-term loan.",
      "catalog_source": "swiftpaydayfund",
      "publishers": [
        "swiftpaydayfund"
      ],
      "blocked_states": [],
      "unknown_military_is_covered": true
    }
  }
};

const clone = (v) => JSON.parse(JSON.stringify(v));

const NO_WEBSITE_EXTRAS = { blockedPublishers: [], epcPrior: 0, fitText: '', trackingUrl: '' };

function debtRules(over = {}) {
  return {
    ruleCategory: 'debt_relief', excludedStates: [], minDebt: 10000, allowedEmployment: null, pConv: null,
    isNew: false, evergreen: true, minLoanAmount: 0, maxLoanAmount: 0, allowedPayFrequency: null,
    minMonthlyIncome: 0, mlaCompliant: false, ...over,
  };
}

function offer(id, name, over = {}) {
  const { rules, website, ...rest } = over;
  return {
    offerId: id, name, vertical: 'debt', catalogSource: 'example-debt-site', isQaTest: false, network: 'Tracker',
    payoutModel: 'CPL', payoutValue: 40, dailyCap: 100, dailyBudget: 4000, capRemaining: 60, mode: 'click_out',
    counselApproved: true, counselRef: 'CR-2026-014', operatorStatus: 'active', rank: 1,
    rules: debtRules(rules),
    website: {
      backend: 'sample-backend', status: 'live', allowedStates: [], ...NO_WEBSITE_EXTRAS,
      epcPrior: 1.2, fitText: `${name} fits people with unsecured debt.`,
      trackingUrl: `https://track.example.com/${id}`, ...website,
    },
    ...rest,
  };
}

function seedOffers() {
  return [
    offer('dg-101', 'Sample Debt Relief A', {
      payoutValue: 42.5, dailyCap: 200, dailyBudget: 8500, capRemaining: 37, rank: 1,
      rules: { pConv: 0.12, isNew: true },
    }),
    offer('dg-102', 'Sample Debt Relief B', { payoutValue: 38, dailyCap: 50, dailyBudget: 1900, capRemaining: 0, rank: 2 }),
    offer('dg-103', 'Sample Consolidation A', {
      operatorStatus: 'paused', rank: 3, rules: { ruleCategory: 'consolidation', excludedStates: ['NY'] },
    }),
    offer('dg-104', 'Sample Data Pass Partner', {
      mode: 'data_pass', counselApproved: false, counselRef: null, operatorStatus: 'paused', rank: 4,
      payoutModel: 'CPA', payoutValue: 55, rules: { excludedStates: ['CA', 'TX'], minDebt: 15000 },
    }),
    offer('qa-test-1', 'QA Test Offer', {
      isQaTest: true, network: 'internal', payoutValue: 0, dailyCap: null, dailyBudget: 0, capRemaining: null,
      rank: 99, counselRef: null, rules: { minDebt: 0, evergreen: false },
    }),
    offer('dg-105', 'Sample Credit Repair A', {
      payoutModel: 'CPA', payoutValue: 60, rank: 5, rules: { ruleCategory: 'credit_repair', allowedEmployment: ['employed', 'self_employed'] },
    }),
    offer('dg-106', 'Sample Debt Relief C', { payoutValue: 36, dailyCap: null, capRemaining: null, rank: 6, rules: { minDebt: 7500 } }),
    offer('dg-107', 'Sample Debt Relief D', { payoutValue: 41, dailyCap: 80, capRemaining: 64, rank: 7, rules: { excludedStates: ['NJ'] } }),
    offer('dg-108', 'Sample Consolidation B', {
      payoutValue: 33, dailyCap: 120, capRemaining: 90, rank: 8, rules: { ruleCategory: 'consolidation', pConv: 0.08 },
    }),
    ...[
      ['sp-201', 'Sample Payday Loan A', 1],
      ['sp-202', 'Sample Payday Loan B', 2],
    ].map(([id, name, rank]) => offer(id, name, {
      vertical: 'payday', catalogSource: 'swiftpaydayfund', operatorStatus: 'paused', rank,
      payoutModel: 'CPL', payoutValue: 28, dailyCap: 60, dailyBudget: 1700, capRemaining: 60, counselApproved: false,
      counselRef: null,
      rules: {
        ruleCategory: 'short_term', minDebt: 0, evergreen: false, minLoanAmount: 100, maxLoanAmount: 1000,
        allowedPayFrequency: ['weekly', 'biweekly', 'monthly'], minMonthlyIncome: 1200, mlaCompliant: false,
      },
      website: { backend: 'sample-payday-backend', status: 'draft' },
    })),
  ];
}

function seedPayouts() {
  const p = (id, offerId, value, current, by, at, outcome, decidedBy, decidedAt, note, model = 'CPL', curModel = 'CPL') => ({
    id, offerId, payoutModel: model, payoutValue: value, currentModel: curModel, currentValue: current, note,
    proposedBy: by, proposedAt: at, decidedBy, decidedAt, outcome,
  });
  return [
    p('pc-1', 'dg-101', 45, 42.5, 'operator@example.com', '2026-11-18T09:30:00Z', null, null, null, 'Network raised the rate.'),
    p('pc-2', 'dg-105', 64, 60, 'approver@example.com', '2026-11-18T14:10:00Z', null, null, null, 'Volume bonus agreed.', 'CPA', 'CPA'),
    p('pc-3', 'dg-107', 41, 39, 'operator@example.com', '2026-11-12T10:00:00Z', 'approved', 'approver@example.com',
      '2026-11-12T15:45:00Z', 'Quarterly rate review.'),
    p('pc-4', 'dg-108', 40, 33, 'operator@example.com', '2026-11-10T11:20:00Z', 'rejected', 'approver@example.com',
      '2026-11-11T09:05:00Z', 'Rate not confirmed by the network.'),
  ];
}

function seedDecisions() {
  const offerIds = ['dg-101', 'dg-105', 'dg-106', 'dg-107', 'dg-108', 'dg-101', 'dg-105', 'dg-101'];
  const outcomes = ['clicked', 'clicked', 'pending', 'clicked', 'pending', 'bounced', 'clicked', 'pending'];
  const nullAt = new Set([3, 9, 14, 20]);
  const out = [];
  for (let i = 1; i <= 24; i += 1) {
    const hour = String(23 - Math.floor((i - 1) * 0.9)).padStart(2, '0');
    const minute = String((i * 7) % 60).padStart(2, '0');
    const noOffer = nullAt.has(i);
    let outcome = outcomes[(i - 1) % outcomes.length];
    if (noOffer) outcome = 'no_redirect';
    if (i === 1) outcome = 'clicked';
    // every outcome present: ensure bounced and pending appear
    if (i === 6) outcome = 'bounced';
    if (i === 5) outcome = 'pending';
    const clicked = outcome === 'clicked';
    out.push({
      decisionId: `dec-${String(i).padStart(3, '0')}`,
      decidedAt: `${DEMO_TODAY}T${hour}:${minute}:00Z`,
      vertical: 'debt',
      publisherId: 'example-debt-site',
      offerId: noOffer ? null : offerIds[(i - 1) % offerIds.length],
      basis: noOffer ? (i % 2 ? 'none' : 'low_confidence_generic') : 'jev',
      gated: noOffer,
      confidence: noOffer ? 0.01 : [0.41, 0.33, 0.27, 0.52][i % 4],
      outcome,
      conversionStatus: clicked ? ['confirmed', 'pending', null, 'reversed'][i % 4] : null,
      isTest: false,
      failedRules: [],
    });
  }
  out[0].failedRules = [
    { offerId: 'dg-102', rules: ['cap_reached'] },
    { offerId: 'dg-103', rules: ['operator_paused'] },
    { offerId: 'dg-104', rules: ['excluded_states', 'min_debt'] },
  ];
  out[1].failedRules = [{ offerId: 'dg-102', rules: ['cap_reached'] }];
  return out;
}

function seedSyncs() {
  const s = (id, at, offersReceived, offersChanged, status, note) => ({
    id, at, publisherId: 'example-debt-site', vertical: 'debt', offersReceived, offersChanged, status, note,
  });
  return [
    s('sync-5', '2026-11-19T06:00:00Z', 9, 2, 'ok', 'Two offers changed payout.'),
    s('sync-4', '2026-11-18T06:00:00Z', 9, 0, 'ok', 'No changes.'),
    s('sync-3', '2026-11-17T06:00:00Z', 0, 0, 'failed', 'Sample error: website did not answer.'),
    s('sync-2', '2026-11-16T06:00:00Z', 8, 1, 'ok', 'One offer added.'),
    s('sync-1', '2026-11-15T06:00:00Z', 8, 0, 'ok', 'No changes.'),
  ];
}

function seedRecons() {
  const days = [['2026-11-18', 1204, 1198], ['2026-11-17', 1150, 1149], ['2026-11-16', 983, 1048], ['2026-11-15', 1022, 1020],
    ['2026-11-14', 1310, 1302], ['2026-11-13', 1275, 1281], ['2026-11-12', 1190, 1187]];
  return days.map(([date, ours, theirs], i) => {
    const diffPct = Math.round((Math.abs(ours - theirs) / theirs) * 1000) / 10;
    return { id: `rec-${7 - i}`, date, network: 'Tracker', ours, theirs, diffPct, status: diffPct > 5 ? 'alert' : 'ok' };
  });
}

function seedAudit() {
  const a = (id, at, actor, offerId, action, before, after) => ({ id, at, actor, offerId, action, before, after });
  return [
    a('aud-006', '2026-11-12T15:45:00Z', 'approver@example.com via lds-api', 'dg-107', 'payout_approved',
      { payoutValue: 39 }, { payoutValue: 41 }),
    a('aud-005', '2026-11-12T10:00:00Z', 'operator@example.com via lds-api', 'dg-107', 'payout_proposed',
      { payoutValue: 39 }, { payoutValue: 41 }),
    a('aud-004', '2026-11-11T09:05:00Z', 'approver@example.com via lds-api', 'dg-108', 'payout_rejected',
      { payoutValue: 33 }, { payoutValue: 40 }),
    a('aud-003', '2026-11-09T13:20:00Z', 'operator@example.com via lds-api', 'dg-103', 'catalog_set',
      { operatorStatus: 'active' }, { operatorStatus: 'paused' }),
    a('aud-002', '2026-11-02T08:15:00Z', 'ops-admin (hubctl)', 'dg-102', 'catalog_set', { dailyCap: 100 }, { dailyCap: 50 }),
    a('aud-001', '2026-10-28T08:00:00Z', 'ops-admin (hubctl)', 'dg-104', 'catalog_set',
      { operatorStatus: 'active' }, { operatorStatus: 'paused' }),
  ];
}

function seedChecklist() {
  const step = (key, label, doneWhen, owner, status, waitingOn = null) => ({ key, label, doneWhen, owner, status, waitingOn });
  return {
    vertical: 'payday',
    steps: [
      step('name_wording', 'Name, Jev wording, lead description', 'Draft passes server validator',
        'Config editor drafts; counsel reviews wording', 'done'),
      step('source_websites', 'Offer source and websites', 'Each named website exists', 'Config editor', 'done'),
      step('blocked_mla', 'Blocked states, MLA rule', 'Approved in portal, counsel reference recorded', 'Owner, Counsel',
        'waiting', 'Counsel'),
      step('website_key', 'Website access key', 'Website exists and has a key', 'Tech lead (hubctl publisher-add)',
        'waiting', 'Tech lead'),
      step('config_deployed', 'Config merged and deployed', 'Both decide servers report new config_version',
        'Tech lead reviews and merges', 'not_started'),
      step('first_push', 'First offer push', 'Catalog sync for vertical recorded', 'Website team', 'not_started'),
      step('offer_limits', 'Offer limits set', 'Each offer has rule values', 'Operator', 'not_started'),
      step('mla_flags', 'MLA flags (lending only)', 'Counsel-approved offers flagged', 'Operator, on counsel\'s say-so',
        'waiting', 'Counsel'),
      step('test_lead', 'Test lead', 'Test decision reached QA test offer', 'Website team or QA', 'not_started'),
    ],
  };
}

function seedConfigDrafts() {
  const h = (at, actor, step) => ({ at, actor, step });
  return [
    {
      id: 'cfg-d-1', title: 'Raise confidence gate to 0.03', kind: 'gate', target: 'global',
      proposed: { confidence_gate: 0.03 }, status: 'draft', createdBy: 'editor@example.com',
      createdAt: '2026-11-17T10:00:00Z', validation: null, approvedBy: null, approvedAt: null, counselRef: null,
      history: [h('2026-11-17T10:00:00Z', 'editor@example.com', 'drafted')],
    },
    {
      id: 'cfg-d-2', title: 'Block WV for debt', kind: 'blocked_states', target: 'debt',
      proposed: { blocked_states: ['WV'] }, status: 'validated', createdBy: 'editor@example.com',
      createdAt: '2026-11-16T11:00:00Z',
      validation: {
        errors: [], warnings: ['compliance change: counsel reference required'],
        diff: ['- blocked_states: []', '+ blocked_states: ["WV"]'],
      },
      approvedBy: null, approvedAt: null, counselRef: null,
      history: [
        h('2026-11-16T11:00:00Z', 'editor@example.com', 'drafted'),
        h('2026-11-16T11:20:00Z', 'editor@example.com', 'validated'),
      ],
    },
    {
      id: 'cfg-d-3', title: 'Tighten payday Jev wording', kind: 'jev_wording', target: 'payday',
      proposed: { instructions: 'Choose the one offer that is clear about its costs and that this person is likely to qualify for.' },
      status: 'pr_open', prNumber: 238, createdBy: 'editor@example.com', createdAt: '2026-11-10T09:00:00Z',
      validation: {
        errors: [], warnings: [],
        diff: [
          `- instructions: ${JSON.stringify(ROUTER_FILE.verticals.payday.instructions)}`,
          '+ instructions: "Choose the one offer that is clear about its costs and that this person is likely to qualify for."',
        ],
      },
      approvedBy: 'approver@example.com', approvedAt: '2026-11-11T09:00:00Z', counselRef: null,
      history: [
        h('2026-11-10T09:00:00Z', 'editor@example.com', 'drafted'),
        h('2026-11-10T09:30:00Z', 'editor@example.com', 'validated'),
        h('2026-11-11T09:00:00Z', 'approver@example.com', 'approved'),
        h('2026-11-11T09:00:00Z', 'console (GitHub App)', 'pr_opened'),
      ],
    },
  ];
}

function seedQuestionSets() {
  const all = ['owns_home', 'tax_debt_amount', 'months_behind', 'employment_status', 'looking_for_work'];
  return {
    publisherId: 'example-debt-site', formId: 'example-debt-site', decideAfterStep: 'debt_types', defaultSet: 'standard',
    holdoutPercent: 20,
    sets: [
      { id: 'standard', description: 'All follow-up questions: payment plan, home ownership, back-tax amount, months behind, work situation and job search.', fields: [...all] },
      { id: 'settlement_ready', description: 'For someone with $10,000 or more in unsecured debt who is likely a debt settlement candidate: ask only what debt settlement providers need (months behind, work situation).', fields: ['months_behind', 'employment_status'] },
      { id: 'low_debt', description: 'For someone below the $10,000 debt settlement minimum: questions that route to credit counseling, payment plans or job offers (payment plan interest, work situation, job search).', fields: ['employment_status', 'looking_for_work'] },
      { id: 'hardship', description: 'For someone with high debt who may have secured debt, back taxes or a bankruptcy path: home ownership, back-tax amount, months behind, work situation and job search.', fields: [...all] },
    ],
  };
}

function seedSettings() {
  const ops = (key, on) => ({ key, source: 'ops.json', on });
  const env = (key, on) => ({ key, source: 'environment', on });
  return [
    ops('reversal_deduct_limit', false), ops('reconcile_alert_pct', true), ops('retention_days', true),
    ops('click_dedupe_seconds', true), ops('click_id_sub', true), ops('click_id_legacy_sub', true),
    ops('token_ttl_hours', true),
    env('LEADS_STORE_ENABLED', false), env('RMX_MODULE_ENABLED', true), env('RMX_SERVICE_KEY', true),
  ];
}

export function seedState() {
  return clone({
    routerFile: ROUTER_FILE,
    verticalMeta: { debt: 'live', payday: 'draft' },
    servers: [
      { name: 'decide-1', configVersion: 'cfg-7f3a2c1' },
      { name: 'decide-2', configVersion: 'cfg-7f3a2c1' },
    ],
    offers: seedOffers(),
    payouts: seedPayouts(),
    decisions: seedDecisions(),
    catalogSyncs: seedSyncs(),
    reconciliations: seedRecons(),
    audit: seedAudit(),
    verticalDrafts: [],
    checklist: seedChecklist(),
    configDrafts: seedConfigDrafts(),
    nextPr: 240,
    questionSets: seedQuestionSets(),
    publishers: [
      { publisherId: 'example-debt-site', name: 'Example Debt Site', verticals: ['debt'], hasKey: true, keyCreatedAt: '2026-09-30T08:00:00Z' },
      { publisherId: 'swiftpaydayfund', name: 'SwiftPaydayFund', verticals: ['payday'], hasKey: false, keyCreatedAt: null },
    ],
    settings: seedSettings(),
  });
}

export function emptyState() {
  const s = seedState();
  return {
    ...s,
    servers: [],
    offers: [],
    payouts: [],
    decisions: [],
    catalogSyncs: [],
    reconciliations: [],
    audit: [],
    verticalDrafts: [],
    configDrafts: [],
    publishers: [],
    settings: [],
    routerFile: { ...s.routerFile, verticals: {} },
    verticalMeta: {},
    checklist: { vertical: null, steps: [] },
    questionSets: { ...s.questionSets, sets: [] },
  };
}
