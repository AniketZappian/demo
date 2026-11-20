import { useState } from 'react';
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import PageHeader from '../../components/PageHeader';
import AsyncState from '../../components/AsyncState';
import SimpleTable from '../../components/SimpleTable';
import StatusPill from '../../components/StatusPill';
import ActionButton from '../../components/ActionButton';
import { R } from '../../rmx/store';
import { useRmxQuery, useRmxAction } from '../../rmx/useRmx';
import { formatDateTime, formatValue } from '../../rmx/format';

const BLANK = { name: '', instructions: '', leadDescription: '', catalogSource: '', websites: [], blockedStates: '' };

const statusLabel = (s) => {
  if (s.status === 'done') return 'Done';
  if (s.status === 'waiting') return `Waiting on ${s.waitingOn}`;
  return 'Not started';
};

const parseStates = (text) => text.split(',').map((s) => s.trim()).filter(Boolean);

export default function NewVerticalScreen() {
  const checklist = useRmxQuery(R.checklist, { vertical: 'payday' });
  const drafts = useRmxQuery(R.verticalDrafts, {});
  const publishers = useRmxQuery(R.publishers, {});
  const save = useRmxAction(R.verticalDraftSave);
  const [form, setForm] = useState(BLANK);
  const [fields, setFields] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const sources = publishers.data || [];

  const submit = async () => {
    setFields({});
    try {
      await save.run({ ...form, blockedStates: parseStates(form.blockedStates) });
      setForm(BLANK);
    } catch (e) {
      setFields(e.fields || {});
    }
  };

  const steps = checklist.data?.steps || [];
  const draftRows = drafts.data || [];

  const stepColumns = [
    { key: 'label', label: 'Step' },
    { key: 'doneWhen', label: 'Done when' },
    { key: 'owner', label: 'Owner' },
    { key: 'status', label: 'Status', render: (s) => <StatusPill status={s.status} label={statusLabel(s)} /> },
  ];
  const draftColumns = [
    { key: 'name', label: 'Name' },
    { key: 'catalogSource', label: 'Offer source', render: (d) => d.catalogSource || 'None' },
    { key: 'websites', label: 'Websites', render: (d) => formatValue(d.websites.length ? d.websites : null) },
    { key: 'blockedStates', label: 'Blocked states', render: (d) => formatValue(d.blockedStates.length ? d.blockedStates : null) },
    { key: 'status', label: 'Status', render: (d) => <StatusPill status={d.status} /> },
    { key: 'createdBy', label: 'Created by' },
    { key: 'createdAt', label: 'Created at', render: (d) => formatDateTime(d.createdAt) },
  ];

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <PageHeader title="New vertical" />
        <Stack spacing={1}>
          <Typography variant="h6">Checklist (payday)</Typography>
          <AsyncState
            loading={checklist.loading}
            error={checklist.error}
            isEmpty={steps.length === 0}
            emptyText="No checklist steps."
            onRetry={checklist.reload}
          >
            <SimpleTable columns={stepColumns} rows={steps} rowKey="key" ariaLabel="Checklist" />
          </AsyncState>
          <Typography variant="caption" color="text.secondary">
            The checklist covers existing rule kinds only. A new kind of rule needs a developer and a migration.
          </Typography>
        </Stack>

        <Stack spacing={2}>
          <Typography variant="h6">Start a new vertical</Typography>
          {publishers.error && (
            <Alert severity="error" action={<Button color="inherit" size="small" onClick={publishers.reload}>Retry</Button>}>
              {publishers.error}
            </Alert>
          )}
          {save.error && Object.keys(fields).length === 0 && <Alert severity="error">{save.error}</Alert>}
          <TextField
            label="Name"
            size="small"
            value={form.name}
            onChange={set('name')}
            error={!!fields.name}
            helperText={fields.name}
          />
          <TextField label="Jev wording" size="small" multiline value={form.instructions} onChange={set('instructions')} />
          <TextField label="Lead description" size="small" multiline value={form.leadDescription} onChange={set('leadDescription')} />
          <TextField select label="Offer source" size="small" value={form.catalogSource} onChange={set('catalogSource')}>
            {sources.map((p) => <MenuItem key={p.publisherId} value={p.publisherId}>{p.name}</MenuItem>)}
          </TextField>
          <TextField
            select
            label="Websites"
            size="small"
            value={form.websites}
            onChange={set('websites')}
            SelectProps={{ multiple: true }}
          >
            {sources.map((p) => <MenuItem key={p.publisherId} value={p.publisherId}>{p.name}</MenuItem>)}
          </TextField>
          <TextField
            label="Blocked states"
            size="small"
            value={form.blockedStates}
            onChange={set('blockedStates')}
            error={!!fields.blockedStates}
            helperText={fields.blockedStates || 'Comma separated, two upper-case letters each.'}
          />
          <Box>
            <ActionButton action="config.draft" variant="contained" onClick={submit} disabled={save.running}>
              Save draft
            </ActionButton>
          </Box>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="h6">Saved drafts</Typography>
          <AsyncState
            loading={drafts.loading}
            error={drafts.error}
            isEmpty={draftRows.length === 0}
            emptyText="No drafts yet."
            onRetry={drafts.reload}
          >
            <SimpleTable columns={draftColumns} rows={draftRows} rowKey="id" ariaLabel="Saved drafts" />
          </AsyncState>
        </Stack>
      </Stack>
    </Box>
  );
}
