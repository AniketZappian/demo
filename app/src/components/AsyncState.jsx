import { Alert, Box, Button, Skeleton } from '@mui/material';

export default function AsyncState({ loading, error, isEmpty, emptyText, onRetry, children }) {
  if (loading) {
    return (
      <Box role="status" aria-label="Loading">
        <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={120} />
      </Box>
    );
  }
  if (error) {
    return (
      <Alert severity="error" action={onRetry && <Button color="inherit" size="small" onClick={onRetry}>Retry</Button>}>
        {typeof error === 'string' ? error : error.message}
      </Alert>
    );
  }
  if (isEmpty) return <Alert severity="info">{emptyText}</Alert>;
  return children;
}
