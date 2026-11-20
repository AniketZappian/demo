import { describe, it, expect, vi } from 'vitest';
import { rmxCall, RmxError, R, subscribe, getVersion, resetStore } from './store';
import { setDemoMode } from './demoMode';

const OP = { email: 'operator@example.com', role: 'RMX_OPERATOR' };
const APPROVER = { email: 'approver@example.com', role: 'RMX_APPROVER' };
const EDITOR = { email: 'editor@example.com', role: 'RMX_CONFIG_EDITOR' };
const VIEWER = { email: 'viewer@example.com', role: 'RMX_VIEWER' };
const ADMIN = { email: 'admin@example.com', role: 'RMX_SUPER_ADMIN' };

const read = async (route, data) => (await rmxCall(route, data)).data;
const offerById = async (id) => (await read(R.offers)).find((o) => o.offerId === id);
const refusal = async (promise) => {
  try {
    await promise;
  } catch (e) {
    return e;
  }
  return null;
};

describe('store: reads and envelope', () => {
  it('exposes every route and returns a { data } envelope of deep copies', async () => {
    expect(Object.keys(R)).toHaveLength(27);
    const first = await rmxCall(R.offers);
    first.data[0].name = 'changed locally';
    expect((await read(R.offers))[0].name).not.toBe('changed locally');
  });

  it('filters offers and decisions', async () => {
    const payday = await read(R.offers, { vertical: 'payday' });
    expect(payday.map((o) => o.offerId)).toEqual(['sp-201', 'sp-202']);
    const decisions = await read(R.decisions, { outcome: 'bounced' });
    expect(decisions.length).toBeGreaterThan(0);
    expect(decisions.every((d) => d.outcome === 'bounced')).toBe(true);
    expect((await read(R.decisions, { offerId: 'dg-101' })).every((d) => d.offerId === 'dg-101')).toBe(true);
  });

  it('builds the overview', async () => {
    const o = await read(R.overview);
    expect(o.gate).toBe(0.02);
    expect(o.verticals.find((v) => v.key === 'debt')).toMatchObject({ status: 'live', capped: 1 });
    expect(o.verticals.find((v) => v.key === 'payday').status).toBe('draft');
    expect(o.decisionsToday.clicked).toBeGreaterThan(0);
    expect(o.pendingPayouts).toBe(2);
    expect(o.lastOfferPush.id).toBe('sync-5');
    expect(o.servers).toHaveLength(2);
  });

  it('lists payouts newest first and never leaks keys', async () => {
    const payouts = await read(R.payouts);
    expect(payouts[0].id).toBe('pc-2');
    const pubs = await read(R.publishers);
    expect(JSON.stringify(pubs)).not.toMatch(/hash|secret/i);
    const settings = await read(R.settings);
    expect(Object.keys(settings[0]).sort()).toEqual(['key', 'on', 'source']);
  });

  it('reads the dashboard presets', async () => {
    const d = await read(R.dashboard, { preset: '7d' });
    expect(d).toHaveProperty('summary');
    expect(d).toHaveProperty('topCampaigns');
  });

  it('rejects an unknown route', async () => {
    const e = await refusal(rmxCall('/nope'));
    expect(e).toBeInstanceOf(RmxError);
    expect(e.code).toBe('not_found');
  });
});

