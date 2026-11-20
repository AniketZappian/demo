import { useEffect, useState } from 'react';
import { Box, MenuItem, Stack, TextField } from '@mui/material';
import PageHeader from '../../components/PageHeader';
import AsyncState from '../../components/AsyncState';
import SimpleTable from '../../components/SimpleTable';
import StatusPill from '../../components/StatusPill';
import OfferDrawer from './offers/OfferDrawer';
import { R } from '../../rmx/store';
import { useRmxQuery } from '../../rmx/useRmx';
import { formatMoney, formatValue, humanize } from '../../rmx/format';

const capText = (v) => (v === null || v === undefined ? 'No cap' : formatValue(v));

const VERTICALS = ['debt', 'payday'];

const columns = [
  { key: 'offerId', label: 'Offer id' },
  { key: 'name', label: 'Name' },
  { key: 'vertical', label: 'Vertical' },
  { key: 'network', label: 'Network' },
  { key: 'payout', label: 'Payout', render: (o) => `${o.payoutModel} ${formatMoney(o.payoutValue)}` },
  { key: 'dailyCap', label: 'Daily cap', render: (o) => capText(o.dailyCap) },
  { key: 'capRemaining', label: 'Cap remaining', render: (o) => capText(o.capRemaining) },
  { key: 'mode', label: 'Mode', render: (o) => humanize(o.mode) },
  {
    key: 'status',
    label: 'Status',
    render: (o) => (
      <Stack direction="row" spacing={0.5}>
        <StatusPill status={o.operatorStatus} />
        {o.capRemaining === 0 && <StatusPill status="capped" />}
      </Stack>
    ),
  },
];

export default function OffersScreen() {
  const [vertical, setVertical] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const params = vertical ? { vertical } : {};
  const { data, loading, error, reload } = useRmxQuery(R.offers, params);

  const term = search.trim().toLowerCase();
  const rows = data
    ? data.filter((o) => !term || o.offerId.toLowerCase().includes(term) || o.name.toLowerCase().includes(term))
    : [];
  // The drawer follows the latest fetched copy; the last clicked copy covers a filter that hides it.
  const latest = data ? data.find((o) => o.offerId === selectedId) : null;
  useEffect(() => { if (latest) setSelected(latest); }, [latest]);
  const current = latest || selected;

  const open = (o) => { setSelectedId(o.offerId); setSelected(o); };
  const close = () => { setSelectedId(null); setSelected(null); };

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <PageHeader title="Offers" />
        <Stack direction="row" spacing={2}>
          <TextField select size="small" label="Vertical" value={vertical} sx={{ minWidth: 160 }}
            onChange={(e) => setVertical(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {VERTICALS.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
          </TextField>
          <TextField size="small" label="Search" placeholder="Offer id or name" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </Stack>
        <AsyncState loading={loading} error={error} onRetry={reload}
          isEmpty={!!data && rows.length === 0} emptyText="No offers match.">
          {data && <SimpleTable ariaLabel="Offers" columns={columns} rows={rows} rowKey="offerId" onRowClick={open} />}
        </AsyncState>
      </Stack>
      <OfferDrawer offer={selectedId ? current : null} onClose={close} />
    </Box>
  );
}
