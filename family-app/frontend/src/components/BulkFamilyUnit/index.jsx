import React, { useState, useEffect } from 'react';
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
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Autocomplete,
  Divider,
} from '@mui/material';
import {
  FamilyRestroom as FamilyRestroomIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { createFamilyUnit } from '../../services/graph';

/**
 * BulkFamilyUnit Component
 * Allows creating an entire family unit (parents + children) in one operation
 */
const BulkFamilyUnit = ({
  open,
  onClose,
  familyId,
  persons,
  onSuccess,
}) => {
  const [parent1Id, setParent1Id] = useState(null);
  const [parent2Id, setParent2Id] = useState(null);
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setParent1Id(null);
      setParent2Id(null);
      setSelectedChildren([]);
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!parent1Id && !parent2Id) {
      setError('Please select at least one parent');
      return;
    }

    if (selectedChildren.length === 0) {
      setError('Please select at least one child');
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await createFamilyUnit({
        familyId,
        parent1Id: parent1Id || null,
        parent2Id: parent2Id || null,
        childrenIds: selectedChildren.map(c => c.id),
      });

      setSuccess(true);
      
      // Show success message briefly, then close
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error creating family unit:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.errors?.join?.('\n') ||
        'Failed to create family unit. Please try again.'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveChild = (childId) => {
    setSelectedChildren(prev => prev.filter(c => c.id !== childId));
  };

  const getPersonName = (person) => {
    return `${person.first_name || ''} ${person.last_name || ''}`.trim() || `Person ${person.id}`;
  };

  // Filter out already selected children from available options
  const availableChildren = persons.filter(
    p => !selectedChildren.some(c => c.id === p.id) && p.id !== parent1Id && p.id !== parent2Id
  );

  // Calculate relationships to be created
  const relationshipsToCreate = [];
  if (parent1Id && parent2Id) {
    relationshipsToCreate.push({ type: 'SPOUSE_OF', from: parent1Id, to: parent2Id });
  }
  selectedChildren.forEach(child => {
    if (parent1Id) {
      relationshipsToCreate.push({ type: 'PARENT_OF', from: parent1Id, to: child.id });
    }
    if (parent2Id) {
      relationshipsToCreate.push({ type: 'PARENT_OF', from: parent2Id, to: child.id });
    }
  });

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <FamilyRestroomIcon color="primary" />
          <Typography variant="h6">Create Family Unit</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {success ? (
          <Alert severity="success" icon={<CheckCircleIcon />}>
            Family unit created successfully! Created {relationshipsToCreate.length} relationship(s).
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create an entire family unit by selecting parents and children. All relationships will be created in one operation.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Parent 1 Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Parent 1 *</InputLabel>
              <Select
                value={parent1Id || ''}
                onChange={(e) => setParent1Id(e.target.value)}
                label="Parent 1 *"
              >
                {persons
                  .filter(p => p.id !== parent2Id)
                  .map(person => (
                    <MenuItem key={person.id} value={person.id}>
                      {getPersonName(person)}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {/* Parent 2 Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Parent 2 (Optional)</InputLabel>
              <Select
                value={parent2Id || ''}
                onChange={(e) => setParent2Id(e.target.value || null)}
                label="Parent 2 (Optional)"
              >
                <MenuItem value="">None</MenuItem>
                {persons
                  .filter(p => p.id !== parent1Id)
                  .map(person => (
                    <MenuItem key={person.id} value={person.id}>
                      {getPersonName(person)}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            {/* Children Selection */}
            <Typography variant="subtitle2" gutterBottom>
              Children *
            </Typography>
            <Autocomplete
              multiple
              options={availableChildren}
              getOptionLabel={(option) => getPersonName(option)}
              value={selectedChildren}
              onChange={(event, newValue) => {
                setSelectedChildren(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select children"
                  variant="outlined"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={getPersonName(option)}
                    onDelete={() => handleRemoveChild(option.id)}
                  />
                ))
              }
              sx={{ mb: 2 }}
            />

            {/* Preview */}
            {relationshipsToCreate.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Relationships to be created ({relationshipsToCreate.length}):
                </Typography>
                <List dense>
                  {relationshipsToCreate.map((rel, index) => {
                    const fromPerson = persons.find(p => p.id === rel.from);
                    const toPerson = persons.find(p => p.id === rel.to);
                    return (
                      <ListItem key={index}>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">
                                {fromPerson ? getPersonName(fromPerson) : `Person ${rel.from}`}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                →
                              </Typography>
                              <Typography variant="body2">
                                {toPerson ? getPersonName(toPerson) : `Person ${rel.to}`}
                              </Typography>
                              <Chip
                                label={rel.type.replace('_', ' ')}
                                size="small"
                                color={rel.type === 'PARENT_OF' ? 'primary' : 'secondary'}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
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
            disabled={creating || (!parent1Id && !parent2Id) || selectedChildren.length === 0}
            startIcon={creating ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {creating ? 'Creating...' : 'Create Family Unit'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkFamilyUnit;
