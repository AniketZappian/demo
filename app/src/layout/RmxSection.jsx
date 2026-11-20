import { Link, Outlet, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { RMX_TABS } from '../routes';

const TAB_LABELS = { operations: 'Operations tabs', setup: 'Setup tabs', review: 'Review tabs' };

// `section` is a key of RMX_TABS. Tabs only; each screen draws its own PageHeader.
export default function RmxSection({ section }) {
  const tabs = RMX_TABS[section] || [];
  const base = `/redirectmax/${section}`;
  const { pathname } = useLocation();
  const current = tabs.find((t) => pathname === `${base}/${t.slug}`);
  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 1 }}>
        <Tabs
          value={current ? current.slug : false}
          variant="scrollable"
          scrollButtons="auto"
          aria-label={TAB_LABELS[section] ?? 'Tabs'}
        >
          {tabs.map((t) => (
            <Tab key={t.slug} value={t.slug} label={t.label} component={Link} to={`${base}/${t.slug}`} />
          ))}
        </Tabs>
      </Box>
      <Outlet />
    </Box>
  );
}
