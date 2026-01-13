import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  CircularProgress,
  Alert,
  Drawer,
  IconButton,
  Chip,
  Divider,
  TextField,
} from '@mui/material';
import { Close as CloseIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { getErrorLogs } from '../../services/admin';

const ErrorLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getErrorLogs();
      // Handle paginated response
      const data = response.results || response;
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching error logs:', err);
      setError(err.response?.data?.error || 'Failed to load error logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (log) => {
    setSelectedLog(log);
    setDrawerOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatJSON = (obj) => {
    if (!obj) return 'N/A';
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  if (loading && logs.length === 0) {
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
          Error Logs
        </Typography>
        <IconButton onClick={fetchLogs} disabled={loading}>
          <RefreshIcon />
        </IconButton>
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
              <TableCell>Created At</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Endpoint</TableCell>
              <TableCell>Status Code</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No error logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  onClick={() => handleRowClick(log)}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <TableCell>{formatDate(log.created_at)}</TableCell>
                  <TableCell>
                    <Chip
                      label={log.level}
                      color={log.level === 'ERROR' ? 'error' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{log.message}</TableCell>
                  <TableCell>{log.endpoint || 'N/A'}</TableCell>
                  <TableCell>{log.status_code || 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 600 } } }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Error Log Details</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {selectedLog && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body1">{formatDate(selectedLog.created_at)}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Level
                </Typography>
                <Chip
                  label={selectedLog.level}
                  color={selectedLog.level === 'ERROR' ? 'error' : 'warning'}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Message
                </Typography>
                <Typography variant="body1">{selectedLog.message}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Endpoint
                </Typography>
                <Typography variant="body1">{selectedLog.endpoint || 'N/A'}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status Code
                </Typography>
                <Typography variant="body1">{selectedLog.status_code || 'N/A'}</Typography>
              </Box>

              {selectedLog.traceback && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Traceback
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={10}
                      value={selectedLog.traceback}
                      InputProps={{ readOnly: true }}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </>
              )}

              {selectedLog.payload_sanitized && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Payload (Sanitized)
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      value={formatJSON(selectedLog.payload_sanitized)}
                      InputProps={{ readOnly: true }}
                      sx={{ mt: 1, fontFamily: 'monospace' }}
                    />
                  </Box>
                </>
              )}
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default ErrorLogs;
