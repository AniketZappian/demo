import { DEMO_TODAY, seedState, emptyState } from './sampleData';
import { dashboardSample, emptyDashboard } from './sampleDashboard';

const KEYS = ['routerFile', 'verticalMeta', 'servers', 'offers', 'payouts', 'decisions', 'catalogSyncs',
  'reconciliations', 'audit', 'verticalDrafts', 'checklist', 'configDrafts', 'nextPr', 'questionSets', 'publishers', 'settings'];
const byId = (list, id, key = 'offerId') => list.find((x) => x[key] === id);

describe('seedState', () => {
  const s = seedState();

  it('has the contract keys and today', () => {
    expect(DEMO_TODAY).toBe('2026-11-19');
    expect(Object.keys(s).sort()).toEqual([...KEYS].sort());
    expect(Object.keys(emptyState()).sort()).toEqual([...KEYS].sort());
  });

  it('has the fixed offers', () => {
    const o = s.offers;
    expect(byId(o, 'dg-101')).toMatchObject({ name: 'Sample Debt Relief A', operatorStatus: 'active', mode: 'click_out',
      payoutModel: 'CPL', payoutValue: 42.5, dailyCap: 200, capRemaining: 37 });
    expect(byId(o, 'dg-102')).toMatchObject({ operatorStatus: 'active', capRemaining: 0 });
    expect(byId(o, 'dg-103').operatorStatus).toBe('paused');
    expect(byId(o, 'dg-104')).toMatchObject({ mode: 'data_pass', counselApproved: false, operatorStatus: 'paused' });
    expect(byId(o, 'qa-test-1')).toMatchObject({ isQaTest: true, operatorStatus: 'active' });
    ['dg-105', 'dg-106', 'dg-107', 'dg-108'].forEach((id) => expect(byId(o, id).operatorStatus).toBe('active'));
    ['sp-201', 'sp-202'].forEach((id) => {
      const x = byId(o, id);
      expect([x.vertical, x.operatorStatus, x.rules.mlaCompliant]).toEqual(['payday', 'paused', false]);
    });
  });

  it('has payouts', () => {
    const p = s.payouts;
    expect(byId(p, 'pc-1', 'id')).toMatchObject({ offerId: 'dg-101', proposedBy: 'operator@example.com',
      currentValue: 42.5, payoutValue: 45, outcome: null });
    expect(byId(p, 'pc-2', 'id')).toMatchObject({ offerId: 'dg-105', proposedBy: 'approver@example.com', outcome: null });
    expect(byId(p, 'pc-3', 'id').outcome).toBe('approved');
    expect(byId(p, 'pc-4', 'id').outcome).toBe('rejected');
  });

  it('has decisions without personal keys', () => {
    const d = s.decisions;
    const today = d.filter((x) => x.decidedAt.startsWith(DEMO_TODAY));
    expect(today).toHaveLength(24);
    expect(new Set(today.map((x) => x.outcome))).toEqual(new Set(['clicked', 'no_redirect', 'pending', 'bounced']));
    expect(today.filter((x) => x.offerId === null)).toHaveLength(4);
    d.filter((x) => x.offerId === null).forEach((x) => {
      expect(x.outcome).toBe('no_redirect');
      expect(x.gated).toBe(x.confidence < s.routerFile.confidence_gate);
    });
    expect(d.filter((x) => x.outcome === 'no_redirect').every((x) => x.offerId === null)).toBe(true);
    const d1 = byId(d, 'dec-001', 'decisionId');
    const rules = (id) => d1.failedRules.find((f) => f.offerId === id).rules;
    expect(rules('dg-102')).toEqual(['cap_reached']);
    expect(rules('dg-103')).toEqual(['operator_paused']);
    expect(rules('dg-104')).toEqual(['excluded_states', 'min_debt']);
    d.forEach((x) => ['lead_ref', 'visit_id', 'answers'].forEach((k) => expect(x).not.toHaveProperty(k)));
  });

  it('builds the payday diff from the router file', () => {
    const c = byId(s.configDrafts, 'cfg-d-3', 'id');
    expect(c.validation.diff[0]).toBe(`- instructions: ${JSON.stringify(s.routerFile.verticals.payday.instructions)}`);
  });

  it('has gate 0.02, no 0.75, payday draft', () => {
    expect(s.routerFile.confidence_gate).toBe(0.02);
    expect(JSON.stringify(s)).not.toContain('0.75');
    expect(JSON.stringify(seedState())).not.toContain('0.75');
    expect(s.verticalMeta).toEqual({ debt: 'live', payday: 'draft' });
    expect(JSON.stringify(s.routerFile)).not.toContain('_note');
    expect(s.servers.map((x) => [x.name, x.configVersion])).toEqual([['decide-1', 'cfg-7f3a2c1'], ['decide-2', 'cfg-7f3a2c1']]);
  });

  it('has audit, syncs, recon', () => {
    expect(s.audit.map((a) => a.id).sort()).toEqual(['aud-001', 'aud-002', 'aud-003', 'aud-004', 'aud-005', 'aud-006']);
    expect(s.audit.some((a) => a.actor === 'ops-admin (hubctl)')).toBe(true);
    expect(s.catalogSyncs).toHaveLength(5);
    expect(s.catalogSyncs.filter((x) => x.status === 'failed')).toHaveLength(1);
    expect(s.reconciliations).toHaveLength(7);
    const alerts = s.reconciliations.filter((r) => r.status === 'alert');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].diffPct).toBe(6.2);
    s.reconciliations.forEach((r) => expect(r.diffPct).toBe(Math.round((Math.abs(r.ours - r.theirs) / r.theirs) * 1000) / 10));
  });

  it('has checklist, config drafts, sets, publishers, settings', () => {
    expect(s.checklist.steps.map((x) => [x.status, x.waitingOn])).toEqual([
      ['done', null], ['done', null], ['waiting', 'Counsel'], ['waiting', 'Tech lead'], ['not_started', null],
      ['not_started', null], ['not_started', null], ['waiting', 'Counsel'], ['not_started', null]]);
    const c = s.configDrafts;
    expect(byId(c, 'cfg-d-1', 'id')).toMatchObject({ status: 'draft', createdBy: 'editor@example.com' });
    expect(byId(c, 'cfg-d-2', 'id')).toMatchObject({ status: 'validated', createdBy: 'editor@example.com' });
    expect(byId(c, 'cfg-d-3', 'id')).toMatchObject({ status: 'pr_open', prNumber: 238 });
    expect(s.questionSets.sets.map((x) => x.id)).toEqual(['standard', 'settlement_ready', 'low_debt', 'hardship']);
    expect(s.questionSets).toMatchObject({ holdoutPercent: 20, defaultSet: 'standard' });
    expect(s.questionSets.sets.map((x) => x.id)).toContain(s.questionSets.defaultSet);
    expect(s.publishers.map((p) => [p.publisherId, p.hasKey])).toEqual([['example-debt-site', true], ['swiftpaydayfund', false]]);
    expect(s.settings).toHaveLength(10);
    expect(byId(s.settings, 'reversal_deduct_limit', 'key').on).toBe(false);
    expect(byId(s.settings, 'LEADS_STORE_ENABLED', 'key').on).toBe(false);
    expect(byId(s.settings, 'RMX_SERVICE_KEY', 'key').source).toBe('environment');
  });

  it('returns independent copies', () => {
    const a = seedState();
    const b = seedState();
    a.offers[0].name = 'changed';
    a.routerFile.verticals.debt.publishers.push('x');
    expect(b.offers[0].name).not.toBe('changed');
    expect(b.routerFile.verticals.debt.publishers).toEqual([]);
  });
});

describe('emptyState', () => {
  it('is empty', () => {
    const e = emptyState();
    ['offers', 'payouts', 'decisions', 'catalogSyncs', 'reconciliations', 'audit', 'verticalDrafts', 'configDrafts',
      'publishers', 'settings', 'servers'].forEach((k) => expect(e[k]).toEqual([]));
    expect(e.routerFile.verticals).toEqual({});
    expect(e.checklist.steps).toEqual([]);
    expect(e.questionSets.sets).toEqual([]);
  });
});

describe('dashboard', () => {
  it('has the shape for each preset', () => {
    ['today', '7d', '30d'].forEach((p) => {
      const d = dashboardSample(p);
      expect(Object.keys(d).sort()).toEqual(['health', 'summary', 'topBuyers', 'topCampaigns', 'topPublishers']);
      expect(d.topCampaigns.length).toBeGreaterThan(0);
    });
    expect(dashboardSample('30d').summary.leads).toBeGreaterThan(dashboardSample('today').summary.leads);
  });
  it('has an empty form', () => {
    const d = emptyDashboard();
    expect(d.summary.leads).toBe(0);
    expect(d.topCampaigns).toEqual([]);
  });
});
