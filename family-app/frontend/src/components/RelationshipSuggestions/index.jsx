import React, { useState } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Chip,
  Divider,
} from '@mui/material';
import {
  Lightbulb as LightbulbIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { createRelationship } from '../../services/graph';

/**
 * RelationshipSuggestions Component
 * Displays suggestions for related relationships after creating a relationship
 */
const RelationshipSuggestions = ({
  open,
  onClose,
  familyId,
  suggestions,
  persons,
  onSuccess,
}) => {
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setSelectedSuggestions(suggestions.map((_, index) => index));
      setError(null);
    }
  }, [open, suggestions]);

  const getPersonName = (personId) => {
    const person = persons?.find(p => p.id === personId);
    if (!person) return `Person ${personId}`;
    return `${person.first_name || ''} ${person.last_name || ''}`.trim() || `Person ${personId}`;
  };

  const handleToggleSuggestion = (index) => {
    setSelectedSuggestions(prev => 
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleCreateSelected = async () => {
    if (selectedSuggestions.length === 0) {
      setError('Please select at least one suggestion');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      // Create each selected relationship
      for (const index of selectedSuggestions) {
        const suggestion = suggestions[index];
        
        // Skip informational suggestions (like IN_LAW_INFO)
        if (suggestion.relationship_type === 'IN_LAW_INFO') {
          continue;
        }

        await createRelationship({
          familyId,
          fromPersonId: suggestion.from_person_id,
          toPersonId: suggestion.to_person_id,
          type: suggestion.relationship_type,
        });
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Error creating suggested relationships:', err);
      setError(
        err.response?.data?.error || 'Failed to create some relationships. Please try again.'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleSkip}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <LightbulbIcon color="primary" />
          <Typography variant="h6">Relationship Suggestions</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {suggestions.length === 0 ? (
          <Alert severity="info">
            No additional relationship suggestions at this time.
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Based on the relationship you just created, here are some related relationships you might want to add:
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <List>
              {suggestions.map((suggestion, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <Checkbox
                      checked={selectedSuggestions.includes(index)}
                      onChange={() => handleToggleSuggestion(index)}
                      disabled={suggestion.relationship_type === 'IN_LAW_INFO'}
                    />
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="body1">
                            {getPersonName(suggestion.from_person_id)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            →
                          </Typography>
                          <Typography variant="body1">
                            {getPersonName(suggestion.to_person_id)}
                          </Typography>
                          <Chip
                            label={suggestion.relationship_type.replace('_', ' ')}
                            size="small"
                            color={suggestion.confidence === 'high' ? 'primary' : 'default'}
                          />
                          {suggestion.relationship_type === 'IN_LAW_INFO' && (
                            <Chip
                              label="Informational"
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {suggestion.reason}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < suggestions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleSkip} disabled={creating}>
          Skip
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={handleCreateSelected}
          variant="contained"
          disabled={creating || selectedSuggestions.length === 0}
          startIcon={creating ? <CircularProgress size={20} /> : <CheckCircleIcon />}
        >
          {creating ? 'Creating...' : `Create ${selectedSuggestions.length} Relationship${selectedSuggestions.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RelationshipSuggestions;
