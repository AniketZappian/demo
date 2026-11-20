import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Snackbar, Stack, Typography } from '@mui/material';
import ActionButton from '../../components/ActionButton';
import AsyncState from '../../components/AsyncState';
import PageHeader from '../../components/PageHeader';
import SimpleTable from '../../components/SimpleTable';
import StatusPill from '../../components/StatusPill';
import { humanize } from '../../rmx/format';
import { R } from '../../rmx/store';
import { useRmxQuery } from '../../rmx/useRmx';
import DraftDetail from './config/DraftDetail';
import NewDraftDialog from './config/NewDraftDialog';

const COLUMNS = [
  { key: 'title', label: 'Title' },
  { key: 'kind', label: 'Kind', render: (d) => humanize(d.kind) },
  { key: 'target', label: 'Target' },
  { key: 'status', label: 'Status', render: (d) => <StatusPill status={d.status} /> },
  { key: 'createdBy', label: 'Created by' },
];

export default function ConfigChangesScreen() {
  const [params, setParams] = useSearchParams();
  const prefill = { kind: params.get('kind') || undefined, target: params.get('target') || undefined };
  const [dialogOpen, setDialogOpen] = useState(() => !!(prefill.kind || prefill.target));
  const [selectedId, setSelectedId] = useState(null);
  const [saved, setSaved] = useState(false);
  const { data, loading, error, reload } = useRmxQuery(R.configDrafts, {});

  const openNew = () => setDialogOpen(true);
  const closeDialog = () => {
    setDialogOpen(false);
    if (params.has('kind') || params.has('target')) setParams({}, { replace: true });
  };
  const onSaved = (draft) => {
    setSelectedId(draft.id);
    setSaved(true);
    closeDialog();
  };

  const selected = data ? data.find((d) => d.id === selectedId) : null;

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <PageHeader
          title="Config changes"
          subtitle="Gate, blocked states and Jev wording. Draft, validate, approve: approval opens the pull request automatically."
          actions={<ActionButton action="config.draft" variant="contained" onClick={openNew}>New draft</ActionButton>}
        />
        <AsyncState loading={loading} error={error} onRetry={reload} isEmpty={!!data && data.length === 0} emptyText="No drafts yet.">
          {data && (
            <>
              <Stack spacing={1}>
                <Typography variant="h6" component="h2">Drafts</Typography>
                <SimpleTable columns={COLUMNS} rows={data} rowKey="id" onRowClick={(d) => setSelectedId(d.id)} ariaLabel="Config drafts" />
              </Stack>
              {selected ? (
                <DraftDetail key={selected.id} draft={selected} />
              ) : (
                <Typography variant="body2" color="text.secondary">Select a draft to see its steps.</Typography>
              )}
            </>
          )}
        </AsyncState>
        <Typography variant="caption" color="text.secondary">
          The console opens the pull request; only the tech lead can merge it in GitHub. Merging in this demo is simulated.
        </Typography>
      </Stack>
      {dialogOpen && <NewDraftDialog initial={prefill} onClose={closeDialog} onSaved={onSaved} />}
      <Snackbar open={saved} autoHideDuration={4000} onClose={() => setSaved(false)} message="Draft saved." />
    </Box>
  );
}
