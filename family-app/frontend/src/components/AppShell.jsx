import { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  Avatar,
  Typography,
  Button,
  Container,
  Stack,
} from '@mui/material';
import {
  Chat as ChatIcon,
  People as PeopleIcon,
  AccountTree as AccountTreeIcon,
  GroupAdd as GroupAddIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useFamily } from '../context/FamilyContext';
import FamilySwitcher from './Layout/FamilySwitcher';

const navigationItems = [
  { path: '/app/feed', label: 'Chats', icon: <ChatIcon />, badge: null },
  { path: '/app/families', label: 'Families', icon: <PeopleIcon />, badge: null },
  { path: '/app/topology', label: 'Topology', icon: <AccountTreeIcon />, badge: null },
  { path: '/app/join', label: 'Join Family', icon: <GroupAddIcon />, badge: null },
  { path: '/app/admin/join-requests', label: 'Join Requests', icon: <AdminPanelSettingsIcon />, badge: null },
  { path: '/app/profile', label: 'Profile', icon: <PersonIcon />, badge: null },
];

const AppShell = () => {
  const { logout } = useAuth();
  const { activeFamilyName } = useFamily();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const userMenuOpen = Boolean(anchorEl);
  const isFeedRoute = location.pathname.startsWith('/app/feed');

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleUserMenuClose();
  };

  const handleUserMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const isActiveRoute = (path) => {
    // Treat /app and /app/families as the "Families" tab
    if (path === '/app/families') {
      return (
        location.pathname === '/app' ||
        location.pathname === '/app/' ||
        location.pathname === '/app/families' ||
        location.pathname.startsWith('/app/families/')
      );
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky">
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 36,
                height: 36,
                color: 'primary.contrastText',
              }}
            >
              {getInitials(activeFamilyName || 'Family')}
            </Avatar>
            <Box>
              <Typography variant="h6">Family Network</Typography>
              <Typography variant="caption" color="text.secondary">
                {activeFamilyName || 'Select a family'}
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ flex: 1, minWidth: 240 }}>
            <FamilySwitcher />
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                variant={isActiveRoute(item.path) ? 'contained' : 'outlined'}
                color={isActiveRoute(item.path) ? 'primary' : 'inherit'}
                startIcon={item.icon}
                sx={{
                  borderRadius: 999,
                  bgcolor: isActiveRoute(item.path) ? 'primary.main' : 'rgba(255,255,255,0.6)',
                }}
              >
                {item.label}
              </Button>
            ))}
            <IconButton
              onClick={handleUserMenuClick}
              size="small"
              aria-controls={userMenuOpen ? 'account-menu' : undefined}
            >
              <MoreVertIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="lg"
        sx={{
          py: isFeedRoute ? 0 : 4,
          height: isFeedRoute ? 'calc(100vh - 80px)' : 'auto',
          display: isFeedRoute ? 'flex' : 'block',
          flexDirection: isFeedRoute ? 'column' : 'initial',
        }}
      >
        <Outlet />
      </Container>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={userMenuOpen}
        onClose={handleUserMenuClose}
        onClick={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => {
            navigate('/app/profile');
            handleUserMenuClose();
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate('/app/settings');
            handleUserMenuClose();
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AppShell;
