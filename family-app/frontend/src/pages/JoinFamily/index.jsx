import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
} from '@mui/material';
import { submitJoinRequest } from '../../services/families';

const JoinFamily = () => {
  const navigate = useNavigate();
  const [familyCode, setFamilyCode] = useState('');
  const [mode, setMode] = useState('create'); // 'create' or 'listed'
  const [chosenPersonId, setChosenPersonId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate family code
    if (!familyCode.trim() || familyCode.length !== 8) {
      setError('Please enter a valid 8-character family code');
      setLoading(false);
      return;
    }

    // Validate mode-specific requirements
    if (mode === 'listed') {
      if (!chosenPersonId.trim()) {
        setError('Please enter a person ID');
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        code: familyCode.toUpperCase().trim(),
      };

      if (mode === 'listed') {
        payload.chosen_person_id = parseInt(chosenPersonId, 10);
        if (isNaN(payload.chosen_person_id)) {
          setError('Person ID must be a valid number');
          setLoading(false);
          return;
        }
      }
      // For 'create' mode, backend will use user profile data automatically

      await submitJoinRequest(payload);
      setSuccess(true);
    } catch (err) {
      console.error('Error submitting join request:', err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          py: 4,
        }}
      >
        <Paper elevation={0} sx={{ p: 4, width: '100%', borderRadius: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Join a Family
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Use the private family code provided by an admin.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
              Request submitted for approval
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="Family Code"
              variant="outlined"
              value={familyCode}
              onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
              required
              inputProps={{ maxLength: 8, style: { textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 2 } }}
              sx={{ mb: 3 }}
              placeholder="A1B2C3D4"
              helperText="Enter the 8-character code provided by the family admin"
              disabled={loading || success}
            />

            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
              <FormLabel component="legend">I'm listed already</FormLabel>
              <RadioGroup
                row
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                  setError(null);
                }}
              >
                <FormControlLabel
                  value="create"
                  control={<Radio />}
                  label="Create me"
                  disabled={loading || success}
                />
                <FormControlLabel
                  value="listed"
                  control={<Radio />}
                  label="I'm listed already"
                  disabled={loading || success}
                />
              </RadioGroup>
            </FormControl>

            {mode === 'listed' && (
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Person ID"
                  variant="outlined"
                  value={chosenPersonId}
                  onChange={(e) => setChosenPersonId(e.target.value)}
                  required
                  type="number"
                  sx={{ mb: 2 }}
                  disabled={loading || success}
                />
                <Alert severity="info">
                  Contact a family admin to get your person ID, or use 'Create me' option
                </Alert>
              </Box>
            )}

            {mode === 'create' && (
              <Box sx={{ mb: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Your profile information will be used to create your person in the family. You can update your details in your{' '}
                  <Button
                    component="a"
                    href="/app/profile"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/app/profile');
                    }}
                    sx={{ textTransform: 'none', p: 0, minWidth: 'auto', verticalAlign: 'baseline' }}
                  >
                    profile settings
                  </Button>
                  .
                </Alert>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/app/families')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || success}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default JoinFamily;
