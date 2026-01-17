import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Menu,
  MenuItem,
  Avatar,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Chat as ChatIcon,
  People as PeopleIcon,
  AccountTree as AccountTreeIcon,
  AddCircle as AddCircleIcon,
  GroupAdd as GroupAddIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useFamily } from '../context/FamilyContext';
import FamilySwitcher from './Layout/FamilySwitcher';

const sidebarWidth = 360;
const collapsedSidebarWidth = 72;

const navigationItems = [
  { path: '/feed', label: 'Chats', icon: <ChatIcon />, badge: null },
  { path: '/families', label: 'Families', icon: <PeopleIcon />, badge: null },
  { path: '/topology', label: 'Topology', icon: <AccountTreeIcon />, badge: null },
  { path: '/post', label: 'Create Post', icon: <AddCircleIcon />, badge: null },
  { path: '/join', label: 'Join Family', icon: <GroupAddIcon />, badge: null },
  { path: '/admin/join-requests', label: 'Join Requests', icon: <AdminPanelSettingsIcon />, badge: null },
  { path: '/profile', label: 'Profile', icon: <PersonIcon />, badge: null },
];

const AppShell = () => {
  const { logout } = useAuth();
  const { activeFamilyName } = useFamily();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const userMenuOpen = Boolean(anchorEl);
  
  // Sidebar collapse state - persist in localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleUserMenuClose();
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const isActiveRoute = (path) => {
    if (path === '/families') {
      return location.pathname === '/' || location.pathname === '/families';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const sidebarContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sidebar Header */}
      <Box
        sx={{
          p: sidebarCollapsed ? 1.5 : 2,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: sidebarCollapsed ? 0 : 2,
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
        }}
      >
        {!sidebarCollapsed && (
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            <PersonIcon />
          </Avatar>
        )}
        {sidebarCollapsed && (
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <PersonIcon fontSize="small" />
          </Avatar>
        )}
        {!sidebarCollapsed && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              Family App
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {activeFamilyName || 'Select a family'}
            </Typography>
          </Box>
        )}
        {!sidebarCollapsed && (
          <IconButton
            onClick={handleUserMenuClick}
            size="small"
            aria-controls={userMenuOpen ? 'account-menu' : undefined}
          >
            <MoreVertIcon />
          </IconButton>
        )}
        {!isMobile && (
          <IconButton
            onClick={handleSidebarToggle}
            size="small"
            sx={{ 
              ml: sidebarCollapsed ? 0 : 'auto',
              position: 'relative',
            }}
            aria-label={sidebarCollapsed ? 'expand sidebar' : 'collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Box>

      {/* Family Switcher */}
      {!sidebarCollapsed && (
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <FamilySwitcher />
        </Box>
      )}

      {/* Navigation List */}
      <Box sx={{ flex: 1, overflow: 'auto', pb: sidebarCollapsed ? 8 : 0 }}>
        <List sx={{ p: 0 }}>
          {navigationItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isActiveRoute(item.path)}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  py: 1.5,
                  px: sidebarCollapsed ? 1.5 : 2,
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    borderLeft: sidebarCollapsed ? 'none' : '3px solid',
                    borderColor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActiveRoute(item.path) ? 'primary.main' : 'text.secondary',
                    minWidth: sidebarCollapsed ? 0 : 40,
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  }}
                >
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                {!sidebarCollapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActiveRoute(item.path) ? 600 : 400,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      
      {/* Toggle button at bottom when collapsed */}
      {!isMobile && sidebarCollapsed && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}
        >
          <IconButton
            onClick={handleSidebarToggle}
            size="small"
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
            aria-label="expand sidebar"
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default', overflow: 'hidden' }}>
      {/* Left Sidebar - WhatsApp style */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: sidebarWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        <Paper
          elevation={0}
          sx={{
            width: sidebarCollapsed ? collapsedSidebarWidth : sidebarWidth,
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            height: '100vh',
            position: 'relative',
            zIndex: 1,
            overflow: 'hidden',
            transition: 'width 0.3s ease',
          }}
        >
          {sidebarContent}
        </Paper>
      )}

      {/* Mobile Menu Button */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 8,
            left: 8,
            zIndex: 1300,
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          <IconButton
            onClick={handleDrawerToggle}
            aria-label="open drawer"
            size="small"
            sx={{ p: 1 }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'auto',
          bgcolor: 'background.default',
          width: { 
            xs: '100%', 
            md: `calc(100% - ${sidebarCollapsed ? collapsedSidebarWidth : sidebarWidth}px)` 
          },
          transition: 'width 0.3s ease',
        }}
      >
        <Outlet />
      </Box>

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
            navigate('/profile');
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
            navigate('/settings');
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