describe('store: offer catalog and rules', () => {
  it('dry run changes nothing and does not notify', async () => {
    const fn = vi.fn();
    const off = subscribe(fn);
    const v = getVersion();
    const res = await rmxCall(R.offerCatalog, { offerId: 'dg-101', operatorStatus: 'paused', dryRun: true }, OP);
    expect(res.data).toMatchObject({ before: { operatorStatus: 'active' }, after: { operatorStatus: 'paused' }, applied: false });
    expect((await offerById('dg-101')).operatorStatus).toBe('active');
    expect((await read(R.audit)).length).toBe(6);
    expect(getVersion()).toBe(v);
    expect(fn).not.toHaveBeenCalled();
    off();
  });

  it('Pause dg-101 applies, bumps the version and adds an audit row', async () => {
    const fn = vi.fn();
    const off = subscribe(fn);
    const v = getVersion();
    const res = await rmxCall(R.offerCatalog, { offerId: 'dg-101', operatorStatus: 'paused', dryRun: false }, OP);
    expect(res.data.applied).toBe(true);
    expect(res.data.auditId).toBe('aud-007');
    expect((await offerById('dg-101')).operatorStatus).toBe('paused');
    const audit = await read(R.audit);
    expect(audit[0]).toMatchObject({
      id: 'aud-007', actor: 'operator@example.com via lds-api', offerId: 'dg-101', action: 'catalog_set',
      before: { operatorStatus: 'active' }, after: { operatorStatus: 'paused' },
    });
    expect(getVersion()).toBe(v + 1);
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    expect((await read(R.audit, { action: 'catalog_set' })).length).toBe(4);
    expect((await read(R.audit, { offerId: 'dg-101' })).length).toBe(1);
  });

  it('refuses a dry run or apply that changes nothing', async () => {
    const v = getVersion();
    const audits = (await read(R.audit)).length;
    for (const dryRun of [true, false]) {
      const e = await refusal(rmxCall(R.offerCatalog, { offerId: 'dg-103', operatorStatus: 'paused', dryRun }, OP));
      expect(e.code).toBe('invalid');
      expect(e.message).toBe('Nothing to change.');
    }
    const r = await refusal(rmxCall(R.offerRules, { offerId: 'dg-101', rules: {}, dryRun: false }, OP));
    expect(r.message).toBe('Nothing to change.');
    expect((await read(R.audit)).length).toBe(audits);
    expect(getVersion()).toBe(v);
  });

  it('resetStore restores the seed', async () => {
    await rmxCall(R.offerCatalog, { offerId: 'dg-101', operatorStatus: 'paused', dryRun: false }, OP);
    resetStore();
    expect((await offerById('dg-101')).operatorStatus).toBe('active');
  });

  it('refuses the Viewer and a missing actor with the denied reason', async () => {
    const e = await refusal(rmxCall(R.offerCatalog, { offerId: 'dg-101', operatorStatus: 'paused', dryRun: false }, VIEWER));
    expect(e.code).toBe('forbidden');
    expect(e.message).toBe('Viewer cannot pause, resume or change caps and budgets.');
    expect((await refusal(rmxCall(R.offerCatalog, { offerId: 'dg-101', dryRun: true }))).code).toBe('forbidden');
    expect((await offerById('dg-101')).operatorStatus).toBe('active');
  });

  it('keeps used when the cap changes', async () => {
    await rmxCall(R.offerCatalog, { offerId: 'dg-101', dailyCap: 300, dryRun: false }, OP);
    const o = await offerById('dg-101');
    expect(o.dailyCap).toBe(300);
    expect(o.capRemaining).toBe(137);
    await rmxCall(R.offerCatalog, { offerId: 'dg-101', dailyCap: 100, dryRun: false }, OP);
    expect((await offerById('dg-101')).capRemaining).toBe(0);
    await rmxCall(R.offerCatalog, { offerId: 'dg-101', dailyCap: null, dryRun: false }, OP);
    expect((await offerById('dg-101')).capRemaining).toBeNull();
  });

  it('validates caps and budgets with fields', async () => {
    const e = await refusal(rmxCall(R.offerCatalog, { offerId: 'dg-101', dailyCap: -1, dailyBudget: 1.5, dryRun: true }, OP));
    expect(e.code).toBe('invalid');
    expect(Object.keys(e.fields).sort()).toEqual(['dailyBudget', 'dailyCap']);
  });

  it('refuses the data-pass resume and the QA offer', async () => {
    const dp = await refusal(rmxCall(R.offerCatalog, { offerId: 'dg-104', operatorStatus: 'active', dryRun: true }, OP));
    expect(dp.code).toBe('invalid');
    expect(dp.message).toBe('A data-pass offer cannot go live without counsel approval and a counsel reference.');
    const qa = await refusal(rmxCall(R.offerCatalog, { offerId: 'qa-test-1', operatorStatus: 'paused', dryRun: true }, OP));
    expect(qa.message).toBe('The QA test offer is not editable.');
    const qaRules = await refusal(rmxCall(R.offerRules, { offerId: 'qa-test-1', rules: { minDebt: 5 }, dryRun: true }, OP));
    expect(qaRules.message).toBe('The QA test offer is not editable.');
    expect((await refusal(rmxCall(R.offerCatalog, { offerId: 'zz', dryRun: true }, OP))).code).toBe('not_found');
  });

  it('applies rules with only the changed fields and validates them', async () => {
    const res = await rmxCall(R.offerRules, { offerId: 'dg-101', rules: { minDebt: 12000, pConv: 0.12 }, dryRun: false }, OP);
    expect(res.data.before).toEqual({ minDebt: 10000 });
    expect(res.data.after).toEqual({ minDebt: 12000 });
    expect((await offerById('dg-101')).rules.minDebt).toBe(12000);
    const bad = await refusal(rmxCall(R.offerRules, { offerId: 'dg-101', rules: { pConv: 2, excludedStates: ['ny'] }, dryRun: true }, OP));
    expect(Object.keys(bad.fields).sort()).toEqual(['excludedStates', 'pConv']);
    const range = await refusal(rmxCall(R.offerRules, { offerId: 'sp-201', rules: { minLoanAmount: 2000 }, dryRun: true }, OP));
    expect(range.fields).toHaveProperty('minLoanAmount');
  });

  it('refuses hubctl-only flags', async () => {
    const e = await refusal(rmxCall(R.offerRules, { offerId: 'sp-201', rules: { mlaCompliant: true }, dryRun: true }, OP));
    expect(e.code).toBe('invalid');
    expect(e.message).toMatch(/stays in hubctl \(Decision 5\)/);
    expect(e.fields).toHaveProperty('mlaCompliant');
  });
});

