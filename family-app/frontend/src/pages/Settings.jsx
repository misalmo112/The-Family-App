import { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { getProfile, updateProfile, changePassword } from '../services/auth';

const Settings = () => {
  // Profile section state
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password section state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const data = await getProfile();
      setProfile(data);
      setEmail(data.email || '');
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setDob(data.dob || '');
      setGender(data.gender || '');
    } catch (err) {
      console.error('Error loading profile:', err);
      setProfileError(
        err.response?.data?.detail || err.response?.data?.error || 'Failed to load profile'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const updated = await updateProfile({
        email,
        first_name: firstName,
        last_name: lastName,
        dob: dob || null,
        gender: gender || null,
      });
      setProfile(updated);
      setProfileSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMessage =
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to update profile';
      setProfileError(errorMessage);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    // Client-side validation
    if (newPassword !== newPasswordConfirm) {
      setPasswordError('New passwords do not match');
      setChangingPassword(false);
      return;
    }

    try {
      await changePassword(oldPassword, newPassword, newPasswordConfirm);
      setPasswordSuccess('Password changed successfully');
      // Clear password fields
      setOldPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err) {
      console.error('Error changing password:', err);
      const errorMessage =
        err.response?.data?.old_password?.[0] ||
        err.response?.data?.new_password?.[0] ||
        err.response?.data?.new_password_confirm?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to change password';
      setPasswordError(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  if (profileLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
        Settings
      </Typography>

      {/* Profile Edit Section */}
      <Card elevation={0} sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
            Edit Profile
          </Typography>

          {profileError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setProfileError('')}>
              {profileError}
            </Alert>
          )}

          {profileSuccess && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setProfileSuccess('')}>
              {profileSuccess}
            </Alert>
          )}

          <Box component="form" onSubmit={handleProfileSubmit}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="normal"
              value={profile?.username || ''}
              disabled
              helperText="Username cannot be changed"
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
              disabled={savingProfile}
              autoComplete="email"
            />
            <TextField
              fullWidth
              label="First Name"
              variant="outlined"
              margin="normal"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={savingProfile}
              autoComplete="given-name"
            />
            <TextField
              fullWidth
              label="Last Name"
              variant="outlined"
              margin="normal"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={savingProfile}
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
              disabled={savingProfile}
            />
            <TextField
              fullWidth
              select
              label="Gender"
              variant="outlined"
              margin="normal"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              disabled={savingProfile}
            >
              <MenuItem value="">Not specified</MenuItem>
              <MenuItem value="MALE">Male</MenuItem>
              <MenuItem value="FEMALE">Female</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
              <MenuItem value="UNKNOWN">Prefer not to say</MenuItem>
            </TextField>
            {profile?.date_joined && (
              <TextField
                fullWidth
                label="Date Joined"
                variant="outlined"
                margin="normal"
                value={new Date(profile.date_joined).toLocaleDateString()}
                disabled
                helperText="Account creation date"
              />
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={savingProfile}
                startIcon={savingProfile ? <CircularProgress size={20} /> : null}
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card elevation={0}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
            Change Password
          </Typography>

          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError('')}>
              {passwordError}
            </Alert>
          )}

          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPasswordSuccess('')}>
              {passwordSuccess}
            </Alert>
          )}

          <Box component="form" onSubmit={handlePasswordSubmit}>
            <TextField
              fullWidth
              label="Old Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              disabled={changingPassword}
              autoComplete="current-password"
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={changingPassword}
              autoComplete="new-password"
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              required
              disabled={changingPassword}
              autoComplete="new-password"
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={changingPassword}
                startIcon={changingPassword ? <CircularProgress size={20} /> : null}
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Settings;
