import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  People as PeopleIcon,
  FamilyRestroom as FamilyRestroomIcon,
  GroupAdd as GroupAddIcon,
  Article as ArticleIcon,
} from '@mui/icons-material';
import { getDashboardStats, getHealthStatus } from '../../services/admin';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both stats and health in parallel
      const [statsData, healthData] = await Promise.all([
        getDashboardStats(30),
        getHealthStatus(),
      ]);
      
      setStats(statsData);
      setHealth(healthData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response.status === 403) {
          setError('You do not have permission to access this page.');
        } else {
          setError(err.response.data?.error || 'Failed to load dashboard data. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchData}>
          Retry
        </Button>
      </Box>
    );
  }

  const isHealthy = health?.status === 'ok' && health?.db === 'ok';

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Superadmin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        System overview and statistics
      </Typography>

      <Grid container spacing={3}>
        {/* API/DB Status Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6" component="h2">
                  System Status
                </Typography>
                {isHealthy ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <ErrorIcon color="error" />
                )}
              </Box>
              <Box sx={{ mt: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    API Status:
                  </Typography>
                  <Chip
                    label={health?.status === 'ok' ? 'OK' : 'Error'}
                    color={health?.status === 'ok' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Database Status:
                  </Typography>
                  <Chip
                    label={health?.db === 'ok' ? 'OK' : 'Down'}
                    color={health?.db === 'ok' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Users Total Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6" component="h2">
                  Total Users
                </Typography>
                <PeopleIcon color="primary" />
              </Box>
              <Typography variant="h3" component="div" sx={{ mt: 2 }}>
                {stats?.users_total ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Users (7d) Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6" component="h2">
                  Active Users (7d)
                </Typography>
                <PeopleIcon color="secondary" />
              </Box>
              <Typography variant="h3" component="div" sx={{ mt: 2 }}>
                {stats?.users_active_7d ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Families Total Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6" component="h2">
                  Total Families
                </Typography>
                <FamilyRestroomIcon color="primary" />
              </Box>
              <Typography variant="h3" component="div" sx={{ mt: 2 }}>
                {stats?.families_total ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Join Requests Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6" component="h2">
                  Pending Join Requests
                </Typography>
                <GroupAddIcon color="warning" />
              </Box>
              <Typography variant="h3" component="div" sx={{ mt: 2 }}>
                {stats?.join_requests_pending ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Posts Last 7d Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6" component="h2">
                  Posts (Last 7d)
                </Typography>
                <ArticleIcon color="primary" />
              </Box>
              <Typography variant="h3" component="div" sx={{ mt: 2 }}>
                {stats?.posts_last_7d ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
