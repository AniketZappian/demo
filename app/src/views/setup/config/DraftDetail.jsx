import { useState } from 'react';
import { Alert, Box, Card, CardContent, Step, StepLabel, Stepper, Stack, TextField, Typography } from '@mui/material';
import ActionButton from '../../../components/ActionButton';
import StatusPill from '../../../components/StatusPill';
import { useRole } from '../../../rmx/RoleContext';
import { R } from '../../../rmx/store';
import { useRmxAction } from '../../../rmx/useRmx';
import { formatDateTime, humanize } from '../../../rmx/format';
import { fonts } from '../../../theme/tokens';
import ExportPanel from './ExportPanel';
import ValidationPanel from './ValidationPanel';

const STEPS = ['Draft', 'Validate', 'Approve', 'Pull request', 'Merged and live'];
const ACTIVE_STEP = { draft: 1, validated: 2, rejected: 2, pr_open: 4, merged: 5 };

// Render with key={draft.id} so local state resets when another draft is selected.
// Used by Config changes and by the Review queue.
export default function DraftDetail({ draft }) {
  const { email, can } = useRole();
  const validate = useRmxAction(R.configValidate);
  const approve = useRmxAction(R.configApprove);
  const reject = useRmxAction(R.configReject);
  const merge = useRmxAction(R.configMerge);
  const [counselRef, setCounselRef] = useState('');
  const [reason, setReason] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [actionError, setActionError] = useState(null);
  const [opened, setOpened] = useState(null);

  const fail = (e) => {
    setFieldErrors(e.fields ?? {});
    setActionError(e.fields ? null : e.message);
  };
  const clear = () => { setFieldErrors({}); setActionError(null); };

  const doValidate = () => { clear(); validate.run({ id: draft.id }).catch(fail); };
  const doApprove = () => { clear(); approve.run({ id: draft.id, counselRef: counselRef.trim() }).then(setOpened, fail); };
  const doReject = () => { clear(); reject.run({ id: draft.id, reason: reason.trim() }).catch(fail); };
  const doMerge = () => { clear(); merge.run({ id: draft.id }).catch(fail); };

  const canRevalidate = draft.status === 'draft' || draft.status === 'validated';
  const validateReason = !can('config.draft') || canRevalidate ? undefined : 'Only a draft that is not yet approved can be validated.';
  let reviewReason;
  if (can('config.approve')) {
    if (draft.status !== 'validated') reviewReason = draft.status === 'draft' ? 'Validate the draft first.' : 'Already reviewed.';
    else if (draft.createdBy === email) reviewReason = 'You drafted this change; another approver must review it.';
  }
  const needsCounsel = draft.kind === 'blocked_states' || draft.kind === 'question_set';
  const isPr = draft.status === 'pr_open' || draft.status === 'merged';
  const prResult = isPr && draft.prBody ? { ...draft, ...(opened ?? {}) } : null;
  const busy = validate.running || approve.running || reject.running || merge.running;
  const reviewing = draft.status === 'validated' && can('config.approve');

  return (
    <Card component="section" aria-label="Draft detail">
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" component="h2">{draft.title}</Typography>
            <StatusPill status={draft.status} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {humanize(draft.kind)} on {draft.target}. Drafted by {draft.createdBy} at {formatDateTime(draft.createdAt)}.
          </Typography>
          <Box component="pre" aria-label="Proposed value" sx={{ m: 0, fontFamily: fonts.mono, fontSize: 13, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(draft.proposed)}
          </Box>

          <Stepper activeStep={ACTIVE_STEP[draft.status] ?? 0} alternativeLabel>
            {STEPS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>

          {actionError && <Alert severity="error">{actionError}</Alert>}

          {draft.status === 'pr_open' && (
            <Alert
              severity="info"
              action={(
                <ActionButton size="small" variant="outlined" color="inherit" onClick={doMerge} disabled={busy}>
                  Demo: simulate merge
                </ActionButton>
              )}
            >
              Pull request #{draft.prNumber} opened automatically on approval. Waiting on the tech lead to review and
              merge it in GitHub. Nothing is live yet.
            </Alert>
          )}
          {draft.status === 'merged' && (
            <Alert severity="success">
              Merged and live. Both decide servers report config version {draft.configVersion}.
            </Alert>
          )}
          {draft.status === 'rejected' && (
            <Alert severity="warning">
              Rejected by {draft.rejectedBy} at {formatDateTime(draft.rejectedAt)}: {draft.rejectReason} Start a new draft with the fix.
            </Alert>
          )}

          <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="wrap" useFlexGap>
            <ActionButton action="config.draft" disabledReason={validateReason} variant="outlined" onClick={doValidate} disabled={busy}>Validate</ActionButton>
            <ActionButton action="config.approve" disabledReason={reviewReason} variant="contained" onClick={doApprove} disabled={busy}>Approve and open PR</ActionButton>
            <ActionButton action="config.reject" disabledReason={reviewReason} variant="outlined" color="error" onClick={doReject} disabled={busy}>Reject</ActionButton>
          </Stack>

          {reviewing && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Counsel reference"
                size="small"
                value={counselRef}
                onChange={(e) => setCounselRef(e.target.value)}
                error={!!fieldErrors.counselRef}
                helperText={fieldErrors.counselRef ?? (needsCounsel ? 'Required for this kind of change.' : 'Optional for this kind of change.')}
                sx={{ maxWidth: 360, flex: 1 }}
              />
              <TextField
                label="Reason, if rejecting"
                size="small"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                error={!!fieldErrors.reason}
                helperText={fieldErrors.reason ?? 'Shown to the person who drafted it.'}
                sx={{ maxWidth: 360, flex: 1 }}
              />
            </Stack>
          )}

          {draft.approvedBy && (
            <Typography variant="body2">
              Approved by {draft.approvedBy} at {formatDateTime(draft.approvedAt)}.
              {' '}Counsel reference: {draft.counselRef ?? 'none'}
            </Typography>
          )}

          {!prResult && <ValidationPanel validation={draft.validation} />}
          {prResult && <ExportPanel result={prResult} />}
        </Stack>
      </CardContent>
    </Card>
  );
}
