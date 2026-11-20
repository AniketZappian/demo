import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme/theme';
import { RoleProvider } from './rmx/RoleContext';
import { ROLES } from './rmx/roles';
import { NAV, RMX_TABS } from './routes';
import { getScreen } from './screens';
import Layout from './layout/Layout';
import NotInDemo from './layout/NotInDemo';
import RmxSection from './layout/RmxSection';

export function AppProviders({ children, initialRole }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RoleProvider initialRole={initialRole}>{children}</RoleProvider>
    </ThemeProvider>
  );
}

function NotBuilt() {
  return (
    <Box p={3}>
      <Alert severity="info">This screen is not built yet.</Alert>
    </Box>
  );
}

function ScreenOrPlaceholder({ screenKey }) {
  const Screen = getScreen(screenKey);
  return Screen ? <Screen /> : <NotBuilt />;
}

function RmxSlug({ section }) {
  const { slug } = useParams();
  const tabs = RMX_TABS[section];
  const tab = tabs.find((t) => t.slug === slug);
  if (!tab) return <Navigate to={`/redirectmax/${section}/${tabs[0].slug}`} replace />;
  return <ScreenOrPlaceholder screenKey={tab.screen} />;
}

const LEADSCIENCE_ITEMS = NAV.filter((g) => g.name !== 'RedirectMax')
  .flatMap((g) => g.items)
  .filter((item) => item.route !== '/dashboard');

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ScreenOrPlaceholder screenKey="leadscience/DashboardScreen" />} />
        {LEADSCIENCE_ITEMS.map((item) => (
          <Route key={item.route} path={item.route} element={<NotInDemo label={item.name} />} />
        ))}
        {Object.keys(RMX_TABS).map((section) => (
          <Route key={section} path={`/redirectmax/${section}`} element={<RmxSection section={section} />}>
            <Route index element={<Navigate to={RMX_TABS[section][0].slug} replace />} />
            <Route path=":slug" element={<RmxSlug section={section} />} />
          </Route>
        ))}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

// Demo sign-in link: ?as=super-admin (or viewer, operator, approver, config-editor) opens the app as that person.
export function roleFromQuery(search) {
  const as = new URLSearchParams(search).get('as');
  const role = as ? `RMX_${as.toUpperCase().replace(/-/g, '_')}` : null;
  return ROLES.includes(role) ? role : undefined;
}

export default function App() {
  return (
    <AppProviders initialRole={roleFromQuery(window.location.search)}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
}
