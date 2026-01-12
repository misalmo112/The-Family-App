import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useFamily } from '../context/FamilyContext';
import { getPersons, getTopology } from '../services/graph';

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

  // Fetch topology when viewerPersonId changes
  useEffect(() => {
    if (!activeFamilyId || !viewerPersonId) {
      setTopology(null);
      return;
    }

    const fetchTopology = async () => {
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
    };

    fetchTopology();
  }, [activeFamilyId, viewerPersonId]);

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
      <Typography variant="h4" component="h1" gutterBottom>
        Topology
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Viewer Selection Card */}
      <Card sx={{ mb: 3 }}>
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

      {/* Nodes Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Nodes
          </Typography>
          {loadingTopology ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          ) : topology?.nodes && topology.nodes.length > 0 ? (
            <List>
              {topology.nodes.map((node) => (
                <ListItem key={node.id} divider>
                  <ListItemText
                    primary={`${node.first_name || ''} ${node.last_name || ''}`.trim() || `Person ${node.id}`}
                    secondary={
                      <Box>
                        {node.relation_to_viewer && (
                          <Chip
                            label={node.relation_to_viewer}
                            size="small"
                            sx={{ mr: 1, mb: 0.5 }}
                          />
                        )}
                        {node.gender && node.gender !== 'UNKNOWN' && (
                          <Chip
                            label={node.gender}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1, mb: 0.5 }}
                          />
                        )}
                        {node.dob && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            DOB: {new Date(node.dob).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No persons yet.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Edges Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Relationships (Edges)
          </Typography>
          {loadingTopology ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          ) : topology?.edges && topology.edges.length > 0 ? (
            <List>
              {topology.edges.map((edge, index) => (
                <ListItem key={`${edge.from}-${edge.to}-${edge.type}-${index}`} divider>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography component="span">
                          {getPersonName(edge.from)} → {getPersonName(edge.to)}
                        </Typography>
                        <Chip label={edge.type} size="small" color="primary" />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No relationships yet.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Topology;
