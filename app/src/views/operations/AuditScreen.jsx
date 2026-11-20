import { useState } from 'react';
import { Box, MenuItem, Stack, TextField } from '@mui/material';
import PageHeader from '../../components/PageHeader';
import AsyncState from '../../components/AsyncState';
import SimpleTable from '../../components/SimpleTable';
import { R } from '../../rmx/store';
import { useRmxQuery } from '../../rmx/useRmx';
import { formatDateTime, formatValue, humanize } from '../../rmx/format';

const ACTIONS = ['catalog_set', 'payout_proposed', 'payout_approved', 'payout_rejected'];

const diffLines = (obj) => {
  const entries = Object.entries(obj || {});
  if (!entries.length) return '';
  return entries.map(([k, v]) => <div key={k}>{`${k}: ${formatValue(v)}`}</div>);
};

const columns = [
  { key: 'at', label: 'When', render: (r) => formatDateTime(r.at) },
  { key: 'actor', label: 'Actor' },
  { key: 'offerId', label: 'Offer' },
  { key: 'action', label: 'Action', render: (r) => humanize(r.action) },
  { key: 'before', label: 'Before', render: (r) => diffLines(r.before) },
  { key: 'after', label: 'After', render: (r) => diffLines(r.after) },
];

export default function AuditScreen() {
  const [action, setAction] = useState('');
  const [offerId, setOfferId] = useState('');
  const params = {};
  if (action) params.action = action;
  if (offerId.trim()) params.offerId = offerId.trim();
  const { data, loading, error, reload } = useRmxQuery(R.audit, params);

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <PageHeader title="Audit" />
        <Stack direction="row" spacing={2}>
          <TextField select size="small" label="Action" value={action} sx={{ minWidth: 200 }}
            onChange={(e) => setAction(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {ACTIONS.map((a) => <MenuItem key={a} value={a}>{humanize(a)}</MenuItem>)}
          </TextField>
          <TextField size="small" label="Offer id" value={offerId} onChange={(e) => setOfferId(e.target.value)} />
        </Stack>
        <AsyncState loading={loading} error={error} onRetry={reload}
          isEmpty={!!data && data.length === 0} emptyText="No audit rows.">
          {data && <SimpleTable ariaLabel="Audit log" columns={columns} rows={data} rowKey="id" />}
        </AsyncState>
      </Stack>
    </Box>
  );
}
