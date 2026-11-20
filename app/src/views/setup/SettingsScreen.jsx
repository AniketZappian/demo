import { Box, Stack, Typography } from '@mui/material';
import AsyncState from '../../components/AsyncState';
import PageHeader from '../../components/PageHeader';
import SimpleTable from '../../components/SimpleTable';
import StatusPill from '../../components/StatusPill';
import { R } from '../../rmx/store';
import { useRmxQuery } from '../../rmx/useRmx';

const COLUMNS = [
  { key: 'key', label: 'Switch' },
  { key: 'source', label: 'Source' },
  { key: 'on', label: 'State', render: (s) => <StatusPill status={s.on ? 'on' : 'off'} /> },
];

export default function SettingsScreen() {
  const { data, loading, error, reload } = useRmxQuery(R.settings, {});
  return (
    <Box p={3}>
      <Stack spacing={3}>
        <PageHeader title="Settings" subtitle="ops.json and environment switches, read-only." />
        <AsyncState loading={loading} error={error} onRetry={reload} isEmpty={!!data && data.length === 0} emptyText="No switches.">
          {data && (
            <>
              <SimpleTable columns={COLUMNS} rows={data} rowKey="key" ariaLabel="Settings" />
              <Typography variant="caption" color="text.secondary">On/off only. Values are never shown.</Typography>
            </>
          )}
        </AsyncState>
      </Stack>
    </Box>
  );
}
