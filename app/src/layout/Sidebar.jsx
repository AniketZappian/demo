import { Fragment, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Badge from '@mui/material/Badge';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { colors, layout } from '../theme/tokens';
import { NAV, RMX_NAV } from '../routes';
import { useRole } from '../rmx/RoleContext';
import { R } from '../rmx/store';
import { useRmxQuery } from '../rmx/useRmx';

function isActive(pathname, route) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

const itemSx = (active, extra = {}) => ({
  height: layout.navItemHeight,
  borderRadius: `${layout.navItemRadius}px`,
  m: '0 5px 5px',
  width: 'calc(100% - 10px)',
  ...(active ? { bgcolor: colors.navActive, color: colors.white } : {}),
  '&:hover': active ? { bgcolor: colors.navActiveHover } : undefined,
  ...(active ? { '&.Mui-focusVisible': { bgcolor: colors.navActive } } : {}),
  ...extra,
});

function NavIcon({ icon, active }) {
  const Icon = icon;
  return (
    <ListItemIcon
      className="sideNavIcon"
      sx={{ minWidth: layout.navIconMinWidth, filter: active ? 'invert(1)' : 'invert(0)' }}
    >
      <Icon sx={{ fontSize: layout.navIconSize }} />
    </ListItemIcon>
  );
}

// Number of changes waiting for a reviewer. Mounted only for roles that can review.
function ReviewCount() {
  const { data } = useRmxQuery(R.reviewQueue, {});
  const n = data ? data.configDrafts.length + data.payouts.length : 0;
  return <Badge badgeContent={n} color="error" sx={{ mr: 1 }} aria-label={`${n} waiting for review`} />;
}

function NavLink({ item, pathname, nested = false }) {
  const active = isActive(pathname, item.route);
  return (
    <ListItem disablePadding className="sideMenuItem">
      <ListItemButton
        component={Link}
        to={item.route}
        data-tour-route={item.route}
        aria-current={active ? 'page' : undefined}
        className={`sideNavButton${active ? ' active' : ''}`}
        sx={itemSx(active, nested ? { pl: 3, width: 'calc(100% - 10px)' } : {})}
      >
        <NavIcon icon={item.icon} active={active} />
        <ListItemText primary={item.name} className="sideMenuItem" />
        {item.badge === 'review' ? <ReviewCount /> : null}
      </ListItemButton>
    </ListItem>
  );
}

// Top-level RedirectMax button. Open by default on /redirectmax routes; a click toggles it.
function RmxGroup({ pathname }) {
  const { can } = useRole();
  const items = RMX_NAV.items.filter((item) => !item.requires || can(item.requires));
  const onRmx = isActive(pathname, RMX_NAV.route);
  const [open, setOpen] = useState(onRmx);
  useEffect(() => {
    if (onRmx) setOpen(true);
  }, [onRmx]);
  return (
    <Box component="li" sx={{ listStyle: 'none' }}>
      <List disablePadding>
        <ListItem disablePadding className="sideMenuItem">
          <ListItemButton
            data-tour-route={RMX_NAV.route}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={`sideNavButton${onRmx ? ' active' : ''}`}
            sx={itemSx(onRmx)}
          >
            <NavIcon icon={RMX_NAV.icon} active={onRmx} />
            <ListItemText primary={RMX_NAV.name} className="sideMenuItem" />
            {open ? <ExpandLess sx={{ fontSize: layout.navIconSize }} /> : <ExpandMore sx={{ fontSize: layout.navIconSize }} />}
          </ListItemButton>
        </ListItem>
        <Collapse in={open} timeout={0} unmountOnExit>
          <List disablePadding>
            {items.map((item) => (
              <NavLink key={item.route} item={item} pathname={pathname} nested />
            ))}
          </List>
        </Collapse>
      </List>
    </Box>
  );
}

export default function Sidebar() {
  const { pathname } = useLocation();
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: layout.drawerWidth,
        flexShrink: 0,
        zIndex: 1,
        '& .MuiDrawer-paper': { width: layout.drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <Box component="nav" aria-label="Main navigation" sx={{ overflow: 'auto' }} className="sideNavBox">
        <List className="sideNav">
          {NAV.map((group, index) => (
            <Fragment key={group.name || 'top'}>
            <Box component="li" sx={{ listStyle: 'none' }}>
              {group.name ? (
                <Typography
                  sx={{ mt: 0.5, ml: 2 }}
                  color="text.secondary"
                  display="block"
                  variant="caption"
                >
                  {group.name}
                </Typography>
              ) : null}
              <List disablePadding>
                {group.items.map((item) => (
                  <NavLink key={item.route} item={item} pathname={pathname} />
                ))}
              </List>
            </Box>
            {index === 0 ? <RmxGroup pathname={pathname} /> : null}
            </Fragment>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