describe('store: payouts', () => {
  it('refuses payout proposals on the QA test offer', async () => {
    const e = await refusal(rmxCall(R.payoutPropose, { offerId: 'qa-test-1', payoutModel: 'CPL', payoutValue: 99 }, OP));
    expect(e.message).toBe('The QA test offer is not editable.');
  });

  const propose = { offerId: 'dg-101', payoutModel: 'CPL', payoutValue: 47, note: 'test', dryRun: false };

  it('proposes and writes an audit row', async () => {
    const dry = await rmxCall(R.payoutPropose, { ...propose, dryRun: true }, OP);
    expect(dry.data.applied).toBe(false);
    expect((await read(R.payouts)).length).toBe(4);
    const res = await rmxCall(R.payoutPropose, propose, OP);
    expect(res.data.applied).toBe(true);
    expect(res.data.id).toBe('pc-5');
    expect((await read(R.payouts))[0]).toMatchObject({ id: 'pc-5', proposedBy: 'operator@example.com', outcome: null });
    expect((await read(R.audit))[0].action).toBe('payout_proposed');
    expect((await refusal(rmxCall(R.payoutPropose, propose, APPROVER))).code).toBe('forbidden');
  });

  it('approves pc-1: sets the offer payout and audits', async () => {
    const dry = await rmxCall(R.payoutDecide, { id: 'pc-1', outcome: 'approved', dryRun: true }, APPROVER);
    expect(dry.data.applied).toBe(false);
    expect((await offerById('dg-101')).payoutValue).toBe(42.5);
    await rmxCall(R.payoutDecide, { id: 'pc-1', outcome: 'approved', dryRun: false }, APPROVER);
    expect((await offerById('dg-101')).payoutValue).toBe(45);
    const row = (await read(R.payouts)).find((p) => p.id === 'pc-1');
    expect(row).toMatchObject({ outcome: 'approved', decidedBy: 'approver@example.com' });
    expect((await read(R.audit))[0].action).toBe('payout_approved');
    expect((await refusal(rmxCall(R.payoutDecide, { id: 'pc-1', outcome: 'rejected', dryRun: true }, APPROVER))).message).toBe('Already decided.');
  });

  it('rejects without touching the offer', async () => {
    await rmxCall(R.payoutDecide, { id: 'pc-1', outcome: 'rejected', dryRun: false }, APPROVER);
    expect((await offerById('dg-101')).payoutValue).toBe(42.5);
    expect((await read(R.audit))[0].action).toBe('payout_rejected');
  });

  it('refuses your own proposal and the wrong role', async () => {
    const own = await refusal(rmxCall(R.payoutDecide, { id: 'pc-2', outcome: 'approved', dryRun: true }, APPROVER));
    expect(own.code).toBe('forbidden');
    expect((await refusal(rmxCall(R.payoutDecide, { id: 'pc-1', outcome: 'approved', dryRun: true }, OP))).code).toBe('forbidden');
    expect((await refusal(rmxCall(R.payoutDecide, { id: 'zz', outcome: 'approved', dryRun: true }, APPROVER))).code).toBe('not_found');
  });

  it('flags a stale proposal', async () => {
    await rmxCall(R.payoutPropose, propose, OP);
    await rmxCall(R.payoutDecide, { id: 'pc-5', outcome: 'approved', dryRun: false }, APPROVER);
    const e = await refusal(rmxCall(R.payoutDecide, { id: 'pc-1', outcome: 'approved', dryRun: true }, APPROVER));
    expect(e.code).toBe('conflict');
    expect(e.message).toBe('Stale: a later proposal for this offer was approved.');
  });
});

