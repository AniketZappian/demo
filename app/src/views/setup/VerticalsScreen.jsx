import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import AsyncState from '../../components/AsyncState';
import HubctlOnlyFlag from '../../components/HubctlOnlyFlag';
import PageHeader from '../../components/PageHeader';
import StatusPill from '../../components/StatusPill';
import { formatValue } from '../../rmx/format';
import { R } from '../../rmx/store';
import { useRmxQuery } from '../../rmx/useRmx';

function Field({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}

function VerticalCard({ v }) {
  const live = v.status === 'live';
  const counts = v.offerCounts || {};
  const headingId = `vertical-${v.key}`;
  return (
    <Card component="section" aria-labelledby={headingId}>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" id={headingId}>{v.key}</Typography>
            <StatusPill status={v.status} />
            {!live && <Typography variant="body2" color="text.secondary">Draft: not live</Typography>}
          </Stack>
          <Field label="Jev wording" value={v.instructions} />
          <Field label="Profile intro" value={v.profileIntro} />
          <Field label="Offer source" value={formatValue(v.catalogSource)} />
          <Field label="Websites" value={formatValue(v.websites)} />
          <Field label="Blocked states" value={formatValue(v.blockedStates?.length ? v.blockedStates : null)} />
          {v.mlaRule !== null && v.mlaRule !== undefined && (
            <HubctlOnlyFlag label="MLA rule: unknown military is covered" checked={v.mlaRule} />
          )}
          <Field
            label="Offers"
            value={`${counts.active ?? 0} active, ${counts.paused ?? 0} paused, ${counts.capped ?? 0} capped`}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function VerticalsScreen() {
  const q = useRmxQuery(R.verticals, {});
  return (
    <Box p={3}>
      <Stack spacing={3}>
        <PageHeader title="Verticals" />
        <AsyncState
          loading={q.loading}
          error={q.error}
          isEmpty={!q.data || q.data.length === 0}
          emptyText="No verticals."
          onRetry={q.reload}
        >
          <Stack spacing={2}>
            {(q.data || []).map((v) => <VerticalCard key={v.key} v={v} />)}
            <Typography variant="caption" color="text.secondary">Change via Config changes.</Typography>
          </Stack>
        </AsyncState>
      </Stack>
    </Box>
  );
}
