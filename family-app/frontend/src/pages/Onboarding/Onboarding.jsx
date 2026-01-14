import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LogoutIcon from '@mui/icons-material/Logout';
import { useFamily } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { createFamily, submitJoinRequest } from '../../services/families';

const Onboarding = () => {
  const navigate = useNavigate();
  const { setActiveFamily } = useFamily();
  const { logout } = useAuth();
  const [mode, setMode] = useState(null); // 'create' or 'join'
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Create family state
  const [familyName, setFamilyName] = useState('');
  
  // Join family state
  const [familyCode, setFamilyCode] = useState('');
  
  // Success state
  const [createdFamily, setCreatedFamily] = useState(null);
  const [joinRequest, setJoinRequest] = useState(null);

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setActiveStep(0);
    setError(null);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      setMode(null);
    } else {
      setActiveStep(activeStep - 1);
    }
    setError(null);
  };

  const handleNext = () => {
    if (mode === 'create') {
      if (activeStep === 0) {
        if (!familyName.trim()) {
          setError('Please enter a family name');
          return;
        }
        // Submit on step 0 (family name)
        handleSubmit();
        return;
      }
    } else if (mode === 'join') {
      if (activeStep === 0) {
        if (!familyCode.trim() || familyCode.length !== 8) {
          setError('Please enter a valid 8-character family code');
          return;
        }
        // Submit on step 0 (family code)
        handleSubmit();
        return;
      }
    }
    
    setActiveStep(activeStep + 1);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (mode === 'create') {
        const family = await createFamily(familyName.trim());
        setCreatedFamily(family);
        setActiveFamily(family.id, family.name);
        setActiveStep(1);
      } else if (mode === 'join') {
        const request = await submitJoinRequest({
          code: familyCode.toUpperCase().trim()
        });
        setJoinRequest(request);
        setActiveStep(1);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.detail || 
        'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (createdFamily?.code) {
      navigator.clipboard.writeText(createdFamily.code);
    }
  };

  const handleGoToFeed = () => {
    navigate('/feed');
  };

  const handleGoToPending = () => {
    navigate('/pending');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Welcome screen
  if (!mode) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            gap: 4,
            position: 'relative',
          }}
        >
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
            }}
          >
            Logout
          </Button>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Welcome to Family App
          </Typography>
          <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Get started by creating a new family or joining an existing one
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 3, width: '100%', maxWidth: 600 }}>
            <Card
              sx={{
                flex: 1,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-4px)',
                },
              }}
              onClick={() => handleModeSelect('create')}
            >
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Create a Family
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start a new family group and invite others to join using a unique family code.
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="large" fullWidth>
                  Get Started
                </Button>
              </CardActions>
            </Card>

            <Card
              sx={{
                flex: 1,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-4px)',
                },
              }}
              onClick={() => handleModeSelect('join')}
            >
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Join a Family
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Join an existing family using a family code provided by a family admin.
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="large" fullWidth>
                  Join Now
                </Button>
              </CardActions>
            </Card>
          </Box>
        </Box>
      </Container>
    );
  }

  // Wizard steps
  const createSteps = ['Family Name', 'Success'];
  const joinSteps = ['Family Code', 'Request Submitted'];

  const steps = mode === 'create' ? createSteps : joinSteps;

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
          position: 'relative',
        }}
      >
        <Button
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
          }}
        >
          Logout
        </Button>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            {mode === 'create' ? 'Create a Family' : 'Join a Family'}
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mt: 4, mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 4 }}>
            {/* Create Family - Step 1: Family Name */}
            {mode === 'create' && activeStep === 0 && (
              <Box>
                <TextField
                  fullWidth
                  label="Family Name"
                  variant="outlined"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                  placeholder="e.g., The Smith Family"
                />
                <Typography variant="body2" color="text.secondary">
                  Choose a name that represents your family group.
                </Typography>
              </Box>
            )}

            {/* Create Family - Step 2: Success */}
            {mode === 'create' && activeStep === 1 && createdFamily && (
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Family created successfully!
                </Alert>
                <Typography variant="h6" gutterBottom>
                  Your Family Code
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      letterSpacing: 2,
                      mr: 1,
                    }}
                  >
                    {createdFamily.code}
                  </Typography>
                  <IconButton onClick={handleCopyCode} color="primary">
                    <ContentCopyIcon />
                  </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Share this code with family members so they can join your family.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Your profile information will be used. You can update your details in your{' '}
                  <Button
                    component="a"
                    href="/profile"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/profile');
                    }}
                    sx={{ textTransform: 'none', p: 0, minWidth: 'auto', verticalAlign: 'baseline' }}
                  >
                    profile settings
                  </Button>
                  .
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleGoToFeed}
                >
                  Go to Family Feed
                </Button>
              </Box>
            )}

            {/* Join Family - Step 1: Family Code */}
            {mode === 'join' && activeStep === 0 && (
              <Box>
                <TextField
                  fullWidth
                  label="Family Code"
                  variant="outlined"
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                  required
                  inputProps={{ maxLength: 8, style: { textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 2 } }}
                  sx={{ mb: 2 }}
                  placeholder="A1B2C3D4"
                  helperText="Enter the 8-character code provided by the family admin"
                />
              </Box>
            )}

            {/* Join Family - Step 2: Pending */}
            {mode === 'join' && activeStep === 1 && joinRequest && (
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Join request submitted!
                </Alert>
                <Typography variant="h6" gutterBottom>
                  Request Pending Approval
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Your request to join <strong>{joinRequest.family}</strong> has been submitted.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  A family admin will review your request. You'll be notified once it's approved.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Your profile information will be used. You can update your details in your{' '}
                  <Button
                    component="a"
                    href="/profile"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/profile');
                    }}
                    sx={{ textTransform: 'none', p: 0, minWidth: 'auto', verticalAlign: 'baseline' }}
                  >
                    profile settings
                  </Button>
                  .
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleGoToPending}
                  sx={{ mb: 2 }}
                >
                  View Request Status
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={() => navigate('/families')}
                >
                  Back to Families
                </Button>
              </Box>
            )}
          </Box>

          {/* Navigation buttons */}
          {activeStep < 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button onClick={handleBack} disabled={loading}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Processing...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Onboarding;
