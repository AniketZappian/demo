import { Box, Stack, Typography } from '@mui/material';
import AsyncState from '../../components/AsyncState';
import PageHeader from '../../components/PageHeader';
import SimpleTable from '../../components/SimpleTable';
import StatusPill from '../../components/StatusPill';
import { formatDateTime, formatPct } from '../../rmx/format';
import { R } from '../../rmx/store';
import { useRmxQuery } from '../../rmx/useRmx';

const SYNC_COLUMNS = [
  { key: 'at', label: 'When', render: (r) => formatDateTime(r.at) },
  { key: 'publisherId', label: 'Website' },
  { key: 'vertical', label: 'Vertical' },
  { key: 'offersReceived', label: 'Received', align: 'right' },
  { key: 'offersChanged', label: 'Changed', align: 'right' },
  { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
  { key: 'note', label: 'Note' },
];

const RECON_COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'ours', label: 'Ours', align: 'right' },
  { key: 'theirs', label: 'Tracker', align: 'right' },
  { key: 'diffPct', label: 'Diff %', align: 'right', render: (r) => formatPct(r.diffPct) },
  { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
];

export default function SyncsScreen() {
  const syncs = useRmxQuery(R.syncs, {});
  const recon = useRmxQuery(R.reconciliation, {});
  return (
    <Box p={3}>
      <Stack spacing={3}>
        <PageHeader title="Syncs and reconciliation" />
        <Stack spacing={1}>
          <Typography variant="h6">Website offer pushes</Typography>
          <AsyncState
            loading={syncs.loading}
            error={syncs.error}
            isEmpty={!syncs.data || syncs.data.length === 0}
            emptyText="No offer pushes yet."
            onRetry={syncs.reload}
          >
            <SimpleTable ariaLabel="Website offer pushes" columns={SYNC_COLUMNS} rows={syncs.data || []} rowKey="id" />
          </AsyncState>
        </Stack>
        <Stack spacing={1}>
          <Typography variant="h6">Daily Tracker check</Typography>
          <AsyncState
            loading={recon.loading}
            error={recon.error}
            isEmpty={!recon.data || recon.data.length === 0}
            emptyText="No reconciliation runs yet."
            onRetry={recon.reload}
          >
            <SimpleTable ariaLabel="Daily Tracker check" columns={RECON_COLUMNS} rows={recon.data || []} rowKey="id" />
          </AsyncState>
        </Stack>
      </Stack>
    </Box>
  );
}
