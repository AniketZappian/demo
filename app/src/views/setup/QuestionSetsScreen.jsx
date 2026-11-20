import { Box, Chip, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import AsyncState from '../../components/AsyncState';
import SimpleTable from '../../components/SimpleTable';
import ActionButton from '../../components/ActionButton';
import { R } from '../../rmx/store';
import { useRmxQuery } from '../../rmx/useRmx';

function Fact({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );
}

export default function QuestionSetsScreen() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useRmxQuery(R.questionSets, {});

  const draft = (setId) => navigate(
    `/redirectmax/setup/config?kind=question_set&target=${encodeURIComponent(setId)}`,
  );

  const columns = [
    { key: 'id', label: 'Set' },
    { key: 'description', label: 'Description' },
    {
      key: 'fields',
      label: 'Fields',
      render: (r) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {r.fields.map((f) => <Chip key={f} size="small" label={f} />)}
        </Stack>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <ActionButton action="config.draft" size="small" variant="outlined" onClick={() => draft(r.id)}>
          Draft a change
        </ActionButton>
      ),
    },
  ];

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <PageHeader title="Question sets" />
        <AsyncState loading={loading} error={error} onRetry={reload}
          isEmpty={!!data && data.sets.length === 0} emptyText="No question sets.">
          {data && (
            <Stack spacing={3}>
              <Stack direction="row" spacing={4}>
                <Fact label="Form id" value={data.formId} />
                <Fact label="Decide after step" value={data.decideAfterStep} />
                <Fact label="Default set" value={data.defaultSet} />
                <Fact label="Holdout" value={`${data.holdoutPercent}%`} />
              </Stack>
              <SimpleTable ariaLabel="Question sets" columns={columns} rows={data.sets} rowKey="id" />
              <Typography variant="caption" color="text.secondary">Counsel reviews changes.</Typography>
            </Stack>
          )}
        </AsyncState>
      </Stack>
    </Box>
  );
}
