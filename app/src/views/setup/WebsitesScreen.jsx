import { Box, Stack, Typography } from '@mui/material';
import AsyncState from '../../components/AsyncState';
import CodeBlock from '../../components/CodeBlock';
import PageHeader from '../../components/PageHeader';
import SimpleTable from '../../components/SimpleTable';
import StatusPill from '../../components/StatusPill';
import { formatDateTime, formatValue } from '../../rmx/format';
import { R } from '../../rmx/store';
import { useRmxQuery } from '../../rmx/useRmx';

const COLUMNS = [
  { key: 'publisherId', label: 'Website' },
  { key: 'verticals', label: 'Verticals', render: (p) => formatValue(p.verticals) },
  {
    key: 'hasKey',
    label: 'Key',
    render: (p) => <StatusPill status={p.hasKey ? 'has_key' : 'no_key'} label={p.hasKey ? 'Has key' : 'No key'} />,
  },
  { key: 'keyCreatedAt', label: 'Key created', render: (p) => (p.keyCreatedAt ? formatDateTime(p.keyCreatedAt) : 'None') },
];

export default function WebsitesScreen() {
  const { data, loading, error, reload } = useRmxQuery(R.publishers, {});
  return (
    <Box p={3}>
      <Stack spacing={3}>
        <PageHeader title="Websites" subtitle="Which websites have keys and which verticals they sit in." />
        <AsyncState loading={loading} error={error} onRetry={reload} isEmpty={!!data && data.length === 0} emptyText="No websites.">
          {data && (
            <>
              <SimpleTable columns={COLUMNS} rows={data} rowKey="publisherId" ariaLabel="Websites" />
              <CodeBlock text="hubctl publisher-add --help" ariaLabel="hubctl command" />
              <Typography variant="caption" color="text.secondary">
                Keys are created in hubctl and shown once there, never here.
              </Typography>
            </>
          )}
        </AsyncState>
      </Stack>
    </Box>
  );
}
