import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Table, TableBody, TableCell, TableHead,
  TableRow, Typography,
} from '@mui/material';
import { colors } from '../theme/tokens';
import { formatValue, humanize } from '../rmx/format';

export default function ReviewApplyDialog({
  open, title, loading, error, before, after, labels = {}, applying, onApply, onCancel, focusCancel, applyLabel = 'Apply',
}) {
  const b = before || {};
  const a = after || {};
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])];
  const same = (k) => JSON.stringify(b[k]) === JSON.stringify(a[k]);
  return (
    <Dialog open={!!open} onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>Preview (dry run): nothing has changed yet.</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box role="status" aria-label="Loading"><Typography variant="body2">Loading preview...</Typography></Box>
        ) : (
          <Table size="small" aria-label="Changes">
            <TableHead>
              <TableRow>
                <TableCell>Field</TableCell>
                <TableCell>Before</TableCell>
                <TableCell>After</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k} sx={same(k) ? undefined : { backgroundColor: colors.changedRowBg }}>
                  <TableCell>{labels[k] ?? humanize(k)}</TableCell>
                  <TableCell>{formatValue(b[k])}</TableCell>
                  <TableCell>{formatValue(a[k])}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} autoFocus={!!focusCancel}>Cancel</Button>
        <Button variant="contained" onClick={onApply} disabled={!!(loading || error || applying)}>
          {applying ? 'Applying...' : applyLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
