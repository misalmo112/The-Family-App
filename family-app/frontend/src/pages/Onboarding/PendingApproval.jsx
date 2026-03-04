import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  IconButton,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getMyJoinRequests, getFamilies } from '../../services/families';
import { useFamily } from '../../context/FamilyContext';

const PendingApproval = () => {
  const navigate = useNavigate();
  const { setActiveFamily } = useFamily();
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJoinRequests();
    // Check if user now has families (request was approved)
    checkForApprovedRequests();
  }, []);

  const fetchJoinRequests = async () => {
    try {
      setError(null);
      const data = await getMyJoinRequests();
      setJoinRequests(data || []);
    } catch (err) {
      console.error('Error fetching join requests:', err);
      setError('Failed to load join requests. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkForApprovedRequests = async () => {
    try {
      const families = await getFamilies();
      if (families && families.length > 0) {
        // User now has families, likely a request was approved
        const approvedRequest = joinRequests.find(
          (req) => req.status === 'APPROVED'
        );
        if (approvedRequest) {
          // Auto-select the first family
          setActiveFamily(families[0].id, families[0].name);
          navigate('/app/feed');
        }
      }
    } catch (err) {
      // Silently fail - this is just a check
      console.error('Error checking families:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchJoinRequests();
    checkForApprovedRequests();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Approval';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '80vh',
          py: 4,
        }}
      >
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Join Request Status
            </Typography>
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshIcon />
            </IconButton>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {joinRequests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Join Requests
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                You haven't submitted any join requests yet.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/onboarding')}
              >
                Join a Family
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {joinRequests.map((request) => (
                <Card key={request.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {request.family?.name || request.family}
                        </Typography>
                        {request.family?.code && (
                          <Typography variant="body2" color="text.secondary">
                            Code: <strong>{request.family.code}</strong>
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={getStatusLabel(request.status)}
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Submitted: {new Date(request.created_at).toLocaleString()}
                    </Typography>

                    {request.status === 'PENDING' && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Your request is waiting for approval from a family admin. 
                        Check back later or refresh to see updates.
                      </Alert>
                    )}

                    {request.status === 'APPROVED' && (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        Your request has been approved! You can now access this family.
                        <Button
                          size="small"
                          onClick={async () => {
                            try {
                              const families = await getFamilies();
                              const family = families.find((f) => f.id === request.family?.id);
                              if (family) {
                                setActiveFamily(family.id, family.name);
                                navigate('/app/feed');
                              }
                            } catch (err) {
                              console.error('Error loading families:', err);
                            }
                          }}
                          sx={{ ml: 2 }}
                        >
                          Go to Family
                        </Button>
                      </Alert>
                    )}

                    {request.status === 'REJECTED' && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        Your request has been rejected. You can try joining again with a different family code.
                      </Alert>
                    )}

                    {request.reviewed_by && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Reviewed by: {request.reviewed_by} on{' '}
                        {new Date(request.updated_at).toLocaleString()}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="outlined" onClick={() => navigate('/onboarding')}>
              Join Another Family
            </Button>
            <Button variant="outlined" onClick={() => navigate('/app/families')}>
              Back to Families
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default PendingApproval;
