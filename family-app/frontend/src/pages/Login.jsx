import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stack,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated (only after loading is complete)
  useEffect(() => {
    if (isLoading) return; // Wait for auth state to be determined
    
    if (isAuthenticated) {
      // Check if user is superadmin
      const checkSuperadmin = async () => {
        try {
          const { getHealth } = await import('../services/admin');
          await getHealth();
          navigate('/superadmin');
        } catch (err) {
          navigate('/app/families');
        }
      };
      checkSuperadmin();
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      // Check if user is superadmin by trying to access health endpoint
      try {
        const { getHealth } = await import('../services/admin');
        await getHealth();
        navigate('/superadmin');
      } catch (err) {
        navigate('/app/families');
      }
    } else {
      setError(result.error || 'Login failed');
    }
  };

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, width: '100%', borderRadius: 4 }}>
          <Stack spacing={1} alignItems="center" sx={{ mb: 3 }}>
            <Chip label="Family Network" color="primary" />
            <Typography variant="h4" component="h1">
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Sign in to your private family space.
            </Typography>
          </Stack>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link to="/register" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Button variant="text" size="small">
                    Register
                  </Button>
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
