import { Box, Button } from '@mui/material';
import { colors, fonts } from '../theme/tokens';

export default function CodeBlock({ text, ariaLabel }) {
  const copy = () => navigator.clipboard?.writeText(text);
  return (
    <Box sx={{ position: 'relative', bgcolor: colors.codeBg, borderRadius: 1, p: 1.5, pr: 9 }}>
      <Box component="pre" aria-label={ariaLabel} sx={{ m: 0, fontFamily: fonts.mono, fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {text}
      </Box>
      <Button size="small" onClick={copy} sx={{ position: 'absolute', top: 6, right: 6 }}>Copy</Button>
    </Box>
  );
}
