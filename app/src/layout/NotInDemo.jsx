import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// Same frame as the screens. Uses the PageHeader heading style (h4) directly so the
// shell does not depend on the shared components unit.
export default function NotInDemo({ label }) {
  return (
    <Box p={3}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          {label}
        </Typography>
        <Alert severity="info">This LeadScience page is not part of the demo.</Alert>
      </Stack>
    </Box>
  );
}
