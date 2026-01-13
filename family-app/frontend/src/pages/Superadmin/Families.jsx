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
import { getFamilies, suspendFamily, unsuspendFamily } from '../../services/admin';

const Families = () => {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  
  // Dialog states
  const [suspendDialog, setSuspendDialog] = useState({ open: false, familyId: null, reason: '' });
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getFamilies(searchQuery);
      // Handle paginated response
      const data = response.results || response;
      setFamilies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching families:', err);
      setError(err.response?.data?.error || 'Failed to load families');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchFamilies();
  };

  const handleSuspendClick = (familyId) => {
    setSuspendDialog({ open: true, familyId, reason: '' });
  };

  const handleSuspendConfirm = async () => {
    const { familyId, reason } = suspendDialog;
    try {
      setActionLoading((prev) => ({ ...prev, [`suspend-${familyId}`]: true }));
      await suspendFamily(familyId, reason);
      setSnackbar({ open: true, message: 'Family suspended successfully', severity: 'success' });
      setSuspendDialog({ open: false, familyId: null, reason: '' });
      fetchFamilies();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to suspend family',
        severity: 'error',
      });
    } finally {
      setActionLoading((prev) => {
        const updated = { ...prev };
        delete updated[`suspend-${familyId}`];
        return updated;
      });
    }
  };

  const handleUnsuspendClick = async (familyId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`unsuspend-${familyId}`]: true }));
      await unsuspendFamily(familyId);
      setSnackbar({ open: true, message: 'Family unsuspended successfully', severity: 'success' });
      fetchFamilies();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to unsuspend family',
        severity: 'error',
      });
    } finally {
      setActionLoading((prev) => {
        const updated = { ...prev };
        delete updated[`unsuspend-${familyId}`];
        return updated;
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading && families.length === 0) {
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
          Families
        </Typography>
        <IconButton onClick={fetchFamilies} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Search families"
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
              <TableCell>Name</TableCell>
              <TableCell>Member Count</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Suspended</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {families.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No families found
                </TableCell>
              </TableRow>
            ) : (
              families.map((family) => (
                <TableRow key={family.id}>
                  <TableCell>{family.id}</TableCell>
                  <TableCell>{family.name}</TableCell>
                  <TableCell>{family.member_count || 0}</TableCell>
                  <TableCell>{formatDate(family.created_at)}</TableCell>
                  <TableCell>
                    <Chip
                      label={family.suspended ? 'Suspended' : 'Active'}
                      color={family.suspended ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {family.suspended ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        onClick={() => handleUnsuspendClick(family.id)}
                        disabled={actionLoading[`unsuspend-${family.id}`]}
                      >
                        {actionLoading[`unsuspend-${family.id}`] ? (
                          <CircularProgress size={16} />
                        ) : (
                          'Unsuspend'
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleSuspendClick(family.id)}
                        disabled={actionLoading[`suspend-${family.id}`]}
                      >
                        {actionLoading[`suspend-${family.id}`] ? (
                          <CircularProgress size={16} />
                        ) : (
                          'Suspend'
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Suspend Family Dialog */}
      <Dialog open={suspendDialog.open} onClose={() => setSuspendDialog({ open: false, familyId: null, reason: '' })}>
        <DialogTitle>Suspend Family</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason (optional)"
            fullWidth
            multiline
            rows={3}
            value={suspendDialog.reason}
            onChange={(e) => setSuspendDialog({ ...suspendDialog, reason: e.target.value })}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuspendDialog({ open: false, familyId: null, reason: '' })}>
            Cancel
          </Button>
          <Button onClick={handleSuspendConfirm} color="error" variant="contained">
            Suspend
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

export default Families;
