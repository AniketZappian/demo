import { useState } from 'react';
import { Alert, Box, Stack, Typography } from '@mui/material';
import ActionButton from '../../components/ActionButton';
import AsyncState from '../../components/AsyncState';
import PageHeader from '../../components/PageHeader';
import SimpleTable from '../../components/SimpleTable';
import { formatDateTime, humanize } from '../../rmx/format';
import { useRole } from '../../rmx/RoleContext';
import { R } from '../../rmx/store';
import { useRmxAction, useRmxQuery } from '../../rmx/useRmx';
import DraftDetail from '../setup/config/DraftDetail';

const money = (model, value) => `${model} ${Number(value).toFixed(2)}`;

// One place for a reviewer (Approver or Super admin): config drafts to approve, payouts to decide,
// and pull requests waiting on the tech lead.
export default function ReviewQueueScreen() {
  const { email, can } = useRole();
  const { data, loading, error, reload } = useRmxQuery(R.reviewQueue, {});
  const decide = useRmxAction(R.payoutDecide);
  const merge = useRmxAction(R.configMerge);
  const [selectedId, setSelectedId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const run = (p) => { setActionError(null); p.catch((e) => setActionError(e.message)); };
  const decidePayout = (id, outcome) => run(decide.run({ id, outcome }));
  const busy = decide.running || merge.running;

  const draftColumns = [
    { key: 'title', label: 'Change' },
    { key: 'kind', label: 'Kind', render: (d) => humanize(d.kind) },
    { key: 'target', label: 'Target' },
    { key: 'createdBy', label: 'Drafted by' },
    { key: 'createdAt', label: 'Drafted at', render: (d) => formatDateTime(d.createdAt) },
  ];
  const payoutColumns = [
    { key: 'offerId', label: 'Offer' },
    { key: 'current', label: 'Current', render: (p) => money(p.currentModel, p.currentValue) },
    { key: 'proposed', label: 'Proposed', render: (p) => money(p.payoutModel, p.payoutValue) },
    { key: 'note', label: 'Note' },
    { key: 'proposedBy', label: 'Proposed by' },
    {
      key: 'actions',
      label: 'Decision',
      render: (p) => {
        const own = p.proposedBy === email ? 'You proposed this change; another approver must decide it.' : undefined;
        return (
          <Stack direction="row" spacing={1}>
            <ActionButton action="payout.decide" disabledReason={own} size="small" variant="contained" disabled={busy}
              onClick={() => decidePayout(p.id, 'approved')}>Approve</ActionButton>
            <ActionButton action="payout.decide" disabledReason={own} size="small" variant="outlined" color="error" disabled={busy}
              onClick={() => decidePayout(p.id, 'rejected')}>Reject</ActionButton>
          </Stack>
        );
      },
    },
  ];
  const prColumns = [
    { key: 'prNumber', label: 'Pull request', render: (d) => `#${d.prNumber}` },
    { key: 'title', label: 'Change' },
    { key: 'approvedBy', label: 'Approved by' },
    { key: 'counselRef', label: 'Counsel reference', render: (d) => d.counselRef ?? 'None' },
    { key: 'waiting', label: 'Waiting on', render: () => 'The tech lead, in GitHub' },
    {
      key: 'actions',
      label: '',
      render: (d) => (
        <ActionButton size="small" variant="outlined" disabled={busy} onClick={() => run(merge.run({ id: d.id }))}>
          Demo: simulate merge
        </ActionButton>
      ),
    },
  ];

  const selected = data ? data.configDrafts.find((d) => d.id === selectedId) : null;

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <PageHeader
          title="Review queue"
          subtitle="Changes waiting for a second person. Approving a config change opens its pull request for the tech lead automatically."
        />
        {!can('review.view') && (
          <Alert severity="info">Only an Approver or a Super admin can act here. You can look.</Alert>
        )}
        {actionError && <Alert severity="error">{actionError}</Alert>}
        <AsyncState loading={loading} error={error} onRetry={reload}>
          {data && (
            <>
              <Stack spacing={1} component="section" aria-label="Config changes to approve">
                <Typography variant="h6" component="h2">Config changes to approve ({data.configDrafts.length})</Typography>
                {data.configDrafts.length ? (
                  <SimpleTable columns={draftColumns} rows={data.configDrafts} rowKey="id" onRowClick={(d) => setSelectedId(d.id)} ariaLabel="Config changes to approve" />
                ) : (
                  <Typography variant="body2" color="text.secondary">Nothing waiting.</Typography>
                )}
                {selected && <DraftDetail key={selected.id} draft={selected} />}
                {!selected && data.configDrafts.length > 0 && (
                  <Typography variant="body2" color="text.secondary">Select a change to see its diff and approve or reject it.</Typography>
                )}
              </Stack>

              <Stack spacing={1} component="section" aria-label="Payouts to decide">
                <Typography variant="h6" component="h2">Payouts to decide ({data.payouts.length})</Typography>
                {data.payouts.length ? (
                  <SimpleTable columns={payoutColumns} rows={data.payouts} rowKey="id" ariaLabel="Payouts to decide" />
                ) : (
                  <Typography variant="body2" color="text.secondary">Nothing waiting.</Typography>
                )}
              </Stack>

              <Stack spacing={1} component="section" aria-label="Pull requests waiting on the tech lead">
                <Typography variant="h6" component="h2">Pull requests waiting on the tech lead ({data.pullRequests.length})</Typography>
                {data.pullRequests.length ? (
                  <SimpleTable columns={prColumns} rows={data.pullRequests} rowKey="id" ariaLabel="Pull requests waiting" />
                ) : (
                  <Typography variant="body2" color="text.secondary">No open pull requests.</Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  The console opens pull requests but can never merge them. In the real product the tech lead merges in GitHub;
                  &quot;Demo: simulate merge&quot; stands in for that and the deploy.
                </Typography>
              </Stack>
            </>
          )}
        </AsyncState>
      </Stack>
    </Box>
  );
}
