import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { useDemoMode } from '../rmx/demoMode';
import { colors } from '../theme/tokens';

const MODE_LABELS = { normal: 'Normal', slow: 'Slow', empty: 'Empty', error: 'Error' };

export default function DemoBanner() {
  const [mode, setMode] = useDemoMode();
  return (
    <Box
      role="region"
      aria-label="Demo banner"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2,
        py: 1,
        mb: 2,
        bgcolor: colors.demoBanner,
        color: colors.demoBannerText,
      }}
    >
      <Typography variant="body2" sx={{ flexGrow: 1, color: 'inherit' }}>
        <Box component="span" sx={{ fontWeight: 'bold' }}>
          Demo: sample data
        </Box>
        . Nothing here talks to RedirectMax or lds-api.
      </Typography>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel id="demo-mode-label" sx={{ color: 'inherit' }}>
          Data mode
        </InputLabel>
        <Select
          labelId="demo-mode-label"
          label="Data mode"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          sx={{ color: 'inherit', bgcolor: colors.white }}
        >
          {Object.entries(MODE_LABELS).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