describe('store: simulate', () => {
  it('lists failed rules in order', async () => {
    const res = await rmxCall(R.simulate, { vertical: 'debt', inputs: { state: 'CA', debtAmount: 8000, employmentStatus: 'employed' } }, VIEWER);
    const by = Object.fromEntries(res.data.results.map((r) => [r.offerId, r]));
    expect(res.data.gate).toBe(0.02);
    expect(by['dg-102'].failedRules).toEqual(['cap_reached', 'min_debt']);
    expect(by['dg-103'].failedRules).toEqual(['operator_paused', 'min_debt']);
    expect(by['dg-104'].failedRules).toEqual(['operator_paused', 'excluded_states', 'min_debt']);
    expect(by['dg-101'].failedRules).toEqual(['min_debt']);
    expect(by['dg-106'].qualifies).toBe(true);
  });

  it('refuses personal-data keys, case-insensitively', async () => {
    const e = await refusal(rmxCall(R.simulate, { vertical: 'debt', inputs: { Email: 'x', state: 'CA', phone: '1' } }, OP));
    expect(e.code).toBe('invalid');
    expect(e.message).toBe('Personal data keys are refused: email, phone.');
  });

  it('refuses camelCase personal-data keys', async () => {
    const e = await refusal(rmxCall(R.simulate, { vertical: 'debt', inputs: { firstName: 'x', leadRef: '1', visitId: '2', emailAddress: 'a' } }, OP));
    expect(e.code).toBe('invalid');
    expect(e.message).toContain('firstname');
    expect(e.message).toContain('emailaddress');
  });

  it('checks payday inputs', async () => {
    const res = await rmxCall(R.simulate, { vertical: 'payday', inputs: { state: 'TX', loanAmount: 5000, payFrequency: 'daily', monthlyIncome: 100 } }, OP);
    expect(res.data.results[0].failedRules).toEqual(['operator_paused', 'loan_range', 'pay_frequency', 'min_monthly_income']);
  });
});

