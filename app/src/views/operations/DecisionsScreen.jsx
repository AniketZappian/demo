import { Fragment, useState } from 'react';
import {
  Box, Collapse, FormControl, IconButton, InputLabel, List, ListItem, MenuItem, Paper, Select, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Chip,
} from '@mui/material';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';
import PageHeader from '../../components/PageHeader';
import AsyncState from '../../components/AsyncState';
import SimpleTable from '../../components/SimpleTable';
import StatusPill from '../../components/StatusPill';
import { useRmxQuery } from '../../rmx/useRmx';
import { R } from '../../rmx/store';
import { formatDateTime, formatValue, humanize } from '../../rmx/format';

const OUTCOMES = ['clicked', 'no_redirect', 'pending', 'bounced'];

function failedRulesByOffer(list) {
  const byOffer = {};
  list.forEach((d) => (d.failedRules || []).forEach((f) => {
    const entry = byOffer[f.offerId] || { offerId: f.offerId, times: 0, rules: {} };
    entry.times += 1;
    f.rules.forEach((r) => { entry.rules[r] = (entry.rules[r] || 0) + 1; });
    byOffer[f.offerId] = entry;
  }));
  return Object.values(byOffer).sort((a, b) => b.times - a.times || a.offerId.localeCompare(b.offerId));
}

function DecisionRow({ d, open, onToggle }) {
  return (
    <Fragment>
      <TableRow>
        <TableCell>
          <IconButton size="small" aria-label={`${open ? 'Collapse' : 'Expand'} ${d.decisionId}`} aria-expanded={open} onClick={onToggle}>
            {open ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell>{formatDateTime(d.decidedAt)}</TableCell>
        <TableCell>{d.vertical}</TableCell>
        <TableCell>{d.publisherId}</TableCell>
        <TableCell>{d.offerId ?? 'None (generic wall)'}</TableCell>
        <TableCell>{humanize(d.basis)}</TableCell>
        <TableCell>{formatValue(!!d.gated)}</TableCell>
        <TableCell>{formatValue(d.confidence)}</TableCell>
        <TableCell><StatusPill status={d.outcome} /></TableCell>
        <TableCell>{d.conversionStatus ? <StatusPill status={d.conversionStatus} /> : 'None'}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={10} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
          <Collapse in={open} unmountOnExit>
            <Box role="region" aria-label={`Failed rules for ${d.decisionId}`} sx={{ py: 1 }}>
              {(d.failedRules || []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">No offers failed a rule.</Typography>
              ) : (
                <List dense disablePadding>
                  {d.failedRules.map((f) => (
                    <ListItem key={f.offerId} disableGutters>
                      <Typography variant="body2" sx={{ mr: 2, minWidth: 64 }}>{f.offerId}</Typography>
                      <Stack direction="row" spacing={1}>
                        {f.rules.map((r) => <Chip key={r} size="small" label={r} />)}
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

export default function DecisionsScreen() {
  const [outcome, setOutcome] = useState('');
  const [offerId, setOfferId] = useState('');
  const [expanded, setExpanded] = useState({});
  const params = {};
  if (outcome) params.outcome = outcome;
  if (offerId) params.offerId = offerId;
  const { data, loading, error, reload } = useRmxQuery(R.decisions, params);
  const offers = useRmxQuery(R.offers, {});
  const list = data || [];
  const summary = failedRulesByOffer(list);
  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <PageHeader title="Decisions" subtitle="No lead refs, visit ids, answers or sub-IDs are shown." />
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="dec-outcome-label">Outcome</InputLabel>
            <Select labelId="dec-outcome-label" label="Outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {OUTCOMES.map((o) => <MenuItem key={o} value={o}>{humanize(o)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="dec-offer-label">Offer</InputLabel>
            <Select labelId="dec-offer-label" label="Offer" value={offerId} onChange={(e) => setOfferId(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {(offers.data || []).map((o) => <MenuItem key={o.offerId} value={o.offerId}>{o.offerId}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
        <AsyncState loading={loading} error={error} isEmpty={list.length === 0} emptyText="No decisions today." onRetry={reload}>
          <Stack spacing={3}>
            <Typography variant="h6">Failed rules by offer</Typography>
            <SimpleTable
              ariaLabel="Failed rules by offer"
              rowKey="offerId"
              rows={summary}
              columns={[
                { key: 'offerId', label: 'Offer' },
                { key: 'times', label: 'Times not eligible', align: 'right' },
                {
                  key: 'rules',
                  label: 'Rules',
                  render: (r) => (
                    <Stack direction="row" spacing={1}>
                      {Object.entries(r.rules).map(([rule, n]) => <Chip key={rule} size="small" label={`${rule} x${n}`} />)}
                    </Stack>
                  ),
                },
              ]}
            />
            <Typography variant="h6">Decisions</Typography>
            <TableContainer component={Paper}>
              <Table size="small" aria-label="Decisions">
                <TableHead>
                  <TableRow>
                    {['', 'Decided at', 'Vertical', 'Website', 'Offer', 'Basis', 'Gated', 'Confidence', 'Outcome', 'Conversion']
                      .map((h, i) => <TableCell key={h || i}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((d) => (
                    <DecisionRow key={d.decisionId} d={d} open={!!expanded[d.decisionId]} onToggle={() => toggle(d.decisionId)} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </AsyncState>
      </Stack>
    </Box>
  );
}
