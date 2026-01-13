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
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Grid,
  Divider,
  Stack,
} from '@mui/material';
import {
  Person as PersonIcon,
  AccountTree as AccountTreeIcon,
  AddLink as AddLinkIcon,
  ArrowForward as ArrowForwardIcon,
  FamilyRestroom as FamilyRestroomIcon,
  Wc as WcIcon,
  CalendarToday as CalendarIcon,
  AutoAwesome as AutoAwesomeIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useFamily } from '../context/FamilyContext';
import { getPersons, getTopology, createRelationship } from '../services/graph';
import RelationshipWizard from '../components/RelationshipWizard';

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
        
        // Default to first person if viewer not set
        if (data && data.length > 0 && !viewerPersonId) {
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
  }, [activeFamilyId]);

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

      {/* Viewer Selection Card */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Select Viewer"
          subheader="Choose a person to view the family tree from their perspective"
          avatar={<PersonIcon />}
        />
        <CardContent>
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
        </CardContent>
      </Card>

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
        onSuccess={async () => {
          // Refetch topology after successful relationship creation
          await fetchTopologyData();
        }}
      />

      {/* Nodes Card */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Family Members"
          subheader={`${topology?.nodes?.length || 0} person${topology?.nodes?.length !== 1 ? 's' : ''} in the family`}
          avatar={<PersonIcon />}
        />
        <Divider />
        <CardContent>
          {loadingTopology ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : topology?.nodes && topology.nodes.length > 0 ? (
            <Grid container spacing={2}>
              {topology.nodes.map((node) => {
                const isViewer = node.id === viewerPersonId;
                const fullName = `${node.first_name || ''} ${node.last_name || ''}`.trim() || `Person ${node.id}`;
                return (
                  <Grid item xs={12} sm={6} md={4} key={node.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        border: isViewer ? 2 : 1,
                        borderColor: isViewer ? 'primary.main' : 'divider',
                        backgroundColor: isViewer ? 'action.selected' : 'background.paper',
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
                              bgcolor: isViewer ? 'primary.main' : 'secondary.main',
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
                            {isViewer && (
                              <Chip label="You" size="small" color="primary" sx={{ mt: 0.5 }} />
                            )}
                          </Box>
                        </Box>
                        <Stack spacing={1}>
                          {node.relation_to_viewer && !isViewer && (
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
              })}
            </Grid>
          ) : (
            <Box textAlign="center" py={4}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                No persons yet.
              </Typography>
            </Box>
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
