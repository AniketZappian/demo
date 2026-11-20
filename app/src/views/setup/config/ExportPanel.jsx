import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CodeBlock from '../../../components/CodeBlock';
import DiffLines from './DiffLines';

export default function ExportPanel({ result }) {
  return (
    <Stack spacing={1.5} aria-label="Pull request text" role="group">
      <Typography variant="subtitle2">PR title</Typography>
      <CodeBlock text={result.prTitle} ariaLabel="PR title" />
      <Typography variant="subtitle2">PR description</Typography>
      <CodeBlock text={result.prBody} ariaLabel="PR description" />
      <Typography variant="subtitle2">{result.fileName ? `Diff for ${result.fileName}` : 'Diff'}</Typography>
      <DiffLines lines={result.diff} ariaLabel="Pull request diff" />
      {result.fileText && (
      <Accordion disableGutters variant="outlined">
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2">New file text ({result.fileName})</Typography>
        </AccordionSummary>
      <AccordionDetails>
          <CodeBlock text={result.fileText} ariaLabel="New file text" />
        </AccordionDetails>
      </Accordion>
      )}
    </Stack>
  );
}
