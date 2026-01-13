import { Outlet, useNavigate, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import FamilySwitcher from './Layout/FamilySwitcher';

const AppShell = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Family App
          </Typography>
          <FamilySwitcher />
          <Button color="inherit" component={Link} to="/families">
            Families
          </Button>
          <Button color="inherit" component={Link} to="/feed">
            Feed
          </Button>
          <Button color="inherit" component={Link} to="/topology">
            Topology
          </Button>
          <Button color="inherit" component={Link} to="/post">
            Post
          </Button>
          <Button color="inherit" component={Link} to="/join">
            Join Family
          </Button>
          <Button color="inherit" component={Link} to="/admin/join-requests">
            Join Requests
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default AppShell;
