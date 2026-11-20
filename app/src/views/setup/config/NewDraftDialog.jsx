import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import ActionButton from '../../../components/ActionButton';
import { R } from '../../../rmx/store';
import { useRmxAction } from '../../../rmx/useRmx';
import { KINDS, buildProposed, targetHelp } from './draftForm';

// Mounted only while open, so the form starts from `initial` each time.
export default function NewDraftDialog({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '',
    kind: initial.kind ?? '',
    target: initial.target ?? (initial.kind === 'gate' ? 'global' : ''),
    value: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const { run, running, error } = useRmxAction(R.configSave);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setKind = (e) => {
    const kind = e.target.value;
    setForm((f) => ({ ...f, kind, target: kind === 'gate' && !f.target ? 'global' : f.target }));
  };

  const kind = KINDS.find((k) => k.value === form.kind);

  const save = async () => {
    const errors = {};
    if (!form.title.trim()) errors.title = 'Title is required.';
    if (!form.kind) errors.kind = 'Choose a kind.';
    if (!form.target.trim()) errors.target = 'Enter a target.';
    if (form.kind !== 'blocked_states' && !form.value.trim()) errors.value = 'Enter a value.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    try {
      const draft = await run({
        title: form.title.trim(), kind: form.kind, target: form.target.trim(), proposed: buildProposed(form.kind, form.value),
      });
      onSaved(draft);
    } catch (e) {
      setFieldErrors(e.fields ?? {});
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="new-draft-title">
      <DialogTitle id="new-draft-title">New config draft</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && !Object.keys(fieldErrors).length && <Alert severity="error">{error}</Alert>}
          <TextField label="Title" value={form.title} onChange={set('title')} error={!!fieldErrors.title} helperText={fieldErrors.title} required fullWidth />
          <TextField select label="Kind" value={form.kind} onChange={setKind} error={!!fieldErrors.kind} helperText={fieldErrors.kind} required fullWidth>
            {KINDS.map((k) => <MenuItem key={k.value} value={k.value}>{k.label}</MenuItem>)}
          </TextField>
          <TextField label="Target" value={form.target} onChange={set('target')} error={!!fieldErrors.target} helperText={fieldErrors.target ?? targetHelp(form.kind)} required fullWidth />
          <TextField
            label="Value"
            value={form.value}
            onChange={set('value')}
            error={!!fieldErrors.value}
            helperText={fieldErrors.value ?? kind?.help ?? 'Choose a kind first.'}
            multiline={form.kind === 'jev_wording'}
            minRows={form.kind === 'jev_wording' ? 3 : undefined}
            required={form.kind !== 'blocked_states'}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <ActionButton action="config.draft" variant="contained" onClick={save} disabled={running}>Save draft</ActionButton>
      </DialogActions>
    </Dialog>
  );
}
