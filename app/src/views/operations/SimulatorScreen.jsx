import { useState } from 'react';
import {
  Box, Card, CardContent, FormControlLabel, Grid, MenuItem, Stack, Switch, TextField, Typography,
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import AsyncState from '../../components/AsyncState';
import ActionButton from '../../components/ActionButton';
import SimpleTable from '../../components/SimpleTable';
import StatusPill from '../../components/StatusPill';
import { R } from '../../rmx/store';
import { useRmxAction } from '../../rmx/useRmx';
import { humanize } from '../../rmx/format';

const VERTICALS = [
  { key: 'debt', label: 'debt' },
  { key: 'payday', label: 'payday (draft)' },
];

const EMPLOYMENT = ['employed', 'self_employed'];
const PAY_FREQUENCY = ['weekly', 'biweekly', 'monthly'];

const FIELDS = {
  debt: [
    { key: 'state', label: 'State', type: 'text' },
    { key: 'debtAmount', label: 'Debt amount', type: 'number' },
    { key: 'employmentStatus', label: 'Employment status', type: 'select', options: EMPLOYMENT },
  ],
  payday: [
    { key: 'state', label: 'State', type: 'text' },
    { key: 'loanAmount', label: 'Loan amount', type: 'number' },
    { key: 'payFrequency', label: 'Pay frequency', type: 'select', options: PAY_FREQUENCY },
    { key: 'monthlyIncome', label: 'Monthly income', type: 'number' },
    { key: 'activeMilitary', label: 'Active military', type: 'switch' },
  ],
};

function parseExtra(text) {
  const out = {};
  text.split('\n').forEach((line) => {
    const at = line.indexOf('=');
    if (at < 1) return;
    const key = line.slice(0, at).trim();
    if (key) out[key] = line.slice(at + 1).trim();
  });
  return out;
}

export default function SimulatorScreen() {
  const [vertical, setVertical] = useState('debt');
  const [values, setValues] = useState({});
  const [extra, setExtra] = useState('');
  const [result, setResult] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const { run, running, error: hookError } = useRmxAction(R.simulate);
  const error = dismissed ? null : hookError;

  const setValue = (key, v) => setValues((cur) => ({ ...cur, [key]: v }));

  const onVertical = (v) => {
    setVertical(v);
    setValues({});
    setResult(null);
    setDismissed(true);
  };

  const onRun = async () => {
    const inputs = {};
    FIELDS[vertical].forEach((f) => {
      const v = values[f.key];
      if (f.type === 'switch') { if (v) inputs[f.key] = true; return; }
      if (v === undefined || v === '') return;
      inputs[f.key] = f.type === 'number' ? Number(v) : v;
    });
    Object.assign(inputs, parseExtra(extra));
    setResult(null);
    setDismissed(false);
    try {
      setResult(await run({ vertical, inputs }));
    } catch {
      // the hook exposes the message as `error`
    }
  };

  const columns = [
    { key: 'offerId', label: 'Offer' },
    { key: 'name', label: 'Name' },
    { key: 'qualifies', label: 'Qualifies', render: (r) => <StatusPill status={r.qualifies ? 'yes' : 'no'} label={r.qualifies ? 'Yes' : 'No'} /> },
    { key: 'failedRules', label: 'Failed rules', render: (r) => (r.failedRules.length ? r.failedRules.join(', ') : 'None') },
  ];

  const noResult = !result && !error && !running;
  const noOffers = !!result && result.results.length === 0;

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <PageHeader title="Simulator" subtitle="No Jev call. Nothing is saved. Personal-data keys are refused." />
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField select fullWidth size="small" label="Vertical" value={vertical} onChange={(e) => onVertical(e.target.value)}>
                    {VERTICALS.map((v) => <MenuItem key={v.key} value={v.key}>{v.label}</MenuItem>)}
                  </TextField>
                </Grid>
                {FIELDS[vertical].map((f) => (
                  <Grid item xs={12} sm={6} md={3} key={f.key}>
                    {f.type === 'select' ? (
                      <TextField
                        select fullWidth size="small" label={f.label}
                        value={values[f.key] ?? ''} onChange={(e) => setValue(f.key, e.target.value)}
                        InputLabelProps={{ shrink: true }} SelectProps={{ displayEmpty: true }}
                      >
                        <MenuItem value="">Any</MenuItem>
                        {f.options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                      </TextField>
                    ) : f.type === 'switch' ? (
                      <FormControlLabel
                        label={f.label}
                        control={<Switch checked={!!values[f.key]} onChange={(e) => setValue(f.key, e.target.checked)} />}
                      />
                    ) : (
                      <TextField
                        fullWidth size="small" label={f.label} type={f.type}
                        value={values[f.key] ?? ''} onChange={(e) => setValue(f.key, e.target.value)}
                      />
                    )}
                  </Grid>
                ))}
              </Grid>
              <TextField
                fullWidth multiline minRows={2} size="small" label="Extra inputs"
                helperText="One key=value per line."
                value={extra} onChange={(e) => setExtra(e.target.value)}
              />
              <Box>
                <ActionButton action="simulate" variant="contained" onClick={onRun} disabled={running}>Run</ActionButton>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Stack spacing={1}>
          <Typography variant="h6">Results</Typography>
          {result && <Typography variant="body2" color="text.secondary">{`${humanize(result.vertical)}, confidence gate ${result.gate}`}</Typography>}
          <AsyncState
            loading={running}
            error={error}
            isEmpty={noResult || noOffers}
            emptyText={noOffers ? 'No offers in this vertical.' : 'Enter inputs and run.'}
          >
            {result && <SimpleTable ariaLabel="Simulation results" columns={columns} rows={result.results} rowKey="offerId" />}
          </AsyncState>
        </Stack>
      </Stack>
    </Box>
  );
}
