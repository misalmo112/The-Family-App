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
  MenuItem,
  CircularProgress,
  Stack,
  Chip,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/auth';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated (only after loading is complete)
  useEffect(() => {
    if (isLoading) return; // Wait for auth state to be determined
    
    if (isAuthenticated) {
      navigate('/app/families');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Client-side validation
    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await register(username, email, password, passwordConfirm, firstName, lastName, dob, gender);
      
      // Auto-login after successful registration
      const loginResult = await login(username, password);
      
      if (loginResult.success) {
        // Check if user is superadmin
        try {
          const { getHealth } = await import('../services/admin');
          await getHealth();
          navigate('/superadmin');
        } catch (err) {
          navigate('/app/families');
        }
      } else {
        // Registration succeeded but login failed - redirect to login page
        navigate('/login');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = 
        err.response?.data?.email?.[0] ||
        err.response?.data?.username?.[0] ||
        err.response?.data?.password?.[0] ||
        err.response?.data?.password_confirm?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
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
            <Chip label="Create account" color="primary" />
            <Typography variant="h4" component="h1">
              Join Family Network
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Your profile will be reused across families.
            </Typography>
          </Stack>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
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
              autoComplete="username"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              variant="outlined"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
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
              autoComplete="new-password"
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
            />
            <TextField
              fullWidth
              label="First Name"
              variant="outlined"
              margin="normal"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={loading}
              autoComplete="given-name"
            />
            <TextField
              fullWidth
              label="Last Name"
              variant="outlined"
              margin="normal"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={loading}
              autoComplete="family-name"
            />
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              variant="outlined"
              margin="normal"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={loading}
            />
            <TextField
              fullWidth
              select
              label="Gender"
              variant="outlined"
              margin="normal"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="">Not specified</MenuItem>
              <MenuItem value="MALE">Male</MenuItem>
              <MenuItem value="FEMALE">Female</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
              <MenuItem value="UNKNOWN">Prefer not to say</MenuItem>
            </TextField>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link to="/login" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Button variant="text" size="small">
                    Login
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

export default Register;
