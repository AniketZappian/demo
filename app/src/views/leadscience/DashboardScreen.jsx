import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Card, CardContent, Grid, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import PageHeader from '../../components/PageHeader';
import AsyncState from '../../components/AsyncState';
import SimpleTable from '../../components/SimpleTable';
import StatusPill from '../../components/StatusPill';
import { R } from '../../rmx/store';
import { useRmxQuery } from '../../rmx/useRmx';
import { formatMoney, formatPct } from '../../rmx/format';

const PRESETS = [
  ['today', 'Today'],
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
];

const nameCol = (label) => ({ key: 'name', label });
const num = (key, label) => ({ key, label, align: 'right' });
const money = { key: 'revenue', label: 'Revenue', align: 'right', render: (r) => formatMoney(r.revenue) };

function Tile({ label, value }) {
  return (
    <Card data-testid={`tile-${label}`}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5">{value}</Typography>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      {children}
    </Box>
  );
}

export default function DashboardScreen() {
  const [preset, setPreset] = useState('today');
  const { data, loading, error, reload } = useRmxQuery(R.dashboard, { preset });
  const s = data?.summary;
  const tiles = s && [
    ['Received', s.leads],
    ['Sold', s.qualified],
    ['Sell-through', formatPct(s.qualifiedRate)],
    ['Revenue', formatMoney(s.revenue)],
    ['Avg sold price', s.qualified ? formatMoney(s.revenue / s.qualified) : formatMoney(0)],
  ];

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <PageHeader title="Dashboard" />
        <ToggleButtonGroup
          exclusive
          size="small"
          value={preset}
          onChange={(_, v) => v && setPreset(v)}
          aria-label="Date range"
        >
          {PRESETS.map(([value, label]) => <ToggleButton key={value} value={value}>{label}</ToggleButton>)}
        </ToggleButtonGroup>
        <AsyncState
          loading={loading}
          error={error}
          isEmpty={!!data && data.summary.leads === 0}
          emptyText="No leads in this period."
          onRetry={reload}
        >
          {data && (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                {tiles.map(([label, value]) => (
                  <Grid item xs={12} sm={6} md={2.4} key={label}><Tile label={label} value={value} /></Grid>
                ))}
              </Grid>
              <Section title="Top campaigns">
                <SimpleTable
                  ariaLabel="Top campaigns"
                  rowKey="id"
                  rows={data.topCampaigns}
                  columns={[nameCol('Campaign'), num('leads', 'Received'), num('qualified', 'Sold'), money]}
                />
              </Section>
              <Section title="Top buyers">
                <SimpleTable
                  ariaLabel="Top buyers"
                  rowKey="id"
                  rows={data.topBuyers}
                  columns={[nameCol('Buyer'), num('leads', 'Posts'), num('qualified', 'Accepted'), money]}
                />
              </Section>
              <Section title="Top publishers">
                <SimpleTable
                  ariaLabel="Top publishers"
                  rowKey="id"
                  rows={data.topPublishers}
                  columns={[nameCol('Publisher'), num('leads', 'Received'), num('qualified', 'Sold'), money]}
                />
              </Section>
              <Section title="Last-hour health">
                <SimpleTable
                  ariaLabel="Last-hour health"
                  rowKey="key"
                  rows={data.health}
                  columns={[
                    { key: 'label', label: 'Check' },
                    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
                  ]}
                />
              </Section>
            </Stack>
          )}
        </AsyncState>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>RedirectMax console</Typography>
            <Stack direction="row" spacing={2}>
              <Button component={Link} to="/redirectmax/operations" variant="contained">Operations</Button>
              <Button component={Link} to="/redirectmax/setup" variant="outlined">Setup and changes</Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
