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
const getPersonName = (person) => {
  if (typeof person === 'string') return person;
  return `${person?.first_name || ''} ${person?.last_name || ''}`.trim() || `Person ${person?.id}`;
};

const BulkFamilyUnit = ({
  open,
  onClose,
  familyId,
  persons,
  onSuccess,
}) => {
  // Parent 1 & 2: either person object (existing) or string (new name to create)
  const [parent1, setParent1] = useState(null);
  const [parent2, setParent2] = useState(null);
  const [parent1Input, setParent1Input] = useState(''); // current typed text (used on submit if value not set)
  const [parent2Input, setParent2Input] = useState('');
  const [selectedChildren, setSelectedChildren] = useState([]); // array of person | string
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setParent1(null);
      setParent2(null);
      setParent1Input('');
      setParent2Input('');
      setSelectedChildren([]);
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const parent1Id = parent1 && typeof parent1 === 'object' && parent1.id != null ? parent1.id : null;
  const parent2Id = parent2 && typeof parent2 === 'object' && parent2.id != null ? parent2.id : null;

  const handleCreate = async () => {
    const name1 = typeof parent1 === 'string' ? parent1.trim() : (parent1 ? null : parent1Input.trim());
    const name2 = typeof parent2 === 'string' ? parent2.trim() : (parent2 ? null : parent2Input.trim());
    const hasParent1 = (parent1 != null && (typeof parent1 === 'string' ? parent1.trim() : true)) || (parent1Input || '').trim();
    const hasParent2 = (parent2 != null && (typeof parent2 === 'string' ? parent2.trim() : true)) || (parent2Input || '').trim();
    if (!hasParent1 && !hasParent2) {
      setError('Please select or enter at least one parent');
      return;
    }
    const validChildren = selectedChildren.filter(c => (typeof c === 'string' ? c.trim() : c));
    if (validChildren.length === 0) {
      setError('Please select or enter at least one child');
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        familyId,
        parent1Id: parent1Id || null,
        parent2Id: parent2Id || null,
        parent1Name: name1 || undefined,
        parent2Name: name2 || undefined,
        childrenIds: validChildren.filter(c => typeof c === 'object').map(c => c.id),
        childrenNames: validChildren.filter(c => typeof c === 'string').map(s => s.trim()),
      };
      await createFamilyUnit(payload);

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
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

  const handleRemoveChild = (child) => {
    setSelectedChildren(prev => prev.filter(c => c !== child));
  };

  // Filter out already selected from available options (for dropdown)
  const availableChildren = persons.filter(
    p => !selectedChildren.some(c => typeof c === 'object' && c?.id === p.id) && p.id !== parent1Id && p.id !== parent2Id
  );

  // Preview: resolve display names and relationship count
  const relationshipsToCreate = [];
  if (parent1Id && parent2Id) {
    relationshipsToCreate.push({ type: 'SPOUSE_OF', from: parent1Id, to: parent2Id });
  }
  selectedChildren.forEach(child => {
    const childId = typeof child === 'object' && child?.id != null ? child.id : null;
    if (childId) {
      if (parent1Id) relationshipsToCreate.push({ type: 'PARENT_OF', from: parent1Id, to: childId });
      if (parent2Id) relationshipsToCreate.push({ type: 'PARENT_OF', from: parent2Id, to: childId });
    }
  });
  const newChildCount = selectedChildren.filter(c => typeof c === 'string').length;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
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
          <FamilyRestroomIcon color="primary" />
          <Typography variant="h6">Create Family Unit</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {success ? (
          <Alert severity="success" icon={<CheckCircleIcon />}>
            Family unit created successfully!
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

            {/* Parent 1: select existing or type name to create — press Enter to confirm typed name */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 0 }}>
              Parent 1 *
            </Typography>
            <Autocomplete
              freeSolo
              options={persons.filter(p => p.id !== parent2Id)}
              getOptionLabel={(option) => getPersonName(option)}
              value={parent1}
              onChange={(event, newValue) => setParent1(newValue ?? null)}
              onInputChange={(event, value) => setParent1Input(value ?? '')}
              filterOptions={(options, state) => {
                const input = (state.inputValue || '').trim();
                const filtered = input
                  ? options.filter((opt) =>
                      getPersonName(opt).toLowerCase().includes(input.toLowerCase())
                    )
                  : [...options];
                if (input && getPersonName(parent1) !== input) {
                  filtered.push(input);
                }
                return filtered;
              }}
              isOptionEqualToValue={(option, value) => {
                if (typeof option === 'string' && typeof value === 'string') return option === value;
                if (option?.id != null && value?.id != null) return option.id === value.id;
                return option === value;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select or type name, then press Enter (e.g. John Smith)"
                  variant="outlined"
                />
              )}
              sx={{ mb: 2 }}
            />

            {/* Parent 2: select existing or type name to create — press Enter to confirm typed name */}
            <Typography variant="subtitle2" gutterBottom>
              Parent 2 (Optional)
            </Typography>
            <Autocomplete
              freeSolo
              options={persons.filter(p => p.id !== parent1Id)}
              getOptionLabel={(option) => getPersonName(option)}
              value={parent2}
              onChange={(event, newValue) => setParent2(newValue ?? null)}
              onInputChange={(event, value) => setParent2Input(value ?? '')}
              filterOptions={(options, state) => {
                const input = (state.inputValue || '').trim();
                const filtered = input
                  ? options.filter((opt) =>
                      getPersonName(opt).toLowerCase().includes(input.toLowerCase())
                    )
                  : [...options];
                if (input && getPersonName(parent2) !== input) {
                  filtered.push(input);
                }
                return filtered;
              }}
              isOptionEqualToValue={(option, value) => {
                if (typeof option === 'string' && typeof value === 'string') return option === value;
                if (option?.id != null && value?.id != null) return option.id === value.id;
                return option === value;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select or type name, then press Enter"
                  variant="outlined"
                />
              )}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            {/* Children: select existing or type names to create */}
            <Typography variant="subtitle2" gutterBottom>
              Children *
            </Typography>
            <Autocomplete
              multiple
              freeSolo
              options={availableChildren}
              getOptionLabel={(option) => getPersonName(option)}
              value={selectedChildren}
              onChange={(event, newValue) => {
                setSelectedChildren(newValue);
              }}
              filterOptions={(options, state) => {
                const input = (state.inputValue || '').trim();
                const labelMatch = (opt) =>
                  getPersonName(opt).toLowerCase().includes(input.toLowerCase());
                const filtered = input
                  ? options.filter(labelMatch)
                  : [...options];
                if (input && !selectedChildren.some((c) => getPersonName(c) === input)) {
                  filtered.push(input);
                }
                return filtered;
              }}
              isOptionEqualToValue={(option, value) => {
                if (typeof option === 'string' && typeof value === 'string') return option === value;
                if (option?.id != null && value?.id != null) return option.id === value.id;
                return option === value;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select or type a name and press Enter to add (repeat for more)"
                  variant="outlined"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={typeof option === 'string' ? `name-${index}-${option}` : option.id}
                    label={getPersonName(option)}
                    onDelete={() => handleRemoveChild(option)}
                  />
                ))
              }
              sx={{ mb: 2 }}
            />

            {/* Preview */}
            {(relationshipsToCreate.length > 0 || newChildCount > 0) && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {relationshipsToCreate.length > 0
                    ? `Relationships to be created (${relationshipsToCreate.length})`
                    : ''}
                  {newChildCount > 0 && (
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      + {newChildCount} new person{newChildCount !== 1 ? 's' : ''} will be created
                    </Typography>
                  )}
                </Typography>
                {relationshipsToCreate.length > 0 && (
                  <List dense>
                    {relationshipsToCreate.map((rel, index) => {
                      const fromLabel = rel.from === parent1Id ? getPersonName(parent1) : getPersonName(parent2);
                      const toPerson = persons.find(p => p.id === rel.to);
                      const toChild = selectedChildren.find(c => typeof c === 'object' && c?.id === rel.to);
                      const toLabel = toPerson ? getPersonName(toPerson) : (toChild ? getPersonName(toChild) : `Person ${rel.to}`);
                      return (
                        <ListItem key={index}>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2">{fromLabel}</Typography>
                                <Typography variant="body2" color="text.secondary">→</Typography>
                                <Typography variant="body2">{toLabel}</Typography>
                                <Chip label={rel.type.replace('_', ' ')} size="small" color={rel.type === 'PARENT_OF' ? 'primary' : 'secondary'} />
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                )}
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
            disabled={creating || (!parent1 && !parent2) || selectedChildren.length === 0}
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
