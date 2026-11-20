import { Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import AsyncState from '../../components/AsyncState';
import PageHeader from '../../components/PageHeader';
import SimpleTable from '../../components/SimpleTable';
import StatusPill from '../../components/StatusPill';
import { formatDateTime } from '../../rmx/format';
import { R } from '../../rmx/store';
import { useRmxQuery } from '../../rmx/useRmx';

const OUTCOMES = [
  ['clicked', 'Clicked'],
  ['no_redirect', 'No redirect'],
  ['pending', 'Pending'],
  ['bounced', 'Bounced'],
];

function Tile({ label, value, caption }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5">{value}</Typography>
        {caption && <Typography variant="caption" color="text.secondary">{caption}</Typography>}
      </CardContent>
    </Card>
  );
}

const verticalColumns = [
  { key: 'key', label: 'Vertical', render: (v) => (<Stack direction="row" spacing={1} alignItems="center"><span>{v.key}</span><StatusPill status={v.status} /></Stack>) },
  { key: 'active', label: 'Active', align: 'right' },
  { key: 'paused', label: 'Paused', align: 'right' },
  { key: 'capped', label: 'Capped', align: 'right' },
];

const serverColumns = [
  { key: 'name', label: 'Server' },
  { key: 'configVersion', label: 'Config version' },
];

export default function OverviewScreen() {
  const { data, loading, error, reload } = useRmxQuery(R.overview, {});
  const push = data?.lastOfferPush;
  const recon = data?.lastReconciliation;

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <PageHeader title="Overview" />
        <AsyncState
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={!!data && data.verticals.length === 0}
          emptyText="No verticals configured."
        >
          {data && (
            <>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}><Tile label="Confidence gate" value={data.gate} caption="router.json, live" /></Grid>
                <Grid item xs={12} sm={6} md={3}><Tile label="Pending payouts" value={data.pendingPayouts} /></Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Tile label="Last offer push" value={push ? formatDateTime(push.at) : 'None'} caption={push ? <StatusPill status={push.status} /> : undefined} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Tile label="Last reconciliation" value={recon ? recon.date : 'None'} caption={recon ? <StatusPill status={recon.status} /> : undefined} />
                </Grid>
              </Grid>
              <Typography variant="h6">Verticals</Typography>
              <SimpleTable columns={verticalColumns} rows={data.verticals} rowKey="key" ariaLabel="Verticals" />
              <Typography variant="h6">Decisions today</Typography>
              <Grid container spacing={2}>
                {OUTCOMES.map(([key, label]) => (
                  <Grid item xs={6} md={3} key={key}><Tile label={label} value={data.decisionsToday[key]} /></Grid>
                ))}
              </Grid>
              <Typography variant="h6">Decide servers</Typography>
              <SimpleTable columns={serverColumns} rows={data.servers} rowKey="name" ariaLabel="Decide servers" />
            </>
          )}
        </AsyncState>
      </Stack>
    </Box>
  );
}
