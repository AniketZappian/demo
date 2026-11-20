import { useState } from 'react';
import {
  Box, Chip, FormControl, FormControlLabel, FormHelperText, InputLabel, MenuItem, OutlinedInput, Select, Snackbar,
  Stack, Switch, TextField, Typography,
} from '@mui/material';
import ActionButton from '../../../components/ActionButton';
import HubctlOnlyFlag from '../../../components/HubctlOnlyFlag';
import ReviewApplyDialog from '../../../components/ReviewApplyDialog';
import { R } from '../../../rmx/store';
import { useReviewApply } from '../../../rmx/useRmx';

const CATEGORIES = ['debt_relief', 'consolidation', 'credit_repair', 'short_term'];
const EMPLOYMENT = ['employed', 'self_employed', 'unemployed', 'retired'];
const FREQUENCY = ['weekly', 'biweekly', 'semimonthly', 'monthly'];
const LABELS = {
  ruleCategory: 'Rule category', excludedStates: 'Excluded states', minDebt: 'Min debt', allowedEmployment: 'Allowed employment',
  pConv: 'pConv', isNew: 'Is new', evergreen: 'Evergreen', minLoanAmount: 'Min loan amount', maxLoanAmount: 'Max loan amount',
  allowedPayFrequency: 'Allowed pay frequency', minMonthlyIncome: 'Min monthly income',
};
const DEBT_KEYS = ['ruleCategory', 'excludedStates', 'minDebt', 'allowedEmployment', 'pConv', 'isNew', 'evergreen'];
const PAYDAY_KEYS = ['minLoanAmount', 'maxLoanAmount', 'allowedPayFrequency', 'minMonthlyIncome'];

const toForm = (rules) => ({
  ...rules,
  excludedStates: (rules.excludedStates || []).join(', '),
  allowedEmployment: rules.allowedEmployment || [],
  allowedPayFrequency: rules.allowedPayFrequency || [],
  pConv: rules.pConv === null || rules.pConv === undefined ? '' : String(rules.pConv),
  minDebt: String(rules.minDebt ?? ''),
  minLoanAmount: String(rules.minLoanAmount ?? ''),
  maxLoanAmount: String(rules.maxLoanAmount ?? ''),
  minMonthlyIncome: String(rules.minMonthlyIncome ?? ''),
});

const num = (s) => (String(s).trim() === '' ? 0 : Number(s));

function fromForm(key, f) {
  switch (key) {
    case 'excludedStates': return f.excludedStates.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    case 'allowedEmployment': return f.allowedEmployment.length ? f.allowedEmployment : null;
    case 'allowedPayFrequency': return f.allowedPayFrequency.length ? f.allowedPayFrequency : null;
    case 'pConv': return String(f.pConv).trim() === '' ? null : Number(f.pConv);
    case 'minDebt': case 'minLoanAmount': case 'maxLoanAmount': case 'minMonthlyIncome': return num(f[key]);
    default: return f[key];
  }
}

function changedRules(offer, form) {
  const keys = offer.vertical === 'payday' ? PAYDAY_KEYS : DEBT_KEYS;
  const out = {};
  keys.forEach((k) => {
    const next = fromForm(k, form);
    if (JSON.stringify(next) !== JSON.stringify(offer.rules[k])) out[k] = next;
  });
  return out;
}

const isNum = (s) => String(s).trim() === '' || Number.isFinite(Number(s));

function validate(offer, f) {
  const e = {};
  const money = (k) => { if (!isNum(f[k]) || num(f[k]) < 0) e[k] = 'Enter a number, 0 or more.'; };
  if (offer.vertical === 'payday') {
    ['minLoanAmount', 'maxLoanAmount', 'minMonthlyIncome'].forEach(money);
  } else {
    money('minDebt');
    const bad = f.excludedStates.split(',').map((x) => x.trim()).filter(Boolean).filter((x) => !/^[A-Za-z]{2}$/.test(x));
    if (bad.length) e.excludedStates = `Use two-letter state codes: ${bad.join(', ')}`;
    const p = String(f.pConv).trim();
    if (p !== '' && (!isNum(p) || Number(p) < 0 || Number(p) > 1)) e.pConv = 'Enter a number from 0 to 1, or leave empty.';
  }
  return e;
}

