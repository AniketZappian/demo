// Sample dashboard payloads for the LeadScience home (R.dashboard). Invented numbers, no real people.

const PRESETS = {
  today: { leads: 312, qualified: 241, calls: 38, revenue: 6120.5, cost: 3890.25, factor: 1 },
  '7d': { leads: 2104, qualified: 1622, calls: 261, revenue: 41873.75, cost: 26540.1, factor: 7 },
  '30d': { leads: 9188, qualified: 7011, calls: 1124, revenue: 181240.0, cost: 114905.6, factor: 30 },
};

const CAMPAIGNS = [
  ['Sample Debt Relief A', 0.31],
  ['Sample Debt Relief B', 0.24],
  ['Sample Consolidation', 0.18],
  ['Sample Credit Repair', 0.12],
  ['Sample Short Term Loan', 0.08],
];
const BUYERS = [
  ['Sample Buyer One', 0.38],
  ['Sample Buyer Two', 0.27],
  ['Sample Buyer Three', 0.2],
  ['Sample Buyer Four', 0.1],
];
const PUBLISHERS = [
  ['example-debt-site', 0.62],
  ['swiftpaydayfund', 0.2],
  ['sample-email-partner', 0.12],
];

function rows(list, p, idPrefix) {
  return list.map(([name, share], i) => ({
    id: `${idPrefix}-${i + 1}`,
    name,
    leads: Math.round(p.leads * share),
    qualified: Math.round(p.qualified * share),
    revenue: Math.round(p.revenue * share * 100) / 100,
  }));
}

export function dashboardSample(preset = 'today') {
  const p = PRESETS[preset] || PRESETS.today;
  return {
    summary: {
      preset: PRESETS[preset] ? preset : 'today',
      leads: p.leads,
      qualified: p.qualified,
      qualifiedRate: Math.round((p.qualified / p.leads) * 1000) / 10,
      calls: p.calls,
      revenue: p.revenue,
      cost: p.cost,
      margin: Math.round((p.revenue - p.cost) * 100) / 100,
    },
    topCampaigns: rows(CAMPAIGNS, p, 'cmp'),
    topBuyers: rows(BUYERS, p, 'buy'),
    topPublishers: rows(PUBLISHERS, p, 'pub'),
    health: [
      { key: 'lead_intake', label: 'Lead intake', status: 'ok' },
      { key: 'buyer_delivery', label: 'Buyer delivery', status: 'ok' },
      { key: 'reconciliation', label: 'Reconciliation', status: 'alert' },
    ],
  };
}

export function emptyDashboard() {
  return {
    summary: {
      preset: 'today', leads: 0, qualified: 0, qualifiedRate: 0, calls: 0, revenue: 0, cost: 0, margin: 0,
    },
    topCampaigns: [],
    topBuyers: [],
    topPublishers: [],
    health: [],
  };
}
