// Helpers for the config draft form: turn the form value into `proposed` (router.json keys) and back.

export const KINDS = [
  { value: 'gate', label: 'Gate', help: 'A number from 0 to 1, for example 0.03.' },
  { value: 'blocked_states', label: 'Blocked states', help: 'Two-letter codes, comma separated, for example WV, NV. Leave a code out to unblock it.' },
  { value: 'jev_wording', label: 'Jev wording', help: 'The full instruction text for the vertical named in Target.' },
  { value: 'question_set', label: 'Question set', help: 'The new description for the set named in Target.' },
];

export function targetHelp(kind) {
  if (kind === 'gate') return 'The gate is global.';
  if (kind === 'blocked_states') return 'global, or a vertical such as debt.';
  if (kind === 'jev_wording') return 'A vertical such as debt or payday.';
  if (kind === 'question_set') return 'A set id such as standard.';
  return 'What the change applies to.';
}

export function buildProposed(kind, value) {
  const text = String(value ?? '').trim();
  if (kind === 'gate') return { confidence_gate: text === '' ? null : Number(text) };
  if (kind === 'blocked_states') {
    return { blocked_states: text.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) };
  }
  if (kind === 'jev_wording') return { instructions: text };
  if (kind === 'question_set') return { description: text };
  return {};
}

export function valueFromProposed(kind, proposed) {
  const p = proposed ?? {};
  if (kind === 'gate') return p.confidence_gate == null ? '' : String(p.confidence_gate);
  if (kind === 'blocked_states') return (p.blocked_states ?? []).join(', ');
  if (kind === 'jev_wording') return p.instructions ?? '';
  if (kind === 'question_set') return p.description ?? '';
  return '';
}