function MultiSelect({ label, value, options, onChange, helper }) {
  const all = [...new Set([...options, ...value])];
  return (
    <FormControl size="small" fullWidth>
      <InputLabel id={`${label}-label`}>{label}</InputLabel>
      <Select
        labelId={`${label}-label`} multiple value={value} label={label} onChange={(e) => onChange(e.target.value)}
        input={<OutlinedInput label={label} />}
        renderValue={(sel) => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>{sel.map((v) => <Chip key={v} size="small" label={v} />)}</Box>
        )}
      >
        {all.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
      </Select>
      {helper && <FormHelperText>{helper}</FormHelperText>}
    </FormControl>
  );
}

export default function OfferRulesTab({ offer }) {
  const [form, setForm] = useState(() => toForm(offer.rules));
  const [synced, setSynced] = useState(JSON.stringify(offer.rules));
  const [applied, setApplied] = useState(false);
  const { start, dialogProps } = useReviewApply(R.offerRules, { onApplied: () => setApplied(true) });

  const rulesJson = JSON.stringify(offer.rules);
  if (rulesJson !== synced) {
    setSynced(rulesJson);
    setForm(toForm(offer.rules));
  }

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const errors = validate(offer, form);
  const text = (k, label, extra = {}) => (
    <TextField
      size="small" label={label} value={form[k]} onChange={(e) => set(k)(e.target.value)} {...extra}
      error={!!errors[k]} helperText={errors[k] || extra.helperText}
    />
  );
  const changed = changedRules(offer, form);
  const review = () => start({ offerId: offer.offerId, rules: changed });
  const isPayday = offer.vertical === 'payday';

  return (
    <Stack spacing={2} sx={{ pt: 2 }}>
      <Typography variant="h6">{isPayday ? 'Payday rules (draft)' : 'Debt rules'}</Typography>
      {isPayday ? (
        <>
          {text('minLoanAmount', 'Minimum loan amount', { type: 'number' })}
          {text('maxLoanAmount', 'Maximum loan amount', { type: 'number' })}
          <MultiSelect
            label="Allowed pay frequency" value={form.allowedPayFrequency} options={FREQUENCY} onChange={set('allowedPayFrequency')}
            helper="Assumed until the Swift form fixes it"
          />
          {text('minMonthlyIncome', 'Minimum monthly income', { type: 'number' })}
          <HubctlOnlyFlag label="MLA compliant" checked={offer.rules.mlaCompliant} />
        </>
      ) : (
        <>
          <FormControl size="small" fullWidth>
            <InputLabel id="rule-category-label">Rule category</InputLabel>
            <Select labelId="rule-category-label" label="Rule category" value={form.ruleCategory} onChange={(e) => set('ruleCategory')(e.target.value)}>
              {[...new Set([...CATEGORIES, form.ruleCategory])].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          {text('excludedStates', 'Excluded states', { helperText: 'Comma separated, two letters each' })}
          {text('minDebt', 'Minimum debt', { type: 'number' })}
          <MultiSelect
            label="Allowed employment" value={form.allowedEmployment} options={EMPLOYMENT} onChange={set('allowedEmployment')}
            helper="Empty means any"
          />
          {text('pConv', 'pConv', { type: 'number', helperText: '0 to 1, empty means unknown', inputProps: { step: 'any' } })}
          <Stack direction="row" spacing={2}>
            <FormControlLabel control={<Switch checked={!!form.isNew} onChange={(e) => set('isNew')(e.target.checked)} />} label="Is new" />
            <FormControlLabel control={<Switch checked={!!form.evergreen} onChange={(e) => set('evergreen')(e.target.checked)} />} label="Evergreen" />
          </Stack>
        </>
      )}
      <Box>
        <ActionButton
          action="offer.rules" variant="contained" onClick={review}
          disabledReason={Object.keys(changed).length ? null : 'No changes to review.'}
        >
          Review changes
        </ActionButton>
      </Box>
      <ReviewApplyDialog {...dialogProps} title={`Review rule changes for ${offer.offerId}`} labels={LABELS} />
      <Snackbar open={applied} autoHideDuration={4000} onClose={() => setApplied(false)} message="Applied." />
    </Stack>
  );
}
