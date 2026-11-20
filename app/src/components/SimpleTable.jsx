import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

export default function SimpleTable({ columns, rows, rowKey, onRowClick, ariaLabel }) {
  const keyOf = (r, i) => (typeof rowKey === 'function' ? rowKey(r) : r[rowKey] ?? i);
  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label={ariaLabel}>
        <TableHead>
          <TableRow>
            {columns.map((c) => <TableCell key={c.key} align={c.align}>{c.label}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow
              key={keyOf(r, i)}
              hover={!!onRowClick}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              sx={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map((c) => (
                <TableCell key={c.key} align={c.align}>{c.render ? c.render(r) : r[c.key]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
