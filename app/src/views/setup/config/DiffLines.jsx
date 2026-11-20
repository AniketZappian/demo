import { Box } from '@mui/material';
import { colors, fonts } from '../../../theme/tokens';

function tint(line) {
  if (line.startsWith('+ ')) return colors.diffAddBg;
  if (line.startsWith('- ')) return colors.diffRemoveBg;
  return undefined;
}

export default function DiffLines({ lines, ariaLabel = 'Diff' }) {
  if (!lines || lines.length === 0) return null;
  return (
    <Box role="group" aria-label={ariaLabel} sx={{ fontFamily: fonts.mono, fontSize: 13, borderRadius: 1, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      {lines.map((line, i) => (
        <Box key={`${i}-${line}`} data-diff={line.startsWith('+ ') ? 'add' : line.startsWith('- ') ? 'remove' : 'context'} sx={{ px: 1.5, py: 0.25, whiteSpace: 'pre-wrap', wordBreak: 'break-word', bgcolor: tint(line) }}>
          {line}
        </Box>
      ))}
    </Box>
  );
}
