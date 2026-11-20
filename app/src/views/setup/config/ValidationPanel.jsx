import { Alert, Stack } from '@mui/material';
import DiffLines from './DiffLines';

export default function ValidationPanel({ validation }) {
  if (!validation) return null;
  const { errors, warnings, diff } = validation;
  return (
    <Stack spacing={1} aria-label="Validation result" role="group">
      {errors.map((e) => <Alert key={e} severity="error">{e}</Alert>)}
      {warnings.map((w) => <Alert key={w} severity="warning">{w}</Alert>)}
      {errors.length === 0 && <Alert severity="success">Validation passed.</Alert>}
      <DiffLines lines={diff} ariaLabel="Validation diff" />
    </Stack>
  );
}
