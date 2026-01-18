import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Autocomplete,
  Divider,
  Paper,
  Stack,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  AccountTree as AccountTreeIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { createBulkRelationships } from '../../services/graph';
import { translateBulkRelationships, validateRelationship } from '../../services/relationshipTranslator';
import { relationshipCategories, getRelationshipDisplayName } from '../RelationshipWizard/relationshipIcons';

/**
 * BulkRelationshipInput Component
 * Allows creating multiple family relationships at once using user-friendly labels
 */
const BulkRelationshipInput = ({
  open,
  onClose,
  familyId,
  persons,
  topology,
  viewerPersonId,
  currentUserPersonId,
  onSuccess,
}) => {
  const [basePersonId, setBasePersonId] = useState(null);
  const [relationships, setRelationships] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Initialize base person when dialog opens
  useEffect(() => {
    if (open) {
      // Default to current user or viewer person
      const defaultPersonId = currentUserPersonId || viewerPersonId || (persons.length > 0 ? persons[0].id : null);
      setBasePersonId(defaultPersonId);
      setRelationships([]);
      setError(null);
      setSuccess(false);
      setValidationErrors({});
    }
  }, [open, currentUserPersonId, viewerPersonId, persons]);

  // Get all available relationship labels
  const allLabels = useMemo(() => {
    const labels = [];
    Object.values(relationshipCategories).forEach(category => {
      labels.push(...category.labels);
    });
    return labels;
  }, []);

  const getPersonName = (person) => {
    if (!person) return 'Unknown';
    return `${person.first_name || ''} ${person.last_name || ''}`.trim() || `Person ${person.id}`;
  };

  const handleAddRelationship = () => {
    setRelationships([...relationships, { label: '', targetId: null, id: Date.now() }]);
  };

  const handleRemoveRelationship = (id) => {
    setRelationships(relationships.filter(rel => rel.id !== id));
    // Remove validation error for this relationship
    const newErrors = { ...validationErrors };
    delete newErrors[id];
    setValidationErrors(newErrors);
  };

  const handleRelationshipChange = (id, field, value) => {
    setRelationships(relationships.map(rel => 
      rel.id === id ? { ...rel, [field]: value } : rel
    ));
    
    // Clear validation error when user changes the field
    if (validationErrors[id]) {
      const newErrors = { ...validationErrors };
      delete newErrors[id];
      setValidationErrors(newErrors);
    }
  };

  // Validate all relationships
  const validateAll = () => {
    if (!basePersonId) {
      setError('Please select a base person');
      return false;
    }

    if (relationships.length === 0) {
      setError('Please add at least one relationship');
      return false;
    }

    const errors = {};
    let hasErrors = false;

    relationships.forEach(rel => {
      if (!rel.label) {
        errors[rel.id] = 'Please select a relationship type';
        hasErrors = true;
      } else if (!rel.targetId) {
        errors[rel.id] = 'Please select a person';
        hasErrors = true;
      } else if (rel.targetId === basePersonId) {
        errors[rel.id] = 'Cannot create relationship to yourself';
        hasErrors = true;
      } else if (topology) {
        // Use existing validation
        const validation = validateRelationship(basePersonId, rel.targetId, rel.label, topology);
        if (!validation.valid) {
          errors[rel.id] = validation.errors.join('. ');
          hasErrors = true;
        }
      }
    });

    setValidationErrors(errors);
    return !hasErrors;
  };

  // Get preview of relationships to be created
  const getPreview = () => {
    if (!basePersonId || !topology || relationships.length === 0) {
      return { edges: [], missingPersons: [], warnings: [] };
    }

    const validRelationships = relationships.filter(rel => 
      rel.label && rel.targetId && rel.targetId !== basePersonId && !validationErrors[rel.id]
    );

    if (validRelationships.length === 0) {
      return { edges: [], missingPersons: [], warnings: [] };
    }

    const requests = validRelationships.map(rel => ({
      viewerId: basePersonId,
      targetId: rel.targetId,
      label: rel.label,
    }));

    return translateBulkRelationships(requests, topology);
  };

  const handleCreate = async () => {
    setError(null);

    if (!validateAll()) {
      return;
    }

    const validRelationships = relationships.filter(rel => 
      rel.label && rel.targetId && rel.targetId !== basePersonId && !validationErrors[rel.id]
    );

    if (validRelationships.length === 0) {
      setError('No valid relationships to create');
      return;
    }

    setCreating(true);

    try {
      const requests = validRelationships.map(rel => ({
        viewerId: basePersonId,
        targetId: rel.targetId,
        label: rel.label,
      }));

      const result = await createBulkRelationships({
        familyId,
        relationships: requests,
      });

      setSuccess(true);

      // Show success message briefly, then close
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error creating bulk relationships:', err);
      const errorMessage = err.response?.data?.error || 
        (err.response?.data?.failed && err.response.data.failed.length > 0
          ? `${err.response.data.failed.length} relationship(s) failed. ${err.response.data.failed.map(f => f.error).join('; ')}`
          : null) ||
        'Failed to create relationships. Please try again.';
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const preview = getPreview();
  const basePerson = persons.find(p => p.id === basePersonId);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '500px',
          bgcolor: 'background.paper',
          backdropFilter: 'none',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 6,
        },
      }}
      sx={{
        '& .MuiBackdrop-root': {
          bgcolor: 'rgba(10, 12, 16, 0.6)',
          backdropFilter: 'blur(2px)',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AccountTreeIcon color="primary" />
          <Typography variant="h6">Bulk Add Relationships</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {success ? (
          <Alert severity="success" icon={<CheckCircleIcon />}>
            Relationships created successfully! The family topology has been updated.
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add multiple family relationships at once. Select a base person and add their relationships to other family members.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Base Person Selection */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Base Person *</InputLabel>
              <Select
                value={basePersonId || ''}
                onChange={(e) => setBasePersonId(e.target.value)}
                label="Base Person *"
                disabled={creating}
              >
                {persons.map(person => (
                  <MenuItem key={person.id} value={person.id}>
                    {getPersonName(person)}
                    {person.id === currentUserPersonId && (
                      <Chip label="You" size="small" sx={{ ml: 1 }} />
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            {/* Relationship Rows */}
            <Box sx={{ mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Relationships ({relationships.length})
                </Typography>
                <Button
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={handleAddRelationship}
                  disabled={creating || !basePersonId}
                >
                  Add Relationship
                </Button>
              </Box>

              {relationships.length === 0 ? (
                <Alert severity="info">
                  Click "Add Relationship" to start adding relationships.
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {relationships.map((rel) => {
                    const error = validationErrors[rel.id];
                    const targetPerson = persons.find(p => p.id === rel.targetId);
                    
                    return (
                      <Paper key={rel.id} variant="outlined" sx={{ p: 2, bgcolor: error ? 'error.light' : 'background.paper' }}>
                        <Box display="flex" gap={2} alignItems="flex-start">
                          <FormControl sx={{ minWidth: 200, flex: 1 }}>
                            <InputLabel>Relationship Type</InputLabel>
                            <Select
                              value={rel.label || ''}
                              onChange={(e) => handleRelationshipChange(rel.id, 'label', e.target.value)}
                              label="Relationship Type"
                              disabled={creating}
                              error={!!error}
                            >
                              {allLabels.map(label => (
                                <MenuItem key={label} value={label}>
                                  {getRelationshipDisplayName(label)}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <Autocomplete
                            sx={{ minWidth: 200, flex: 1 }}
                            options={persons.filter(p => p.id !== basePersonId)}
                            getOptionLabel={(option) => getPersonName(option)}
                            value={targetPerson || null}
                            onChange={(event, newValue) => {
                              handleRelationshipChange(rel.id, 'targetId', newValue?.id || null);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Person"
                                error={!!error}
                                disabled={creating}
                              />
                            )}
                          />

                          <IconButton
                            onClick={() => handleRemoveRelationship(rel.id)}
                            disabled={creating}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>

                        {error && (
                          <Alert severity="error" sx={{ mt: 1 }} icon={<ErrorIcon />}>
                            {error}
                          </Alert>
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Box>

            {/* Preview Section */}
            {basePersonId && relationships.length > 0 && preview.edges.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Preview: Relationships to be created ({preview.edges.length})
                  </Typography>
                  <List dense>
                    {preview.edges.map((edge, index) => {
                      const fromPerson = persons.find(p => p.id === edge.from);
                      const toPerson = persons.find(p => p.id === edge.to);
                      return (
                        <ListItem key={index}>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2">
                                  {fromPerson ? getPersonName(fromPerson) : `Person ${edge.from}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">→</Typography>
                                <Typography variant="body2">
                                  {toPerson ? getPersonName(toPerson) : `Person ${edge.to}`}
                                </Typography>
                                <Chip
                                  label={edge.type.replace('_', ' ')}
                                  size="small"
                                  color={edge.type === 'PARENT_OF' ? 'primary' : 'secondary'}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              </>
            )}

            {/* Missing Persons Warnings */}
            {preview.missingPersons.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }} icon={<WarningIcon />}>
                <Typography variant="subtitle2" gutterBottom>
                  Missing Intermediate Persons:
                </Typography>
                <List dense>
                  {preview.missingPersons.map((mp, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={mp.message}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {/* Warnings */}
            {preview.warnings.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Warnings:
                </Typography>
                <List dense>
                  {preview.warnings.map((w, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={w.message}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={creating || success}>
          {success ? 'Close' : 'Cancel'}
        </Button>
        {!success && (
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={creating || !basePersonId || relationships.length === 0}
            startIcon={creating ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {creating ? 'Creating...' : `Create ${relationships.filter(r => r.label && r.targetId).length} Relationship(s)`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkRelationshipInput;
