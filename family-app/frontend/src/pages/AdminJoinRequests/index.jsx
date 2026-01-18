import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Snackbar,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} from '../../services/families';
import { getPersons } from '../../services/graph';

const AdminJoinRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [familyPersons, setFamilyPersons] = useState({}); // { familyId: [persons] }
  const [loadingPersons, setLoadingPersons] = useState({}); // { familyId: true/false }
  const [selectedPersonIds, setSelectedPersonIds] = useState({}); // { requestId: personId }

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchPersonsForFamily = async (familyId) => {
    // Skip if already fetched or currently loading
    if (familyPersons[familyId] || loadingPersons[familyId]) {
      return;
    }

    try {
      setLoadingPersons((prev) => ({ ...prev, [familyId]: true }));
      const persons = await getPersons({ familyId });
      // Filter to only include persons without user accounts
      const availablePersons = (persons || []).filter(
        (person) => person.has_user_account === false
      );
      setFamilyPersons((prev) => ({ ...prev, [familyId]: availablePersons }));
    } catch (err) {
      console.error(`Error fetching persons for family ${familyId}:`, err);
      // Set empty array on error so we don't retry
      setFamilyPersons((prev) => ({ ...prev, [familyId]: [] }));
    } finally {
      setLoadingPersons((prev) => ({ ...prev, [familyId]: false }));
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getJoinRequests();
      console.log('[DEBUG] Fetched join requests:', data);
      console.log('[DEBUG] Request IDs and types:', data?.map(r => ({ id: r.id, type: typeof r.id })));
      setRequests(data || []);
      
      // Fetch persons for each unique family
      if (data && data.length > 0) {
        const uniqueFamilyIds = [...new Set(data.map(req => req.family?.id).filter(Boolean))];
        uniqueFamilyIds.forEach(familyId => {
          fetchPersonsForFamily(familyId);
        });
      }
    } catch (err) {
      console.error('Error fetching join requests:', err);
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else {
          setError(err.response.data?.error || 'Failed to load join requests. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:53',message:'handleApprove called',data:{id,idType:typeof id,idValue:String(id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    console.log('[DEBUG] handleApprove called with id:', id, 'type:', typeof id);
    // #endregion
    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:56',message:'Before setActionLoading',data:{currentActionLoading:JSON.stringify(actionLoading),id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setActionLoading((prev) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:59',message:'Inside setActionLoading updater',data:{prevState:JSON.stringify(prev),id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return { ...prev, [String(id)]: 'approve' };
      });
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:64',message:'Before approveJoinRequest API call',data:{id,apiUrl:`/api/families/join-requests/${id}/approve/`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // Get selected person_id for this request (null if not selected)
      const personId = selectedPersonIds[id] || null;
      const result = await approveJoinRequest(id, personId);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:68',message:'approveJoinRequest API call succeeded',data:{id,result:JSON.stringify(result)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      console.log('[DEBUG] approveJoinRequest succeeded:', result);
      // #endregion
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:70',message:'Before setRequests filter',data:{currentRequestsCount:requests.length,requestsIds:requests.map(r=>r.id),idToRemove:id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      setRequests((prevRequests) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:72',message:'Inside setRequests updater',data:{prevRequestsCount:prevRequests.length,prevRequestsIds:prevRequests.map(r=>r.id),idToRemove:id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        const filtered = prevRequests.filter((req) => {
          // Ensure both are compared as numbers for consistency
          const reqIdNum = Number(req.id);
          const idNum = Number(id);
          const shouldKeep = reqIdNum !== idNum;
          console.log('[DEBUG] Filtering request:', { reqId: req.id, reqIdNum, id, idNum, shouldKeep });
          return shouldKeep;
        });
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:75',message:'After filter in setRequests',data:{filteredCount:filtered.length,filteredIds:filtered.map(r=>r.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        console.log('[DEBUG] After filter - removed id:', id, 'remaining count:', filtered.length);
        // #endregion
        return filtered;
      });
      // Clear selected person_id for this request
      setSelectedPersonIds((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      setSnackbar({
        open: true,
        message: 'Join request approved successfully',
        severity: 'success',
      });
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:85',message:'Error in handleApprove catch block',data:{id,errorMessage:err.message,errorResponse:err.response?JSON.stringify({status:err.response.status,data:err.response.data,headers:err.response.headers}):'no response',errorStack:err.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      console.error('[DEBUG] Error approving join request:', err);
      console.error('[DEBUG] Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url
      });
      // #endregion
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to approve join request',
        severity: 'error',
      });
    } finally {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:94',message:'In handleApprove finally block',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setActionLoading((prev) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:96',message:'Clearing actionLoading in finally',data:{prevState:JSON.stringify(prev),id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const updated = { ...prev };
        delete updated[String(id)];
        return updated;
      });
    }
  };

  const handleReject = async (id) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:103',message:'handleReject called',data:{id,idType:typeof id,idValue:String(id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:106',message:'Before setActionLoading',data:{currentActionLoading:JSON.stringify(actionLoading),id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setActionLoading((prev) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:108',message:'Inside setActionLoading updater',data:{prevState:JSON.stringify(prev),id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return { ...prev, [String(id)]: 'reject' };
      });
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:113',message:'Before rejectJoinRequest API call',data:{id,apiUrl:`/api/families/join-requests/${id}/reject/`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const result = await rejectJoinRequest(id);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:117',message:'rejectJoinRequest API call succeeded',data:{id,result:JSON.stringify(result)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:119',message:'Before setRequests filter',data:{currentRequestsCount:requests.length,requestsIds:requests.map(r=>r.id),idToRemove:id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      setRequests((prevRequests) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:121',message:'Inside setRequests updater',data:{prevRequestsCount:prevRequests.length,prevRequestsIds:prevRequests.map(r=>r.id),idToRemove:id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        const filtered = prevRequests.filter((req) => {
          // Ensure both are compared as numbers for consistency
          const reqIdNum = Number(req.id);
          const idNum = Number(id);
          const shouldKeep = reqIdNum !== idNum;
          console.log('[DEBUG] Filtering request (reject):', { reqId: req.id, reqIdNum, id, idNum, shouldKeep });
          return shouldKeep;
        });
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:124',message:'After filter in setRequests',data:{filteredCount:filtered.length,filteredIds:filtered.map(r=>r.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        console.log('[DEBUG] After filter (reject) - removed id:', id, 'remaining count:', filtered.length);
        // #endregion
        return filtered;
      });
      setSnackbar({
        open: true,
        message: 'Join request rejected successfully',
        severity: 'success',
      });
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:133',message:'Error in handleReject catch block',data:{id,errorMessage:err.message,errorResponse:err.response?JSON.stringify({status:err.response.status,data:err.response.data,headers:err.response.headers}):'no response',errorStack:err.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error('Error rejecting join request:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to reject join request',
        severity: 'error',
      });
    } finally {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:142',message:'In handleReject finally block',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setActionLoading((prev) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:144',message:'Clearing actionLoading in finally',data:{prevState:JSON.stringify(prev),id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatGender = (gender) => {
    if (!gender) return 'N/A';
    return gender.charAt(0) + gender.slice(1).toLowerCase();
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
        <Button variant="contained" onClick={fetchRequests}>
          Retry
        </Button>
      </Box>
    );
  }

  if (requests.length === 0) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Join Requests
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          No pending join requests found. You may not be an admin of any families, or there are no pending requests.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        Join Requests
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Review and manage pending join requests for your families.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {requests.map((request) => (
          <Card key={request.id} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {request.family?.name || 'Unknown Family'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Requested by: <strong>{request.requested_by}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Requested on: {formatDate(request.created_at)}
                  </Typography>
                </Box>
                <Chip label="Pending" color="warning" size="small" />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Person Details:
                </Typography>
                {request.chosen_person_id ? (
                  <Typography variant="body2">
                    Joining as existing person (ID: {request.chosen_person_id})
                  </Typography>
                ) : request.new_person_payload ? (
                  <Box sx={{ pl: 2 }}>
                    {request.new_person_payload.first_name && (
                      <Typography variant="body2">
                        <strong>First Name:</strong> {request.new_person_payload.first_name}
                      </Typography>
                    )}
                    {request.new_person_payload.last_name && (
                      <Typography variant="body2">
                        <strong>Last Name:</strong> {request.new_person_payload.last_name}
                      </Typography>
                    )}
                    {request.new_person_payload.dob && (
                      <Typography variant="body2">
                        <strong>Date of Birth:</strong> {new Date(request.new_person_payload.dob).toLocaleDateString()}
                      </Typography>
                    )}
                    {request.new_person_payload.gender && (
                      <Typography variant="body2">
                        <strong>Gender:</strong> {formatGender(request.new_person_payload.gender)}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No person details provided
                  </Typography>
                )}
              </Box>

              {/* Link to Existing Person Selection */}
              {request.family?.id && (() => {
                const familyId = request.family.id;
                const availablePersons = familyPersons[familyId] || [];
                const isLoading = loadingPersons[familyId] === true;
                const hasAvailablePersons = availablePersons.length > 0;
                
                if (isLoading) {
                  return (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Loading available persons...
                      </Typography>
                      <CircularProgress size={20} />
                    </Box>
                  );
                }
                
                if (!hasAvailablePersons) {
                  return null; // Don't show dropdown if no available persons
                }
                
                return (
                  <Box sx={{ mb: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel id={`person-select-label-${request.id}`}>
                        Link to existing person (optional)
                      </InputLabel>
                      <Select
                        labelId={`person-select-label-${request.id}`}
                        id={`person-select-${request.id}`}
                        value={selectedPersonIds[request.id] || ''}
                        label="Link to existing person (optional)"
                        onChange={(e) => {
                          const personId = e.target.value === '' ? null : e.target.value;
                          setSelectedPersonIds((prev) => ({
                            ...prev,
                            [request.id]: personId,
                          }));
                        }}
                        disabled={actionLoading[String(request.id)] !== null && actionLoading[String(request.id)] !== undefined}
                      >
                        <MenuItem value="">
                          <em>Create new person</em>
                        </MenuItem>
                        {availablePersons.map((person) => (
                          <MenuItem key={person.id} value={person.id}>
                            {person.first_name} {person.last_name}
                            {person.dob && ` (${new Date(person.dob).getFullYear()})`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {selectedPersonIds[request.id] && (
                      <Chip
                        label={`Will link to: ${availablePersons.find(p => p.id === selectedPersonIds[request.id])?.first_name} ${availablePersons.find(p => p.id === selectedPersonIds[request.id])?.last_name}`}
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                );
              })()}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:222',message:'Reject button clicked',data:{requestId:request.id,requestIdType:typeof request.id,actionLoadingState:JSON.stringify(actionLoading),isDisabled:actionLoading[request.id] !== null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                    console.log('[DEBUG] Reject button clicked, request.id:', request.id, 'type:', typeof request.id);
                    // #endregion
                    handleReject(request.id);
                  }}
                  disabled={actionLoading[String(request.id)] !== null && actionLoading[String(request.id)] !== undefined}
                  startIcon={
                    actionLoading[String(request.id)] === 'reject' ? (
                      <CircularProgress size={16} />
                    ) : null
                  }
                >
                  Reject
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminJoinRequests/index.jsx:236',message:'Approve button clicked',data:{requestId:request.id,requestIdType:typeof request.id,actionLoadingState:JSON.stringify(actionLoading),isDisabled:actionLoading[request.id] !== null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                    console.log('[DEBUG] Approve button clicked, request.id:', request.id, 'type:', typeof request.id);
                    // #endregion
                    handleApprove(request.id);
                  }}
                  disabled={actionLoading[String(request.id)] !== null && actionLoading[String(request.id)] !== undefined}
                  startIcon={
                    actionLoading[String(request.id)] === 'approve' ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : null
                  }
                >
                  Approve
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminJoinRequests;
