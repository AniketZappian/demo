import { Chip } from '@mui/material';
import { humanize } from '../rmx/format';

const GROUPS = {
  success: ['active', 'live', 'ok', 'done', 'approved', 'clicked', 'confirmed', 'on', 'yes', 'has_key', 'merged'],
  warning: ['paused', 'pending', 'waiting', 'draft', 'validated'],
  error: ['failed', 'alert', 'rejected', 'bounced', 'reversed', 'no'],
  info: ['exported', 'pr_open'],
};

function colorFor(status) {
  const key = String(status ?? '').toLowerCase();
  for (const [color, list] of Object.entries(GROUPS)) if (list.includes(key)) return color;
  return 'default';
}

const LABELS = { pr_open: 'PR open' };

export default function StatusPill({ status, label }) {
  return <Chip size="small" color={colorFor(status)} label={label ?? LABELS[status] ?? humanize(status)} />;
}
