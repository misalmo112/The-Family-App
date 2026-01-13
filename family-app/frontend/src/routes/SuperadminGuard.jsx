import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Container, CircularProgress } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { getHealth } from '../services/admin';

const NotAuthorized = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <LockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Not Authorized
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You do not have permission to access this section.
        </Typography>
      </Box>
    </Container>
  );
};

const SuperadminGuard = ({ children }) => {
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      setIsChecking(true);
      try {
        await getHealth();
        setIsAuthorized(true);
      } catch (error) {
        if (error.response?.status === 403) {
          setIsAuthorized(false);
        } else {
          // For other errors (network, 401, etc.), also deny access
          setIsAuthorized(false);
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthorization();
  }, [location.pathname]);

  if (isChecking) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthorized) {
    return <NotAuthorized />;
  }

  return children;
};

export default SuperadminGuard;
