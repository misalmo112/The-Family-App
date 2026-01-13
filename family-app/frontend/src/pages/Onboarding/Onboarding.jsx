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
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useFamily } from '../../context/FamilyContext';
import { createFamily, submitJoinRequest } from '../../services/families';

const Onboarding = () => {
  const navigate = useNavigate();
  const { setActiveFamily } = useFamily();
  const [mode, setMode] = useState(null); // 'create' or 'join'
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Create family state
  const [familyName, setFamilyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  
  // Join family state
  const [familyCode, setFamilyCode] = useState('');
  const [joinFirstName, setJoinFirstName] = useState('');
  const [joinLastName, setJoinLastName] = useState('');
  const [joinDob, setJoinDob] = useState('');
  const [joinGender, setJoinGender] = useState('');
  
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
      } else if (activeStep === 1) {
        if (!firstName.trim() && !lastName.trim()) {
          setError('Please enter at least a first name or last name');
          return;
        }
      }
    } else if (mode === 'join') {
      if (activeStep === 0) {
        if (!familyCode.trim() || familyCode.length !== 8) {
          setError('Please enter a valid 8-character family code');
          return;
        }
      } else if (activeStep === 1) {
        if (!joinFirstName.trim() && !joinLastName.trim()) {
          setError('Please enter at least a first name or last name');
          return;
        }
      }
    }
    
    if (activeStep === 1) {
      handleSubmit();
    } else {
      setActiveStep(activeStep + 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (mode === 'create') {
        const personData = {};
        if (firstName.trim()) personData.first_name = firstName.trim();
        if (lastName.trim()) personData.last_name = lastName.trim();
        if (dob) personData.dob = dob;
        if (gender) personData.gender = gender;

        const family = await createFamily(familyName.trim(), personData);
        setCreatedFamily(family);
        setActiveFamily(family.id, family.name);
        setActiveStep(2);
      } else if (mode === 'join') {
        const personPayload = {};
        if (joinFirstName.trim()) personPayload.first_name = joinFirstName.trim();
        if (joinLastName.trim()) personPayload.last_name = joinLastName.trim();
        if (joinDob) personPayload.dob = joinDob;
        if (joinGender) personPayload.gender = joinGender;

        const request = await submitJoinRequest({
          code: familyCode.toUpperCase().trim(),
          new_person_payload: personPayload
        });
        setJoinRequest(request);
        setActiveStep(2);
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
          }}
        >
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
  const createSteps = ['Family Name', 'Your Profile', 'Success'];
  const joinSteps = ['Family Code', 'Your Profile', 'Request Submitted'];

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
        }}
      >
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

            {/* Create Family - Step 2: Profile */}
            {mode === 'create' && activeStep === 1 && (
              <Box>
                <TextField
                  fullWidth
                  label="First Name"
                  variant="outlined"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  variant="outlined"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  variant="outlined"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  select
                  label="Gender"
                  variant="outlined"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="">Not specified</MenuItem>
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                  <MenuItem value="UNKNOWN">Prefer not to say</MenuItem>
                </TextField>
                <Typography variant="body2" color="text.secondary">
                  This information will be used to create your profile in the family.
                </Typography>
              </Box>
            )}

            {/* Create Family - Step 3: Success */}
            {mode === 'create' && activeStep === 2 && createdFamily && (
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Share this code with family members so they can join your family.
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

            {/* Join Family - Step 2: Profile */}
            {mode === 'join' && activeStep === 1 && (
              <Box>
                <TextField
                  fullWidth
                  label="First Name"
                  variant="outlined"
                  value={joinFirstName}
                  onChange={(e) => setJoinFirstName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  variant="outlined"
                  value={joinLastName}
                  onChange={(e) => setJoinLastName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  variant="outlined"
                  value={joinDob}
                  onChange={(e) => setJoinDob(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  select
                  label="Gender"
                  variant="outlined"
                  value={joinGender}
                  onChange={(e) => setJoinGender(e.target.value)}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="">Not specified</MenuItem>
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                  <MenuItem value="UNKNOWN">Prefer not to say</MenuItem>
                </TextField>
                <Typography variant="body2" color="text.secondary">
                  This information will be used to create your profile in the family.
                </Typography>
              </Box>
            )}

            {/* Join Family - Step 3: Pending */}
            {mode === 'join' && activeStep === 2 && joinRequest && (
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  A family admin will review your request. You'll be notified once it's approved.
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
          {activeStep < 2 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button onClick={handleBack} disabled={loading}>
                {activeStep === 0 ? 'Back' : 'Previous'}
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
                ) : activeStep === 1 ? (
                  'Submit'
                ) : (
                  'Next'
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
