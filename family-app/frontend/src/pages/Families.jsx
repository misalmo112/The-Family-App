import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { useFamily } from '../context/FamilyContext';
import { getFamilies } from '../services/families';

const Families = () => {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setActiveFamily, activeFamilyId } = useFamily();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFamilies();
      setFamilies(data || []);
    } catch (err) {
      console.error('Error fetching families:', err);
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else {
          setError(err.response.data?.error || 'Failed to load families. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFamily = (family) => {
    setActiveFamily(family.id, family.name);
    navigate('/feed');
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
        <Button variant="contained" onClick={fetchFamilies}>
          Retry
        </Button>
      </Box>
    );
  }

  if (families.length === 0) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Families
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          You don't belong to any families yet. Create a family or join one to get started.
        </Alert>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/onboarding')}
          >
            Get Started
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Families
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Select a family to view its feed and topology
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {families.map((family) => (
          <Card
            key={family.id}
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: 4,
                borderColor: 'primary.main',
              },
              border: activeFamilyId === family.id ? 2 : 1,
              borderColor: activeFamilyId === family.id ? 'primary.main' : 'divider',
            }}
            onClick={() => handleSelectFamily(family)}
          >
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                {family.name}
                {activeFamilyId === family.id && (
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ ml: 1, color: 'primary.main', fontWeight: 'bold' }}
                  >
                    (Active)
                  </Typography>
                )}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 2 }, mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Code: <strong>{family.code}</strong>
                </Typography>
                {family.created_at && (
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(family.created_at).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default Families;
