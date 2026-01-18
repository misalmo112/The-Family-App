import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Grid,
  Divider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  FormControlLabel,
  Collapse,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  AccountTree as AccountTreeIcon,
  AddLink as AddLinkIcon,
  ArrowForward as ArrowForwardIcon,
  FamilyRestroom as FamilyRestroomIcon,
  Wc as WcIcon,
  CalendarToday as CalendarIcon,
  AutoAwesome as AutoAwesomeIcon,
  Settings as SettingsIcon,
  ViewList as ViewListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useFamily } from '../context/FamilyContext';
import { getPersons, getTopology, createRelationship, createPerson, getCurrentUserPersonId, getRelationships, deleteRelationship, getRelationshipCompletion } from '../services/graph';
import { checkIsFamilyAdmin } from '../services/families';
import RelationshipWizard from '../components/RelationshipWizard';
import FamilyGraph from '../components/FamilyGraph';
import BulkFamilyUnit from '../components/BulkFamilyUnit';
import RelationshipTypeSelector from '../components/RelationshipTypeSelector';

const Topology = () => {
  // Always call hook unconditionally - assumes FamilyProvider exists
  // If provider doesn't exist, this will throw (setup issue that should be fixed)
  const familyContext = useFamily();

  // Get activeFamilyId from context or localStorage fallback
  const activeFamilyId = React.useMemo(() => {
    // Use context value if available
    if (familyContext?.activeFamilyId) {
      return familyContext.activeFamilyId;
    }
    // Fallback to localStorage if context value is null/undefined
    try {
      const stored = localStorage.getItem('activeFamily');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.activeFamilyId || null;
      }
    } catch (error) {
      console.error('Error reading activeFamily from localStorage:', error);
    }
    return null;
  }, [familyContext?.activeFamilyId]);
  const [persons, setPersons] = useState([]);
  const [viewerPersonId, setViewerPersonId] = useState(null);
  const [topology, setTopology] = useState(null);
  const [loadingPersons, setLoadingPersons] = useState(false);
  const [loadingTopology, setLoadingTopology] = useState(false);
  const [error, setError] = useState(null);
  
  // Ego view state
  const [isFamilyAdmin, setIsFamilyAdmin] = useState(false);
  const [currentUserPersonId, setCurrentUserPersonId] = useState(null);
  const [viewModeToggle, setViewModeToggle] = useState('ego'); // 'ego' or 'full'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'graph'
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({
    immediate: true,
    extended: true,
    inlaws: true,
  });
  
  // Relationship form state
  const [fromPersonId, setFromPersonId] = useState('');
  const [toPersonId, setToPersonId] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [submittingRelationship, setSubmittingRelationship] = useState(false);
  const [relationshipError, setRelationshipError] = useState(null);
  const [relationshipSuccess, setRelationshipSuccess] = useState(false);
  
  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [showAdvancedMode, setShowAdvancedMode] = useState(false);
  const [bulkFamilyUnitOpen, setBulkFamilyUnitOpen] = useState(false);
  
  // Create Person form state
  const [personFirstName, setPersonFirstName] = useState('');
  const [personLastName, setPersonLastName] = useState('');
  const [personDob, setPersonDob] = useState('');
  const [personGender, setPersonGender] = useState('UNKNOWN');
  const [creatingPerson, setCreatingPerson] = useState(false);
  const [personError, setPersonError] = useState(null);
  const [personSuccess, setPersonSuccess] = useState(false);
  
  // Relationship management state
  const [relationships, setRelationships] = useState([]);
  const [loadingRelationships, setLoadingRelationships] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [relationshipToDelete, setRelationshipToDelete] = useState(null);
  const [deletingRelationship, setDeletingRelationship] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  
  // Completion suggestions state
  const [completionSuggestions, setCompletionSuggestions] = useState([]);
  const [loadingCompletion, setLoadingCompletion] = useState(false);
  const [completionPanelOpen, setCompletionPanelOpen] = useState(false);
  
  // Visual builder state
  const [edgeCreationMode, setEdgeCreationMode] = useState(false);
  const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
  const [edgeFromPerson, setEdgeFromPerson] = useState(null);
  const [edgeToPerson, setEdgeToPerson] = useState(null);

  // Fetch user data (person ID and admin status) when activeFamilyId changes
  useEffect(() => {
    if (!activeFamilyId) {
      setCurrentUserPersonId(null);
      setIsFamilyAdmin(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoadingUserData(true);
        const [personId, isAdmin] = await Promise.all([
          getCurrentUserPersonId(activeFamilyId),
          checkIsFamilyAdmin(activeFamilyId),
        ]);
        setCurrentUserPersonId(personId);
        setIsFamilyAdmin(isAdmin);
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoadingUserData(false);
      }
    };

    fetchUserData();
  }, [activeFamilyId]);

  // Auto-set viewerPersonId for ego view
  useEffect(() => {
    if (currentUserPersonId && viewModeToggle === 'ego') {
      // In ego mode: use current user
      setViewerPersonId(currentUserPersonId);
    }
  }, [currentUserPersonId, viewModeToggle]);

  // Fetch persons when activeFamilyId changes
  useEffect(() => {
    if (!activeFamilyId) {
      setPersons([]);
      setViewerPersonId(null);
      setTopology(null);
      return;
    }

    const fetchPersons = async () => {
      try {
        setLoadingPersons(true);
        setError(null);
        const data = await getPersons({ familyId: activeFamilyId });
        setPersons(data || []);
        
        // For full view mode, default to first person if viewer not set
        if (data && data.length > 0 && viewModeToggle === 'full' && !viewerPersonId) {
          setViewerPersonId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching persons:', err);
        if (err.response) {
          if (err.response.status === 401) {
            setError('Authentication failed. Please log in again.');
          } else if (err.response.status === 403) {
            setError('You are not a member of this family.');
          } else {
            setError(err.response.data?.error || 'Failed to load persons. Please try again.');
          }
        } else {
          setError('Network error. Please check your connection.');
        }
      } finally {
        setLoadingPersons(false);
      }
    };

    fetchPersons();
  }, [activeFamilyId, viewModeToggle]);

  // Function to fetch topology (reusable for refetching)
  const fetchTopologyData = useCallback(async () => {
    if (!activeFamilyId || !viewerPersonId) {
      setTopology(null);
      return;
    }

    try {
      setLoadingTopology(true);
      setError(null);
      const data = await getTopology({
        familyId: activeFamilyId,
        viewerPersonId: viewerPersonId,
      });
      setTopology(data);
    } catch (err) {
      console.error('Error fetching topology:', err);
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response.status === 403) {
          setError('You are not a member of this family.');
        } else {
          setError(err.response.data?.error || 'Failed to load topology. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoadingTopology(false);
    }
  }, [activeFamilyId, viewerPersonId]);

  // Fetch topology when viewerPersonId changes
  useEffect(() => {
    fetchTopologyData();
  }, [fetchTopologyData]);

  // Fetch relationships when activeFamilyId changes (for admins)
  useEffect(() => {
    if (!activeFamilyId) {
      setRelationships([]);
      return;
    }

    const fetchRelationships = async () => {
      try {
        setLoadingRelationships(true);
        const data = await getRelationships({ familyId: activeFamilyId });
        setRelationships(data || []);
      } catch (err) {
        console.error('Error fetching relationships:', err);
        // Don't show error for non-admins, they just won't see the list
        if (err.response?.status !== 403) {
          setError(err.response?.data?.error || 'Failed to load relationships');
        }
      } finally {
        setLoadingRelationships(false);
      }
    };

    fetchRelationships();
  }, [activeFamilyId]);

  // Build person map for edge name lookup
  const personMap = new Map();
  if (topology?.nodes) {
    topology.nodes.forEach((node) => {
      personMap.set(node.id, node);
    });
  } else {
    persons.forEach((person) => {
      personMap.set(person.id, person);
    });
  }

  const getPersonName = (personId) => {
    const person = personMap.get(personId);
    if (!person) return `Person ${personId}`;
    return `${person.first_name || ''} ${person.last_name || ''}`.trim() || `Person ${personId}`;
  };

  const getInitials = (person) => {
    const firstName = person?.first_name || '';
    const lastName = person?.last_name || '';
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    return '?';
  };

  const getRelationshipIcon = (type) => {
    return type === 'PARENT_OF' ? <FamilyRestroomIcon /> : <WcIcon />;
  };

  const getRelationshipColor = (type) => {
    return type === 'PARENT_OF' ? 'primary' : 'secondary';
  };

  // Group family members by relationship category
  const groupNodesByCategory = (nodes) => {
    if (!nodes || nodes.length === 0) {
      return { immediate: [], extended: [], inlaws: [] };
    }

    const immediate = [];
    const extended = [];
    const inlaws = [];

    nodes.forEach((node) => {
      const relation = node.relation_to_viewer?.toLowerCase() || '';
      const isViewer = node.id === viewerPersonId;

      if (isViewer) {
        immediate.push(node);
      } else if (
        relation.includes('father') ||
        relation.includes('mother') ||
        relation.includes('brother') ||
        relation.includes('sister') ||
        relation.includes('son') ||
        relation.includes('daughter') ||
        relation.includes('spouse') ||
        relation.includes('husband') ||
        relation.includes('wife') ||
        relation === 'self'
      ) {
        immediate.push(node);
      } else if (relation.includes('in-law') || relation.includes('in law')) {
        inlaws.push(node);
      } else {
        extended.push(node);
      }
    });

    return { immediate, extended, inlaws };
  };

  // Handle create person form submission
  const handleCreatePerson = async () => {
    // Validation
    if (!personFirstName.trim()) {
      setPersonError('First name is required.');
      return;
    }
    if (!personLastName.trim()) {
      setPersonError('Last name is required.');
      return;
    }
    if (!personGender) {
      setPersonError('Gender is required.');
      return;
    }

    // Validate date if provided
    if (personDob) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(personDob)) {
        setPersonError('Date of birth must be in YYYY-MM-DD format.');
        return;
      }
      const date = new Date(personDob);
      if (isNaN(date.getTime())) {
        setPersonError('Invalid date of birth.');
        return;
      }
    }

    try {
      setCreatingPerson(true);
      setPersonError(null);
      setPersonSuccess(false);

      await createPerson({
        familyId: activeFamilyId,
        firstName: personFirstName.trim(),
        lastName: personLastName.trim(),
        dob: personDob || null,
        gender: personGender,
      });

      // Reset form
      setPersonFirstName('');
      setPersonLastName('');
      setPersonDob('');
      setPersonGender('UNKNOWN');
      setPersonSuccess(true);

      // Refetch persons and topology to show the new person
      const updatedPersons = await getPersons({ familyId: activeFamilyId });
      setPersons(updatedPersons || []);
      
      // Refresh topology if viewerPersonId is set
      if (viewerPersonId) {
        await fetchTopologyData();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setPersonSuccess(false), 3000);
    } catch (err) {
      console.error('Error creating person:', err);
      if (err.response) {
        if (err.response.status === 403) {
          setPersonError('Only family admins can create persons.');
        } else {
          const errorData = err.response.data;
          if (typeof errorData === 'object' && errorData !== null) {
            // Handle field-specific errors
            const errorMessages = Object.entries(errorData)
              .map(([key, value]) => {
                if (Array.isArray(value)) {
                  return `${key}: ${value.join(', ')}`;
                }
                return `${key}: ${value}`;
              })
              .join('; ');
            setPersonError(errorMessages || 'Failed to create person. Please try again.');
          } else {
            setPersonError(err.response.data?.error || 'Failed to create person. Please try again.');
          }
        }
      } else {
        setPersonError('Network error. Please check your connection.');
      }
    } finally {
      setCreatingPerson(false);
    }
  };

  // Handle relationship form submission
  const handleAddRelationship = async () => {
    if (!fromPersonId || !toPersonId || !relationshipType) {
      setRelationshipError('Please fill in all fields.');
      return;
    }

    if (fromPersonId === toPersonId) {
      setRelationshipError('From person and To person cannot be the same.');
      return;
    }

    try {
      setSubmittingRelationship(true);
      setRelationshipError(null);
      setRelationshipSuccess(false);

      await createRelationship({
        familyId: activeFamilyId,
        fromPersonId: parseInt(fromPersonId),
        toPersonId: parseInt(toPersonId),
        type: relationshipType,
      });

      // Reset form
      setFromPersonId('');
      setToPersonId('');
      setRelationshipType('');
      setRelationshipSuccess(true);

      // Refetch topology to show the new relationship
      await fetchTopologyData();

      // Refetch relationships list
      const updatedRelationships = await getRelationships({ familyId: activeFamilyId });
      setRelationships(updatedRelationships || []);

      // Clear success message after 3 seconds
      setTimeout(() => setRelationshipSuccess(false), 3000);
    } catch (err) {
      console.error('Error creating relationship:', err);
      if (err.response) {
        if (err.response.status === 403) {
          setRelationshipError('Only family admins can create relationships.');
        } else {
          setRelationshipError(
            err.response.data?.error || 'Failed to create relationship. Please try again.'
          );
        }
      } else {
        setRelationshipError('Network error. Please check your connection.');
      }
    } finally {
      setSubmittingRelationship(false);
    }
  };

  // Handle delete relationship
  const handleDeleteClick = (relationship) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Topology:514',message:'handleDeleteClick called',data:{relationship:relationship?{id:relationship.id,type:relationship.type,fromPersonId:relationship.from_person_id,toPersonId:relationship.to_person_id,hasId:!!relationship.id}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    setRelationshipToDelete(relationship);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Topology:520',message:'handleDeleteConfirm called',data:{relationshipToDelete:relationshipToDelete?{id:relationshipToDelete.id,type:relationshipToDelete.type}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!relationshipToDelete) return;

    try {
      setDeletingRelationship(true);
      setDeleteError(null);

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Topology:527',message:'Calling deleteRelationship',data:{relationshipId:relationshipToDelete.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      await deleteRelationship(relationshipToDelete.id);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Topology:528',message:'deleteRelationship success',data:{relationshipId:relationshipToDelete.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      // Close dialog
      setDeleteDialogOpen(false);
      setRelationshipToDelete(null);

      // Refetch relationships list
      const updatedRelationships = await getRelationships({ familyId: activeFamilyId });
      setRelationships(updatedRelationships || []);

      // Refetch topology to reflect changes
      await fetchTopologyData();
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Topology:539',message:'deleteRelationship error',data:{error:err.message,status:err.response?.status,responseData:err.response?.data,relationshipId:relationshipToDelete?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error('Error deleting relationship:', err);
      if (err.response) {
        if (err.response.status === 403) {
          setDeleteError('Only family admins can delete relationships.');
        } else {
          setDeleteError(err.response.data?.error || 'Failed to delete relationship. Please try again.');
        }
      } else {
        setDeleteError('Network error. Please check your connection.');
      }
    } finally {
      setDeletingRelationship(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRelationshipToDelete(null);
    setDeleteError(null);
  };

  if (!activeFamilyId) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Topology
        </Typography>
        <Alert severity="info">
          Please select a family to view its topology.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <AccountTreeIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Family Topology
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* View Controls - Available to Everyone */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="View Controls"
          avatar={<SettingsIcon />}
        />
        <CardContent>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={viewModeToggle === 'ego'}
                  onChange={(e) => setViewModeToggle(e.target.checked ? 'ego' : 'full')}
                />
              }
              label={viewModeToggle === 'ego' ? 'Ego View (Your Perspective)' : 'Full Family View'}
            />
            {viewModeToggle === 'full' && (
              <FormControl fullWidth>
                <InputLabel id="viewer-select-label">Viewer Person</InputLabel>
                <Select
                  labelId="viewer-select-label"
                  id="viewer-select"
                  value={viewerPersonId || ''}
                  label="Viewer Person"
                  onChange={(e) => setViewerPersonId(e.target.value)}
                  disabled={loadingPersons || persons.length === 0}
                >
                  {persons.map((person) => (
                    <MenuItem key={person.id} value={person.id}>
                      {person.first_name} {person.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* View Mode Toggle */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => {
            if (newMode !== null) {
              setViewMode(newMode);
              // Disable edge creation mode when switching away from graph
              if (newMode !== 'graph') {
                setEdgeCreationMode(false);
              }
            }
          }}
          aria-label="view mode"
        >
          <ToggleButton value="list" aria-label="list view">
            <ViewListIcon sx={{ mr: 1 }} />
            List View
          </ToggleButton>
          <ToggleButton value="graph" aria-label="graph view">
            <AccountTreeIcon sx={{ mr: 1 }} />
            Graph View
          </ToggleButton>
        </ToggleButtonGroup>
        {viewMode === 'graph' && isFamilyAdmin && (
          <FormControlLabel
            control={
              <Switch
                checked={edgeCreationMode}
                onChange={(e) => setEdgeCreationMode(e.target.checked)}
                color="primary"
              />
            }
            label="Enable Relationship Builder"
          />
        )}
      </Box>

      {/* Add Person Card - Admin Only */}
      {isFamilyAdmin && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Add Family Member"
            subheader="Create a new person in the family topology (no user account required)"
            avatar={<PersonAddIcon />}
          />
          <CardContent>
            {personError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPersonError(null)}>
                {personError}
              </Alert>
            )}
            
            {personSuccess && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPersonSuccess(false)}>
                Person created successfully! They will appear in the family members list.
              </Alert>
            )}

            <Stack spacing={2}>
              <TextField
                fullWidth
                label="First Name"
                value={personFirstName}
                onChange={(e) => setPersonFirstName(e.target.value)}
                required
                disabled={creatingPerson}
                error={personError && !personFirstName.trim()}
              />

              <TextField
                fullWidth
                label="Last Name"
                value={personLastName}
                onChange={(e) => setPersonLastName(e.target.value)}
                required
                disabled={creatingPerson}
                error={personError && !personLastName.trim()}
              />

              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={personDob}
                onChange={(e) => setPersonDob(e.target.value)}
                disabled={creatingPerson}
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="Optional - Format: YYYY-MM-DD"
              />

              <FormControl fullWidth required>
                <InputLabel id="person-gender-label">Gender</InputLabel>
                <Select
                  labelId="person-gender-label"
                  id="person-gender-select"
                  value={personGender}
                  label="Gender"
                  onChange={(e) => setPersonGender(e.target.value)}
                  disabled={creatingPerson}
                >
                  <MenuItem value="UNKNOWN">
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" />
                      <span>Unknown</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="MALE">
                    <Box display="flex" alignItems="center" gap={1}>
                      <WcIcon fontSize="small" />
                      <span>Male</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="FEMALE">
                    <Box display="flex" alignItems="center" gap={1}>
                      <WcIcon fontSize="small" />
                      <span>Female</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="OTHER">
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" />
                      <span>Other</span>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={handleCreatePerson}
                disabled={creatingPerson || !personFirstName.trim() || !personLastName.trim() || !personGender}
                startIcon={creatingPerson ? <CircularProgress size={20} /> : <PersonAddIcon />}
                fullWidth
              >
                {creatingPerson ? 'Creating...' : 'Create Person'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Create Family Unit Card */}
      {isFamilyAdmin && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Create Family Unit"
            subheader="Create an entire family unit (parents + children) in one operation"
            avatar={<FamilyRestroomIcon />}
          />
          <CardContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Quickly create a family unit by selecting parents and children. All relationships will be created automatically.
            </Alert>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<FamilyRestroomIcon />}
              onClick={() => setBulkFamilyUnitOpen(true)}
              disabled={persons.length < 2}
            >
              Create Family Unit
            </Button>
            {persons.length < 2 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                You need at least 2 people in the family to create a family unit.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Relationship Card */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Add Relationship"
          subheader="Connect family members by creating relationships"
          avatar={<AddLinkIcon />}
          action={
            <Button
              variant="outlined"
              size="small"
              startIcon={showAdvancedMode ? <AutoAwesomeIcon /> : <SettingsIcon />}
              onClick={() => setShowAdvancedMode(!showAdvancedMode)}
              sx={{ mr: 1 }}
            >
              {showAdvancedMode ? 'Wizard Mode' : 'Advanced Mode'}
            </Button>
          }
        />
        <CardContent>
          {!showAdvancedMode ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Use the wizard to add relationships with user-friendly labels like "father", "mother", "uncle", etc.
              </Alert>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<AutoAwesomeIcon />}
                onClick={() => setWizardOpen(true)}
                disabled={persons.length < 2}
              >
                Open Relationship Wizard
              </Button>
              {persons.length < 2 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  You need at least 2 people in the family to create relationships.
                </Typography>
              )}
            </Box>
          ) : (
            <>
              {relationshipError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRelationshipError(null)}>
                  {relationshipError}
                </Alert>
              )}
              
              {relationshipSuccess && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setRelationshipSuccess(false)}>
                  Relationship created successfully!
                </Alert>
              )}

              <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="from-person-label">From Person</InputLabel>
              <Select
                labelId="from-person-label"
                id="from-person-select"
                value={fromPersonId}
                label="From Person"
                onChange={(e) => {
                  setFromPersonId(e.target.value);
                  // Reset to person if same as from person
                  if (e.target.value === toPersonId) {
                    setToPersonId('');
                  }
                }}
                disabled={submittingRelationship || persons.length === 0}
              >
                {persons.map((person) => (
                  <MenuItem key={person.id} value={person.id}>
                    {person.first_name} {person.last_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="to-person-label">To Person</InputLabel>
              <Select
                labelId="to-person-label"
                id="to-person-select"
                value={toPersonId}
                label="To Person"
                onChange={(e) => setToPersonId(e.target.value)}
                disabled={submittingRelationship || persons.length === 0 || !fromPersonId}
              >
                {persons
                  .filter((person) => person.id !== parseInt(fromPersonId))
                  .map((person) => (
                    <MenuItem key={person.id} value={person.id}>
                      {person.first_name} {person.last_name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="relationship-type-label">Relationship Type</InputLabel>
              <Select
                labelId="relationship-type-label"
                id="relationship-type-select"
                value={relationshipType}
                label="Relationship Type"
                onChange={(e) => setRelationshipType(e.target.value)}
                disabled={submittingRelationship}
              >
                <MenuItem value="PARENT_OF">
                  <Box display="flex" alignItems="center" gap={1}>
                    <FamilyRestroomIcon fontSize="small" />
                    <span>Parent Of</span>
                  </Box>
                </MenuItem>
                <MenuItem value="SPOUSE_OF">
                  <Box display="flex" alignItems="center" gap={1}>
                    <WcIcon fontSize="small" />
                    <span>Spouse Of</span>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleAddRelationship}
              disabled={submittingRelationship || !fromPersonId || !toPersonId || !relationshipType}
              startIcon={submittingRelationship ? <CircularProgress size={20} /> : <AddLinkIcon />}
            >
              {submittingRelationship ? 'Adding...' : 'Add Relationship'}
            </Button>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>

      {/* Relationship Wizard */}
      <RelationshipWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        familyId={activeFamilyId}
        persons={persons}
        topology={topology}
        viewerPersonId={viewerPersonId}
        currentUserPersonId={currentUserPersonId}
        isAdmin={isFamilyAdmin}
        onSuccess={async () => {
          // Refetch topology after successful relationship creation
          await fetchTopologyData();
          // Refetch relationships list
          const updatedRelationships = await getRelationships({ familyId: activeFamilyId });
          setRelationships(updatedRelationships || []);
        }}
      />

      {/* Bulk Family Unit Dialog */}
      <BulkFamilyUnit
        open={bulkFamilyUnitOpen}
        onClose={() => setBulkFamilyUnitOpen(false)}
        familyId={activeFamilyId}
        persons={persons}
        onSuccess={async () => {
          // Refetch topology after successful family unit creation
          await fetchTopologyData();
          // Refetch relationships list
          const updatedRelationships = await getRelationships({ familyId: activeFamilyId });
          setRelationships(updatedRelationships || []);
        }}
      />

      {/* Relationship Type Selector Dialog */}
      <RelationshipTypeSelector
        open={typeSelectorOpen}
        onClose={() => {
          setTypeSelectorOpen(false);
          setEdgeFromPerson(null);
          setEdgeToPerson(null);
        }}
        fromPerson={edgeFromPerson}
        toPerson={edgeToPerson}
        onConfirm={async (relationshipData) => {
          try {
            await createRelationship({
              familyId: activeFamilyId,
              fromPersonId: relationshipData.fromPersonId,
              toPersonId: relationshipData.toPersonId,
              type: relationshipData.type,
            });
            // Refetch topology after successful relationship creation
            await fetchTopologyData();
            // Refetch relationships list
            const updatedRelationships = await getRelationships({ familyId: activeFamilyId });
            setRelationships(updatedRelationships || []);
            setTypeSelectorOpen(false);
            setEdgeFromPerson(null);
            setEdgeToPerson(null);
          } catch (err) {
            console.error('Error creating relationship:', err);
            // Error will be shown in the dialog or we could add error state
          }
        }}
      />

      {/* Relationship Completion Suggestions Card */}
      {isFamilyAdmin && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Relationship Suggestions"
            subheader="Find and add missing relationships"
            avatar={<AutoAwesomeIcon />}
            action={
              <IconButton
                onClick={() => setCompletionPanelOpen(!completionPanelOpen)}
                aria-label="toggle completion panel"
              >
                {completionPanelOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            }
          />
          <Collapse in={completionPanelOpen}>
            <Divider />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={async () => {
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Topology:1032',message:'Analyze button clicked',data:{activeFamilyId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                    if (!activeFamilyId) return;
                    setLoadingCompletion(true);
                    try {
                      // #region agent log
                      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Topology:1036',message:'Calling getRelationshipCompletion',data:{familyId:activeFamilyId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                      // #endregion
                      const suggestions = await getRelationshipCompletion({ familyId: activeFamilyId });
                      // #region agent log
                      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Topology:1037',message:'getRelationshipCompletion success',data:{suggestionsCount:suggestions?.length||0,suggestions},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                      // #endregion
                      setCompletionSuggestions(suggestions || []);
                    } catch (err) {
                      // #region agent log
                      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Topology:1039',message:'getRelationshipCompletion error',data:{error:err.message,errorStack:err.stack,response:err.response?.data,status:err.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                      // #endregion
                      console.error('Error fetching completion suggestions:', err);
                      setCompletionSuggestions([]);
                    } finally {
                      setLoadingCompletion(false);
                    }
                  }}
                  disabled={loadingCompletion || !activeFamilyId}
                  startIcon={loadingCompletion ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
                >
                  {loadingCompletion ? 'Analyzing...' : 'Analyze Missing Relationships'}
                </Button>
              </Box>

              {completionSuggestions.length > 0 ? (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Found {completionSuggestions.length} suggestion(s):
                  </Typography>
                  <List dense>
                    {completionSuggestions.map((suggestion, index) => {
                      const fromPerson = persons.find(p => p.id === suggestion.from_person_id);
                      const toPerson = persons.find(p => p.id === suggestion.to_person_id);
                      const getPersonName = (person) => {
                        if (!person) return `Person ${suggestion.from_person_id || suggestion.to_person_id}`;
                        return `${person.first_name || ''} ${person.last_name || ''}`.trim() || `Person ${person.id}`;
                      };
                      return (
                        <ListItem key={index}>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                <Typography variant="body2">
                                  {getPersonName(fromPerson)}
                                </Typography>
                                <ArrowForwardIcon fontSize="small" />
                                <Typography variant="body2">
                                  {getPersonName(toPerson)}
                                </Typography>
                                <Chip
                                  label={suggestion.relationship_type.replace('_', ' ')}
                                  size="small"
                                  color="primary"
                                />
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                {suggestion.reason}
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={async () => {
                                try {
                                  await createRelationship({
                                    familyId: activeFamilyId,
                                    fromPersonId: suggestion.from_person_id,
                                    toPersonId: suggestion.to_person_id,
                                    type: suggestion.relationship_type,
                                  });
                                  // Remove from suggestions list
                                  setCompletionSuggestions(prev => prev.filter((_, i) => i !== index));
                                  // Refresh topology
                                  await fetchTopologyData();
                                } catch (err) {
                                  console.error('Error creating suggested relationship:', err);
                                }
                              }}
                            >
                              Add
                            </Button>
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              ) : loadingCompletion ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Alert severity="info">
                  Click "Analyze Missing Relationships" to find relationship suggestions.
                </Alert>
              )}
            </CardContent>
          </Collapse>
        </Card>
      )}

      {/* Manage Relationships Card - Admin Only */}
      {isFamilyAdmin && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Manage Relationships"
            subheader="View and delete relationships"
            avatar={<AccountTreeIcon />}
          />
          <Divider />
          <CardContent>
            {loadingRelationships ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : relationships.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>From Person</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>To Person</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {relationships.map((rel) => (
                      <TableRow key={rel.id} hover>
                        <TableCell>
                          {rel.from_person ? `${rel.from_person.first_name} ${rel.from_person.last_name}` : `Person ${rel.from_person_id}`}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={rel.type.replace('_', ' ')}
                            size="small"
                            color={rel.type === 'PARENT_OF' ? 'primary' : 'secondary'}
                            icon={rel.type === 'PARENT_OF' ? <FamilyRestroomIcon /> : <WcIcon />}
                          />
                        </TableCell>
                        <TableCell>
                          {rel.to_person ? `${rel.to_person.first_name} ${rel.to_person.last_name}` : `Person ${rel.to_person_id}`}
                        </TableCell>
                        <TableCell>
                          {rel.created_at ? new Date(rel.created_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(rel)}
                            aria-label="delete relationship"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <AccountTreeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  No relationships yet.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Relationship</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError(null)}>
              {deleteError}
            </Alert>
          )}
          {relationshipToDelete && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to delete this relationship?
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>From:</strong>{' '}
                  {relationshipToDelete.from_person
                    ? `${relationshipToDelete.from_person.first_name} ${relationshipToDelete.from_person.last_name}`
                    : `Person ${relationshipToDelete.from_person_id}`}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Type:</strong> {relationshipToDelete.type.replace('_', ' ')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>To:</strong>{' '}
                  {relationshipToDelete.to_person
                    ? `${relationshipToDelete.to_person.first_name} ${relationshipToDelete.to_person.last_name}`
                    : `Person ${relationshipToDelete.to_person_id}`}
                </Typography>
                {relationshipToDelete.type === 'SPOUSE_OF' && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    This will delete both directions of the spouse relationship.
                  </Alert>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deletingRelationship}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deletingRelationship}
            startIcon={deletingRelationship ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deletingRelationship ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Nodes Card */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Family Members"
          subheader={`${topology?.nodes?.length || 0} person${topology?.nodes?.length !== 1 ? 's' : ''} in the family`}
          avatar={<PersonIcon />}
        />
        <Divider />
        <CardContent>
          {viewMode === 'graph' ? (
            <Box sx={{ height: '600px', width: '100%', position: 'relative' }}>
              <FamilyGraph
                topology={topology}
                viewerPersonId={viewerPersonId}
                currentUserPersonId={currentUserPersonId}
                edgeCreationMode={edgeCreationMode}
                onEdgeCreate={(fromPerson, toPerson) => {
                  setEdgeFromPerson(fromPerson);
                  setEdgeToPerson(toPerson);
                  setTypeSelectorOpen(true);
                }}
              />
            </Box>
          ) : (
            <>
              {loadingTopology ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : topology?.nodes && topology.nodes.length > 0 ? (
            (() => {
              const grouped = groupNodesByCategory(topology.nodes);
              
              const renderNodeCard = (node) => {
                const isViewer = node.id === viewerPersonId;
                const isCurrentUser = node.id === currentUserPersonId;
                const fullName = `${node.first_name || ''} ${node.last_name || ''}`.trim() || `Person ${node.id}`;
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={node.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        border: (isViewer || isCurrentUser) ? 2 : 1,
                        borderColor: (isViewer || isCurrentUser) ? 'primary.main' : 'divider',
                        backgroundColor: (isViewer || isCurrentUser) ? 'action.selected' : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: 2,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Avatar
                            sx={{
                              bgcolor: (isViewer || isCurrentUser) ? 'primary.main' : 'secondary.main',
                              width: 56,
                              height: 56,
                            }}
                          >
                            {getInitials(node)}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="h6" component="div">
                              {fullName}
                            </Typography>
                            {(isViewer || isCurrentUser) && (
                              <Chip label="You" size="small" color="primary" sx={{ mt: 0.5 }} />
                            )}
                          </Box>
                        </Box>
                        <Stack spacing={1}>
                          {node.relation_to_viewer && !isViewer && !isCurrentUser && (
                            <Chip
                              label={node.relation_to_viewer}
                              size="small"
                              color="info"
                              icon={<AccountTreeIcon />}
                            />
                          )}
                          {node.gender && node.gender !== 'UNKNOWN' && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <WcIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {node.gender}
                              </Typography>
                            </Box>
                          )}
                          {node.dob && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <CalendarIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {new Date(node.dob).toLocaleDateString()}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              };

              const renderCategory = (title, nodes, categoryKey, color = 'primary') => {
                if (nodes.length === 0) return null;
                
                return (
                  <Box sx={{ mb: 3 }} key={categoryKey}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        mb: 2,
                        cursor: 'pointer',
                        p: 1,
                        borderRadius: 1,
                        '&:hover': { backgroundColor: 'action.hover' },
                      }}
                      onClick={() => setExpandedCategories(prev => ({
                        ...prev,
                        [categoryKey]: !prev[categoryKey],
                      }))}
                    >
                      <Typography variant="subtitle1" fontWeight={600} color={`${color}.main`}>
                        {title} ({nodes.length})
                      </Typography>
                      {expandedCategories[categoryKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Box>
                    <Collapse in={expandedCategories[categoryKey]}>
                      <Grid container spacing={2}>
                        {nodes.map(renderNodeCard)}
                      </Grid>
                    </Collapse>
                  </Box>
                );
              };

              return (
                <>
                  {renderCategory('Immediate Family', grouped.immediate, 'immediate', 'primary')}
                  {renderCategory('Extended Family', grouped.extended, 'extended', 'secondary')}
                  {renderCategory('In-Laws', grouped.inlaws, 'inlaws', 'text')}
                </>
              );
            })()
          ) : (
            <Box textAlign="center" py={4}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                No persons yet.
              </Typography>
            </Box>
          )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edges Card */}
      <Card>
        <CardHeader
          title="Relationships"
          subheader={`${topology?.edges?.length || 0} relationship${topology?.edges?.length !== 1 ? 's' : ''} defined`}
          avatar={<AccountTreeIcon />}
        />
        <Divider />
        <CardContent>
          {loadingTopology ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : topology?.edges && topology.edges.length > 0 ? (
            <List>
              {topology.edges.map((edge, index) => {
                const fromPerson = personMap.get(edge.from);
                const toPerson = personMap.get(edge.to);
                return (
                  <ListItem
                    key={`${edge.from}-${edge.to}-${edge.type}-${index}`}
                    divider={index < topology.edges.length - 1}
                    sx={{
                      py: 2,
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getRelationshipColor(edge.type) + '.main' }}>
                        {getRelationshipIcon(edge.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="subtitle1" component="span" fontWeight={600}>
                            {getPersonName(edge.from)}
                          </Typography>
                          <ArrowForwardIcon fontSize="small" color="action" />
                          <Typography variant="subtitle1" component="span" fontWeight={600}>
                            {getPersonName(edge.to)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Chip
                          label={edge.type.replace('_', ' ')}
                          size="small"
                          color={getRelationshipColor(edge.type)}
                          icon={getRelationshipIcon(edge.type)}
                          sx={{ mt: 1 }}
                        />
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Box textAlign="center" py={4}>
              <AccountTreeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                No relationships yet.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Use the form above to add relationships between family members.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Topology;
