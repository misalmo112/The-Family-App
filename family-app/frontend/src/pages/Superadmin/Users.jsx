import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  IconButton,
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { getUsers, disableUser, toggleSuperadmin } from '../../services/admin';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  
  // Dialog states
  const [disableDialog, setDisableDialog] = useState({ open: false, userId: null, reason: '' });
  const [toggleDialog, setToggleDialog] = useState({ open: false, userId: null, isSuperadmin: false });
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUsers(searchQuery);
      // Handle paginated response
      const data = response.results || response;
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const handleDisableClick = (userId) => {
    setDisableDialog({ open: true, userId, reason: '' });
  };

  const handleDisableConfirm = async () => {
    const { userId, reason } = disableDialog;
    try {
      setActionLoading((prev) => ({ ...prev, [`disable-${userId}`]: true }));
      await disableUser(userId, reason);
      setSnackbar({ open: true, message: 'User disabled successfully', severity: 'success' });
      setDisableDialog({ open: false, userId: null, reason: '' });
      fetchUsers();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to disable user',
        severity: 'error',
      });
    } finally {
      setActionLoading((prev) => {
        const updated = { ...prev };
        delete updated[`disable-${userId}`];
        return updated;
      });
    }
  };

  const handleToggleSuperadminClick = (userId, isSuperadmin) => {
    setToggleDialog({ open: true, userId, isSuperadmin });
  };

  const handleToggleSuperadminConfirm = async () => {
    const { userId } = toggleDialog;
    try {
      setActionLoading((prev) => ({ ...prev, [`toggle-${userId}`]: true }));
      await toggleSuperadmin(userId);
      setSnackbar({
        open: true,
        message: 'Superadmin status updated successfully',
        severity: 'success',
      });
      setToggleDialog({ open: false, userId: null, isSuperadmin: false });
      fetchUsers();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to update superadmin status',
        severity: 'error',
      });
    } finally {
      setActionLoading((prev) => {
        const updated = { ...prev };
        delete updated[`toggle-${userId}`];
        return updated;
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Users
        </Typography>
        <IconButton onClick={fetchUsers} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Search users"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={handleSearch}
          disabled={loading}
        >
          Search
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Superadmin</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Date Joined</TableCell>
              <TableCell>Families Count</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? 'Active' : 'Inactive'}
                      color={user.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_superadmin ? 'Yes' : 'No'}
                      color={user.is_superadmin ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.last_login)}</TableCell>
                  <TableCell>{formatDate(user.date_joined)}</TableCell>
                  <TableCell>{user.families_count || 0}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDisableClick(user.id)}
                        disabled={!user.is_active || actionLoading[`disable-${user.id}`]}
                      >
                        {actionLoading[`disable-${user.id}`] ? (
                          <CircularProgress size={16} />
                        ) : (
                          'Disable'
                        )}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color={user.is_superadmin ? 'warning' : 'primary'}
                        onClick={() => handleToggleSuperadminClick(user.id, user.is_superadmin)}
                        disabled={actionLoading[`toggle-${user.id}`]}
                      >
                        {actionLoading[`toggle-${user.id}`] ? (
                          <CircularProgress size={16} />
                        ) : user.is_superadmin ? (
                          'Revoke'
                        ) : (
                          'Make Admin'
                        )}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Disable User Dialog */}
      <Dialog open={disableDialog.open} onClose={() => setDisableDialog({ open: false, userId: null, reason: '' })}>
        <DialogTitle>Disable User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason (optional)"
            fullWidth
            multiline
            rows={3}
            value={disableDialog.reason}
            onChange={(e) => setDisableDialog({ ...disableDialog, reason: e.target.value })}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisableDialog({ open: false, userId: null, reason: '' })}>
            Cancel
          </Button>
          <Button onClick={handleDisableConfirm} color="error" variant="contained">
            Disable
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toggle Superadmin Dialog */}
      <Dialog open={toggleDialog.open} onClose={() => setToggleDialog({ open: false, userId: null, isSuperadmin: false })}>
        <DialogTitle>
          {toggleDialog.isSuperadmin ? 'Revoke Superadmin Status' : 'Grant Superadmin Status'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {toggleDialog.isSuperadmin ? 'revoke' : 'grant'} superadmin status to this user?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToggleDialog({ open: false, userId: null, isSuperadmin: false })}>
            Cancel
          </Button>
          <Button onClick={handleToggleSuperadminConfirm} color="primary" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;
