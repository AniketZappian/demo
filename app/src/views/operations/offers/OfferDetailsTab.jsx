import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Snackbar, Stack, TextField, Typography } from '@mui/material';
import ActionButton from '../../../components/ActionButton';
import HubctlOnlyFlag from '../../../components/HubctlOnlyFlag';
import ReviewApplyDialog from '../../../components/ReviewApplyDialog';
import StatusPill from '../../../components/StatusPill';
import { R } from '../../../rmx/store';
import { useReviewApply } from '../../../rmx/useRmx';
import { formatMoney, formatValue, humanize } from '../../../rmx/format';
import { fonts } from '../../../theme/tokens';

const LABELS = { operatorStatus: 'Status', dailyCap: 'Daily cap', dailyBudget: 'Daily budget' };

const toText = (v) => (v === null || v === undefined ? '' : String(v));

function parseNum(text) {
  const t = text.trim();
  if (t === '') return null;
  return /^-?\d+$/.test(t) ? Number(t) : t;
}

function Fact({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}

export default function OfferDetailsTab({ offer }) {
  const [cap, setCap] = useState(toText(offer.dailyCap));
  const [budget, setBudget] = useState(toText(offer.dailyBudget));
  const [applied, setApplied] = useState(false);
  const [pausing, setPausing] = useState(false);
  const { start, dialogProps } = useReviewApply(R.offerCatalog, { onApplied: () => setApplied(true) });

  useEffect(() => {
    setCap(toText(offer.dailyCap));
    setBudget(toText(offer.dailyBudget));
  }, [offer.offerId, offer.dailyCap, offer.dailyBudget]);

  const paused = offer.operatorStatus === 'paused';
  const toggle = () => {
    setPausing(!paused);
    start({ offerId: offer.offerId, operatorStatus: paused ? 'active' : 'paused' });
  };
  const reviewLimits = () => {
    setPausing(false);
    const data = { offerId: offer.offerId };
    const nextCap = parseNum(cap);
    const nextBudget = parseNum(budget);
    if (nextCap !== offer.dailyCap) data.dailyCap = nextCap;
    if (nextBudget !== offer.dailyBudget) data.dailyBudget = nextBudget;
    start(data);
  };

  const unchanged = parseNum(cap) === offer.dailyCap && parseNum(budget) === offer.dailyBudget;

  const w = offer.website || {};
  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Operator</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <StatusPill status={offer.operatorStatus} />
              <ActionButton action="offer.catalog" variant="outlined" onClick={toggle}>
                {paused ? 'Resume' : 'Pause'}
              </ActionButton>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Daily cap" size="small" value={cap} onChange={(e) => setCap(e.target.value)} />
              <TextField label="Daily budget" size="small" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </Stack>
            <Box>
              <ActionButton
                action="offer.catalog"
                variant="contained"
                onClick={reviewLimits}
                disabledReason={unchanged ? 'No changes to review.' : null}
              >
                Review change
              </ActionButton>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1}>
        <Typography variant="h6">Offer</Typography>
        <Fact label="Network" value={offer.network} />
        <Fact label="Mode" value={humanize(offer.mode)} />
        <Fact label="Payout" value={`${offer.payoutModel} ${formatMoney(offer.payoutValue)}`} />
        <Fact label="Vertical" value={offer.vertical} />
        <Fact label="Offer source" value={offer.catalogSource} />
        <Fact label="Rank" value={offer.rank} />
        <HubctlOnlyFlag label="Counsel approved" checked={offer.counselApproved} />
        <Fact label="Counsel reference" value={formatValue(offer.counselRef)} />
        {offer.vertical === 'payday' && <HubctlOnlyFlag label="MLA compliant" checked={offer.rules?.mlaCompliant} />}
      </Stack>

      <Stack spacing={1}>
        <Typography variant="h6">Website fields</Typography>
        <Typography variant="caption" color="text.secondary">Change this on the website.</Typography>
        <Fact label="Backend" value={formatValue(w.backend)} />
        <Fact label="Status" value={formatValue(w.status)} />
        <Fact label="Cap remaining" value={formatValue(offer.capRemaining)} />
        <Fact label="Allowed states" value={formatValue(w.allowedStates?.length ? w.allowedStates : null)} />
        <Fact label="Blocked publishers" value={formatValue(w.blockedPublishers?.length ? w.blockedPublishers : null)} />
        <Fact label="EPC prior" value={formatValue(w.epcPrior)} />
        <Fact label="Fit text" value={formatValue(w.fitText)} />
        <Typography variant="body2" sx={{ fontFamily: fonts.mono, wordBreak: 'break-all' }}>
          <Typography component="span" variant="caption" color="text.secondary" display="block" sx={{ fontFamily: 'inherit' }}>Tracking URL</Typography>
          {formatValue(w.trackingUrl)}
        </Typography>
      </Stack>

      <ReviewApplyDialog
        {...dialogProps}
        title={`Review change: ${offer.name}`}
        labels={LABELS}
        focusCancel={pausing}
      />
      <Snackbar open={applied} autoHideDuration={4000} onClose={() => setApplied(false)} message="Applied." />
    </Stack>
  );
}
