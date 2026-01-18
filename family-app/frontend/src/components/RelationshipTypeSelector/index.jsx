import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
} from '@mui/material';
import {
  FamilyRestroom as FamilyRestroomIcon,
  Wc as WcIcon,
} from '@mui/icons-material';

/**
 * RelationshipTypeSelector Component
 * Quick dialog for selecting relationship type when creating an edge in the visual builder
 */
const RelationshipTypeSelector = ({
  open,
  onClose,
  fromPerson,
  toPerson,
  onConfirm,
}) => {
  const [relationshipType, setRelationshipType] = useState('PARENT_OF');
  const [direction, setDirection] = useState('forward'); // 'forward' or 'reverse' for PARENT_OF

  const handleConfirm = () => {
    if (relationshipType === 'PARENT_OF') {
      // For PARENT_OF, use direction to determine from/to
      const fromId = direction === 'forward' ? fromPerson.id : toPerson.id;
      const toId = direction === 'forward' ? toPerson.id : fromPerson.id;
      onConfirm({
        fromPersonId: fromId,
        toPersonId: toId,
        type: 'PARENT_OF',
      });
    } else {
      // For SPOUSE_OF, direction doesn't matter (bidirectional)
      onConfirm({
        fromPersonId: fromPerson.id,
        toPersonId: toPerson.id,
        type: 'SPOUSE_OF',
      });
    }
    onClose();
  };

  const getPersonName = (person) => {
    if (!person) {
      return 'Unknown Person';
    }
    return `${person.first_name || ''} ${person.last_name || ''}`.trim() || `Person ${person.id}`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Create Relationship
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            Create relationship between:
          </Typography>
          <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {getPersonName(fromPerson)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              and
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {getPersonName(toPerson)}
            </Typography>
          </Box>
        </Box>

        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">Relationship Type</FormLabel>
          <RadioGroup
            value={relationshipType}
            onChange={(e) => {
              setRelationshipType(e.target.value);
              // Reset direction when switching types
              if (e.target.value === 'SPOUSE_OF') {
                setDirection('forward');
              }
            }}
          >
            <FormControlLabel
              value="PARENT_OF"
              control={<Radio />}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <FamilyRestroomIcon fontSize="small" />
                  <span>Parent-Child Relationship</span>
                </Box>
              }
            />
            <FormControlLabel
              value="SPOUSE_OF"
              control={<Radio />}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <WcIcon fontSize="small" />
                  <span>Spouse Relationship</span>
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>

        {relationshipType === 'PARENT_OF' && (
          <Box sx={{ mt: 3 }}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">Direction</FormLabel>
              <RadioGroup
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
              >
                <FormControlLabel
                  value="forward"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2">
                        {getPersonName(fromPerson)} is parent of {getPersonName(toPerson)}
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="reverse"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2">
                        {getPersonName(toPerson)} is parent of {getPersonName(fromPerson)}
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Box>
        )}

        {relationshipType === 'SPOUSE_OF' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Spouse relationships are bidirectional - both directions will be created automatically.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
        >
          Create Relationship
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RelationshipTypeSelector;