describe('store: verticals and config', () => {
  it('reads verticals, checklist and sets', async () => {
    const v = await read(R.verticals);
    expect(v.map((x) => x.key)).toEqual(['debt', 'payday']);
    expect(v[0].offerCounts.capped).toBe(1);
    expect((await read(R.checklist, { vertical: 'payday' })).steps).toHaveLength(9);
    expect((await read(R.questionSets)).sets).toHaveLength(4);
  });

  it('saves a vertical draft with field errors', async () => {
    const body = { name: 'auto_loans', instructions: 'x', leadDescription: 'y', catalogSource: 'example-debt-site', websites: [], blockedStates: [] };
    expect((await refusal(rmxCall(R.verticalDraftSave, body, OP))).code).toBe('forbidden');
    for (const name of ['', 'Bad Name', 'debt']) {
      const e = await refusal(rmxCall(R.verticalDraftSave, { ...body, name }, EDITOR));
      expect(e.code).toBe('invalid');
      expect(e.fields).toHaveProperty('name');
    }
    const ok = await rmxCall(R.verticalDraftSave, body, EDITOR);
    expect(ok.data).toMatchObject({ name: 'auto_loans', status: 'draft', createdBy: 'editor@example.com' });
    expect((await read(R.verticalDrafts))).toHaveLength(1);
    expect((await read(R.audit)).length).toBe(6);
    expect((await refusal(rmxCall(R.verticalDraftSave, body, EDITOR))).fields).toHaveProperty('name');
  });

  it('runs config draft -> validate -> approve, and approval opens the pull request', async () => {
    const saved = (await rmxCall(R.configSave, { title: 'Gate 0.05', kind: 'gate', target: 'global', proposed: { confidence_gate: 0.05 } }, EDITOR)).data;
    expect(saved).toMatchObject({ id: 'cfg-d-4', status: 'draft', validation: null });
    expect((await refusal(rmxCall(R.configApprove, { id: saved.id }, APPROVER))).code).toBe('conflict');
    const validated = (await rmxCall(R.configValidate, { id: saved.id }, EDITOR)).data;
    expect(validated.status).toBe('validated');
    expect(validated.validation.errors).toEqual([]);
    expect(validated.validation.warnings).toEqual(['gate change: needs owner approval']);
    expect(validated.validation.diff).toEqual(['- confidence_gate: 0.02', '+ confidence_gate: 0.05']);
    expect((await refusal(rmxCall(R.configApprove, { id: saved.id }, EDITOR))).code).toBe('forbidden');
    const out = (await rmxCall(R.configApprove, { id: saved.id }, APPROVER)).data;
    expect(out).toMatchObject({ status: 'pr_open', prNumber: 241, approvedBy: 'approver@example.com' });
    expect(out.fileName).toBe('config/router.json');
    expect(JSON.parse(out.fileText).confidence_gate).toBe(0.05);
    expect(out.fileText).toContain('\n  "confidence_gate"');
    expect(out.prTitle).toBe('config: Gate 0.05');
    expect(out.prBody).toContain('```diff');
    expect(out.prBody).toContain('+ confidence_gate: 0.05');
    const drafts = await read(R.configDrafts);
    expect(drafts.find((d) => d.id === 'cfg-d-4').status).toBe('pr_open');
    expect(drafts.find((d) => d.id === 'cfg-d-4').history.map((h) => h.step)).toEqual(['drafted', 'validated', 'approved', 'pr_opened']);
    expect((await read(R.overview)).gate).toBe(0.02);
    expect((await read(R.audit)).length).toBe(6);
  });

  it('refuses to validate or edit a draft whose pull request is open', async () => {
    expect((await refusal(rmxCall(R.configValidate, { id: 'cfg-d-3' }, EDITOR))).code).toBe('conflict');
    const saved = (await rmxCall(R.configSave, { title: 'G', kind: 'gate', target: 'global', proposed: { confidence_gate: 0.05 } }, EDITOR)).data;
    await rmxCall(R.configValidate, { id: saved.id }, EDITOR);
    await rmxCall(R.configApprove, { id: saved.id }, APPROVER);
    expect((await refusal(rmxCall(R.configValidate, { id: saved.id }, EDITOR))).code).toBe('conflict');
    expect((await refusal(rmxCall(R.configSave, { id: saved.id, title: 'G', kind: 'gate', target: 'global', proposed: {} }, EDITOR))).code).toBe('conflict');
    expect((await read(R.configDrafts)).find((x) => x.id === saved.id).status).toBe('pr_open');
  });

  it('re-validates a validated draft but still refuses approved ones', async () => {
    const saved = (await rmxCall(R.configSave, { title: 'G2', kind: 'gate', target: 'global', proposed: { confidence_gate: 0.05 } }, EDITOR)).data;
    await rmxCall(R.configValidate, { id: saved.id }, EDITOR);
    const again = (await rmxCall(R.configValidate, { id: saved.id }, EDITOR)).data;
    expect(again.status).toBe('validated');
    expect(again.history.filter((h) => h.step === 'validated')).toHaveLength(2);
  });

  it('refuses approving your own draft even for an approver', async () => {
    const own = { email: 'editor@example.com', role: 'RMX_APPROVER' };
    const saved = (await rmxCall(R.configSave, { title: 'Own', kind: 'gate', target: 'global', proposed: { confidence_gate: 0.05 } }, EDITOR)).data;
    await rmxCall(R.configValidate, { id: saved.id }, EDITOR);
    const e = await refusal(rmxCall(R.configApprove, { id: saved.id }, own));
    expect(e.code).toBe('forbidden');
    expect(e.message).toBe('You drafted this change; another approver must approve it.');
  });

  it('keeps PR text on an opened pull request and computes it for the seeded one', async () => {
    const saved = (await rmxCall(R.configSave, { title: 'Gate 0.05', kind: 'gate', target: 'global', proposed: { confidence_gate: 0.05 } }, EDITOR)).data;
    await rmxCall(R.configValidate, { id: saved.id }, EDITOR);
    const out = (await rmxCall(R.configApprove, { id: saved.id }, APPROVER)).data;
    const drafts = await read(R.configDrafts);
    const kept = drafts.find((x) => x.id === saved.id);
    expect(kept).toMatchObject({ prTitle: out.prTitle, prBody: out.prBody, diff: out.diff });
    const seeded = drafts.find((x) => x.id === 'cfg-d-3');
    expect(seeded.prTitle).toBe('config: Tighten payday Jev wording');
    expect(seeded.prBody).toContain('```diff');
    expect(Array.isArray(seeded.diff)).toBe(true);
  });

  it('reports validation errors and keeps the draft unvalidated', async () => {
    const bad = (await rmxCall(R.configSave, { title: 'Bad', kind: 'gate', target: 'global', proposed: { confidence_gate: 1.5 } }, EDITOR)).data;
    const res = (await rmxCall(R.configValidate, { id: bad.id }, EDITOR)).data;
    expect(res.status).toBe('draft');
    expect(res.validation.errors.length).toBe(1);
    const states = (await rmxCall(R.configSave, { title: 'S', kind: 'blocked_states', target: 'debt', proposed: { blocked_states: ['wv'] } }, EDITOR)).data;
    expect((await rmxCall(R.configValidate, { id: states.id }, EDITOR)).data.validation.errors.length).toBe(1);
    const jev = (await rmxCall(R.configSave, { title: 'J', kind: 'jev_wording', target: 'nowhere', proposed: { instructions: ' ' } }, EDITOR)).data;
    expect((await rmxCall(R.configValidate, { id: jev.id }, EDITOR)).data.validation.errors.length).toBe(2);
  });

  it('needs a counsel reference for blocked states', async () => {
    const e = await refusal(rmxCall(R.configApprove, { id: 'cfg-d-2' }, APPROVER));
    expect(e.code).toBe('invalid');
    expect(e.fields).toHaveProperty('counselRef');
    const out = (await rmxCall(R.configApprove, { id: 'cfg-d-2', counselRef: 'CR-2026-099' }, APPROVER)).data;
    expect(out.counselRef).toBe('CR-2026-099');
    expect(JSON.parse(out.fileText).verticals.debt.blocked_states).toEqual(['WV']);
    expect(out.prBody).toContain('CR-2026-099');
  });

  it('opens a question set pull request against its form file, and edits reset a validated draft', async () => {
    const d = (await rmxCall(R.configSave, { title: 'Low debt', kind: 'question_set', target: 'low_debt', proposed: { fields: ['employment_status'] } }, EDITOR)).data;
    await rmxCall(R.configValidate, { id: d.id }, EDITOR);
    const again = (await rmxCall(R.configSave, { id: d.id, title: 'Low debt 2', kind: 'question_set', target: 'low_debt', proposed: { fields: ['employment_status'] } }, EDITOR)).data;
    expect(again).toMatchObject({ id: d.id, status: 'draft', validation: null });
    await rmxCall(R.configValidate, { id: d.id }, EDITOR);
    const out = (await rmxCall(R.configApprove, { id: d.id, counselRef: 'CR-1' }, APPROVER)).data;
    expect(out.fileName).toBe('config/forms/example-debt-site.example-debt-site.json');
    expect(JSON.parse(out.fileText).sets.find((s) => s.id === 'low_debt').fields).toEqual(['employment_status']);
  });

  it('rejects a validated draft only with a reason', async () => {
    expect((await refusal(rmxCall(R.configReject, { id: 'cfg-d-2', reason: 'no' }, EDITOR))).code).toBe('forbidden');
    expect((await refusal(rmxCall(R.configReject, { id: 'cfg-d-1', reason: 'no' }, APPROVER))).code).toBe('conflict');
    expect((await refusal(rmxCall(R.configReject, { id: 'cfg-d-2', reason: ' ' }, APPROVER))).fields).toHaveProperty('reason');
    const r = (await rmxCall(R.configReject, { id: 'cfg-d-2', reason: 'Counsel has not signed off.' }, ADMIN)).data;
    expect(r).toMatchObject({ status: 'rejected', rejectedBy: 'admin@example.com', rejectReason: 'Counsel has not signed off.' });
    expect((await refusal(rmxCall(R.configApprove, { id: 'cfg-d-2', counselRef: 'X' }, APPROVER))).code).toBe('conflict');
    expect((await refusal(rmxCall(R.configSave, { id: 'cfg-d-2', title: 'x', kind: 'blocked_states', target: 'debt' }, EDITOR))).code).toBe('conflict');
  });

  it('simulated merge puts the change live and updates both servers', async () => {
    expect((await refusal(rmxCall(R.configMerge, { id: 'cfg-d-2' }, ADMIN))).code).toBe('conflict');
    await rmxCall(R.configApprove, { id: 'cfg-d-2', counselRef: 'CR-9' }, ADMIN);
    const merged = (await rmxCall(R.configMerge, { id: 'cfg-d-2' }, VIEWER)).data;
    expect(merged.status).toBe('merged');
    expect(merged.configVersion).toMatch(/^cfg-[0-9a-f]{7}$/);
    expect((await read(R.verticals)).find((v) => v.key === 'debt').blockedStates).toEqual(['WV']);
    const servers = (await read(R.overview)).servers;
    expect(servers.every((x) => x.configVersion === merged.configVersion)).toBe(true);
    expect(merged.configVersion).not.toBe('cfg-7f3a2c1');
    expect((await refusal(rmxCall(R.configMerge, { id: 'cfg-d-2' }, ADMIN))).code).toBe('conflict');
    await rmxCall(R.configMerge, { id: 'cfg-d-3' }, ADMIN);
    expect((await read(R.verticals)).find((v) => v.key === 'payday').instructions).toMatch(/^Choose the one offer that is clear/);
  });

  it('lists the review queue and lets a Super admin review, but never their own work', async () => {
    const q = await read(R.reviewQueue);
    expect(q.configDrafts.map((d) => d.id)).toEqual(['cfg-d-2']);
    expect(q.payouts.map((p) => p.id)).toEqual(['pc-2', 'pc-1']);
    expect(q.pullRequests.map((d) => [d.id, d.prNumber])).toEqual([['cfg-d-3', 238]]);
    await rmxCall(R.payoutDecide, { id: 'pc-1', outcome: 'approved' }, ADMIN);
    const own = (await rmxCall(R.payoutPropose, { offerId: 'dg-102', payoutModel: 'CPL', payoutValue: 50 }, ADMIN)).data;
    expect((await refusal(rmxCall(R.payoutDecide, { id: own.id, outcome: 'approved' }, ADMIN))).code).toBe('forbidden');
    const mine = (await rmxCall(R.configSave, { title: 'Mine', kind: 'gate', target: 'global', proposed: { confidence_gate: 0.04 } }, ADMIN)).data;
    await rmxCall(R.configValidate, { id: mine.id }, ADMIN);
    expect((await refusal(rmxCall(R.configApprove, { id: mine.id }, ADMIN))).code).toBe('forbidden');
    const after = await read(R.reviewQueue);
    expect(after.payouts.map((p) => p.id)).toEqual([own.id, 'pc-2']);
    expect(after.configDrafts.map((d) => d.id)).toEqual(['cfg-d-2', mine.id]);
  });
});

