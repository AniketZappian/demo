import { Box, FormControlLabel, FormHelperText, Switch } from '@mui/material';

export default function HubctlOnlyFlag({ label, checked }) {
  return (
    <Box>
      <FormControlLabel control={<Switch checked={!!checked} disabled />} label={label} />
      <FormHelperText sx={{ mt: -0.5, ml: 0 }}>stays in hubctl (Decision 5)</FormHelperText>
    </Box>
  );
}
