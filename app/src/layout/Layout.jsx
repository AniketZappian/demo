import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AccountCircle from '@mui/icons-material/AccountCircle';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { colors } from '../theme/tokens';
import Sidebar from './Sidebar';
import RoleSwitcher from './RoleSwitcher';
import DemoBanner from './DemoBanner';
import './layout.css';

export default function Layout() {
  const [anchorEl, setAnchorEl] = useState(null);
  const close = () => setAnchorEl(null);

  return (
    <Box sx={{ display: 'flex' }} className="layout">
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: colors.topBar,
          zIndex: 2,
          '& .MuiToolbar-root': { minHeight: '50px' },
        }}
      >
        <Toolbar className="topToolbar">
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" sx={{ color: colors.white }}>
              LeadScience
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RoleSwitcher />
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={close}
            >
              <MenuItem onClick={close}>Profile</MenuItem>
              <MenuItem onClick={close}>My account</MenuItem>
              <MenuItem onClick={close}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Sidebar />
      <Box
        component="main"
        sx={{ flexGrow: 1, pt: 1, pb: 1, minWidth: 0, minHeight: '100vh', background: colors.pageBg }}
      >
        <Box mt={8} ml={1} mr={1}>
          <DemoBanner />
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
