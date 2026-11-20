import { useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Snackbar, Stack, TextField, Typography,
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import AsyncState from '../../components/AsyncState';
import SimpleTable from '../../components/SimpleTable';
import StatusPill from '../../components/StatusPill';
import ActionButton from '../../components/ActionButton';
import ReviewApplyDialog from '../../components/ReviewApplyDialog';
import { R } from '../../rmx/store';
import { useRmxQuery, useReviewApply } from '../../rmx/useRmx';
import { useRole } from '../../rmx/RoleContext';
import { formatDateTime } from '../../rmx/format';

const MODELS = ['CPA', 'CPL', 'CPC', 'revshare', 'other'];
const OWN_REASON = 'You proposed this change; another approver must decide it.';
const LABELS = { payoutModel: 'Payout model', payoutValue: 'Payout value' };
const BLANK = { offerId: '', payoutModel: 'CPL', payoutValue: '', note: '' };

const money = (model, value) => `${model} ${Number(value).toFixed(2)}`;

export default function PayoutsScreen() {
  const { email } = useRole();
  const payouts = useRmxQuery(R.payouts, {});
  const offers = useRmxQuery(R.offers, {});
  const [snack, setSnack] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [deciding, setDeciding] = useState(null);

  const onApplied = () => setSnack(true);
  const propose = useReviewApply(R.payoutPropose, {
    onApplied: () => { setForm(BLANK); setSnack(true); },
  });
  const decide = useReviewApply(R.payoutDecide, { onApplied });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valueNum = form.payoutValue === '' ? NaN : Number(form.payoutValue);
  const canSubmit = !!form.offerId && Number.isFinite(valueNum);

  const submit = () => {
    propose.start({ offerId: form.offerId, payoutModel: form.payoutModel, payoutValue: valueNum, note: form.note });
    setFormOpen(false);
  };

  const startDecide = (row, outcome) => {
    setDeciding({ id: row.id, outcome });
    decide.start({ id: row.id, outcome });
  };

  const rows = payouts.data || [];
  const pending = rows.filter((r) => !r.outcome);
  const history = rows.filter((r) => r.outcome);

  const pendingColumns = [
    { key: 'id', label: 'Change' },
    { key: 'offerId', label: 'Offer' },
    { key: 'current', label: 'Current', render: (r) => money(r.currentModel, r.currentValue) },
    { key: 'proposed', label: 'Proposed', render: (r) => money(r.payoutModel, r.payoutValue) },
    { key: 'note', label: 'Note' },
    { key: 'proposedBy', label: 'Proposed by' },
    { key: 'proposedAt', label: 'Proposed at', render: (r) => formatDateTime(r.proposedAt) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => {
        const own = r.proposedBy === email;
        return (
          <Stack direction="row" spacing={1}>
            <ActionButton
              action="payout.decide"
              disabledReason={own ? OWN_REASON : undefined}
              size="small"
              variant="contained"
              onClick={() => startDecide(r, 'approved')}
            >
              Approve
            </ActionButton>
            <ActionButton
              action="payout.decide"
              disabledReason={own ? OWN_REASON : undefined}
              size="small"
              onClick={() => startDecide(r, 'rejected')}
            >
              Reject
            </ActionButton>
          </Stack>
        );
      },
    },
  ];

  const historyColumns = [
    { key: 'id', label: 'Change' },
    { key: 'offerId', label: 'Offer' },
    { key: 'proposed', label: 'Proposed', render: (r) => money(r.payoutModel, r.payoutValue) },
    { key: 'outcome', label: 'Outcome', render: (r) => <StatusPill status={r.outcome} /> },
    { key: 'decidedBy', label: 'Decided by' },
    { key: 'decidedAt', label: 'Decided at', render: (r) => formatDateTime(r.decidedAt) },
  ];

  const rejecting = deciding?.outcome === 'rejected';

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <PageHeader
          title="Payouts"
          subtitle="Phase 2 in the proposal."
          actions={(
            <ActionButton action="payout.propose" variant="contained" onClick={() => setFormOpen(true)}>
              Propose a change
            </ActionButton>
          )}
        />
        <AsyncState
          loading={payouts.loading}
          error={payouts.error}
          isEmpty={rows.length === 0}
          emptyText="No payout proposals."
          onRetry={payouts.reload}
        >
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography variant="h6">Pending</Typography>
              <SimpleTable columns={pendingColumns} rows={pending} rowKey="id" ariaLabel="Pending" />
            </Stack>
            <Stack spacing={1}>
              <Typography variant="h6">History</Typography>
              <SimpleTable columns={historyColumns} rows={history} rowKey="id" ariaLabel="History" />
            </Stack>
          </Stack>
        </AsyncState>
      </Stack>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Propose a payout change</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Offer" value={form.offerId} onChange={set('offerId')} size="small">
              {(offers.data || []).map((o) => (
                <MenuItem key={o.offerId} value={o.offerId}>{o.offerId} {o.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Model" value={form.payoutModel} onChange={set('payoutModel')} size="small">
              {MODELS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
            <TextField label="Value" type="number" value={form.payoutValue} onChange={set('payoutValue')} size="small" />
            <TextField label="Note" value={form.note} onChange={set('note')} size="small" multiline />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={!canSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>

      <ReviewApplyDialog
        {...propose.dialogProps}
        title="Review payout proposal"
        labels={LABELS}
        applyLabel="Apply"
      />
      <ReviewApplyDialog
        {...decide.dialogProps}
        title={rejecting ? 'Review rejection' : 'Review approval'}
        labels={LABELS}
        focusCancel={rejecting}
        applyLabel="Apply"
      />
      <Snackbar open={snack} autoHideDuration={4000} onClose={() => setSnack(false)} message="Applied." />
    </Box>
  );
}