describe('store: demo modes', () => {
  it('empty mode reads from the empty state', async () => {
    setDemoMode('empty');
    expect(await read(R.offers)).toEqual([]);
    expect(await read(R.verticals)).toEqual([]);
    expect((await read(R.questionSets)).sets).toEqual([]);
    expect((await read(R.checklist, { vertical: 'payday' })).steps).toEqual([]);
    expect((await read(R.overview)).verticals).toEqual([]);
    expect((await read(R.dashboard, { preset: 'today' }))).toBeTruthy();
  });

  it('error mode rejects reads but not mutations', async () => {
    setDemoMode('error');
    const e = await refusal(rmxCall(R.offers));
    expect(e).toBeInstanceOf(RmxError);
    expect(e.code).toBe('unavailable');
    expect(e.message).toBe('Sample error: the RedirectMax internal API did not answer.');
    const res = await rmxCall(R.offerCatalog, { offerId: 'dg-101', operatorStatus: 'paused', dryRun: false }, OP);
    expect(res.data.applied).toBe(true);
  });

  it('mutations ignore empty mode', async () => {
    setDemoMode('empty');
    const res = await rmxCall(R.offerCatalog, { offerId: 'dg-101', operatorStatus: 'paused', dryRun: false }, OP);
    expect(res.data.applied).toBe(true);
    setDemoMode('normal');
    expect((await offerById('dg-101')).operatorStatus).toBe('paused');
  });
});
