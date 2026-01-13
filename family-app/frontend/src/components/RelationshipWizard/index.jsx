import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Alert,
  CircularProgress,
  Typography,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Label as LabelIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import StepSelectPerson from './StepSelectPerson';
import StepSelectLabel from './StepSelectLabel';
import StepReview from './StepReview';
import { translateLabel, validateRelationship } from '../../services/relationshipTranslator';
import { createRelationship } from '../../services/graph';

const steps = [
  { label: 'Select Person', icon: PersonIcon },
  { label: 'Choose Relationship', icon: LabelIcon },
  { label: 'Select Other Person', icon: PersonIcon },
  { label: 'Review', icon: PreviewIcon },
];

/**
 * Relationship Wizard Component
 * Guides users through creating relationships using human-readable labels
 */
const RelationshipWizard = ({ 
  open, 
  onClose, 
  familyId, 
  persons, 
  topology, 
  viewerPersonId,
  onSuccess 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [targetPersonId, setTargetPersonId] = useState(null);
  const [searchTerm1, setSearchTerm1] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [disabledLabels, setDisabledLabels] = useState([]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setSelectedPersonId(viewerPersonId || (persons.length > 0 ? persons[0].id : null));
      setSelectedLabel(null);
      setTargetPersonId(null);
      setSearchTerm1('');
      setSearchTerm2('');
      setError(null);
      setDisabledLabels([]);
    }
  }, [open, viewerPersonId, persons]);

  // Update disabled labels when person selection changes
  useEffect(() => {
    if (selectedPersonId && topology) {
      const disabled = [];
      // Check max parents
      const existingParents = topology.edges.filter(
        e => e.to === selectedPersonId && e.type === 'PARENT_OF'
      );
      if (existingParents.length >= 2) {
        disabled.push('father', 'mother');
      }
      setDisabledLabels(disabled);
    }
  }, [selectedPersonId, topology]);

  const handleNext = () => {
    setError(null);
    
    if (activeStep === 0 && !selectedPersonId) {
      setError('Please select a person');
      return;
    }
    
    if (activeStep === 1 && !selectedLabel) {
      setError('Please select a relationship type');
      return;
    }
    
    if (activeStep === 2 && !targetPersonId) {
      setError('Please select the other person');
      return;
    }

    if (activeStep === 3) {
      handleSubmit();
      return;
    }

    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePersonSelect = (personId) => {
    setSelectedPersonId(personId);
    setError(null);
  };

  const handleLabelSelect = (label) => {
    setSelectedLabel(label);
    setError(null);
  };

  const handleTargetSelect = (personId) => {
    setTargetPersonId(personId);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedPersonId || !targetPersonId || !selectedLabel) {
      setError('Missing required information');
      return;
    }

    // Validate relationship
    const validation = validateRelationship(
      selectedPersonId,
      targetPersonId,
      selectedLabel,
      topology
    );

    if (!validation.valid) {
      setError(validation.errors.join('. '));
      return;
    }

    // Translate label to edges
    const translation = translateLabel(
      selectedLabel,
      selectedPersonId,
      targetPersonId,
      topology
    );

    if (translation.missingPersons.length > 0) {
      setError(translation.missingPersons.map(mp => mp.message).join('. '));
      return;
    }

    if (translation.edges.length === 0) {
      setError('No edges to create. This relationship may already exist.');
      return;
    }

    // Create relationships
    setSubmitting(true);
    setError(null);

    try {
      // Create each edge sequentially
      for (const edge of translation.edges) {
        await createRelationship({
          familyId,
          fromPersonId: edge.from,
          toPersonId: edge.to,
          type: edge.type,
        });
      }

      // Success
      if (onSuccess) {
        onSuccess();
      }
      handleClose();
    } catch (err) {
      console.error('Error creating relationship:', err);
      if (err.response) {
        if (err.response.status === 403) {
          setError('Only family admins can create relationships.');
        } else {
          setError(err.response.data?.error || 'Failed to create relationship. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setActiveStep(0);
      setSelectedPersonId(null);
      setSelectedLabel(null);
      setTargetPersonId(null);
      setError(null);
      onClose();
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <StepSelectPerson
            persons={persons}
            selectedPersonId={selectedPersonId}
            onSelectPerson={handlePersonSelect}
            viewerPersonId={viewerPersonId}
            searchTerm={searchTerm1}
            onSearchChange={setSearchTerm1}
          />
        );
      
      case 1:
        return (
          <StepSelectLabel
            selectedLabel={selectedLabel}
            onSelectLabel={handleLabelSelect}
            disabledLabels={disabledLabels}
            topology={topology}
            viewerId={selectedPersonId}
            targetId={targetPersonId}
          />
        );
      
      case 2:
        return (
          <StepSelectPerson
            persons={persons.filter(p => p.id !== selectedPersonId)}
            selectedPersonId={targetPersonId}
            onSelectPerson={handleTargetSelect}
            viewerPersonId={viewerPersonId}
            searchTerm={searchTerm2}
            onSearchChange={setSearchTerm2}
          />
        );
      
      case 3:
        return (
          <StepReview
            viewerId={selectedPersonId}
            targetId={targetPersonId}
            label={selectedLabel}
            topology={topology}
            persons={persons}
          />
        );
      
      default:
        return null;
    }
  };

  const getStepLabel = (step) => {
    if (step === 0) return 'Select Person';
    if (step === 1) return 'Choose Relationship';
    if (step === 2) return 'Select Other Person';
    if (step === 3) return 'Review';
    return '';
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h5">Add Relationship</Typography>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <Step key={index}>
                <StepLabel 
                  StepIconComponent={(props) => <StepIcon {...props} />}
                >
                  {step.label}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ minHeight: '300px' }}>
          {renderStepContent()}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={submitting}>
            Back
          </Button>
        )}
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
        >
          {activeStep === steps.length - 1
            ? submitting
              ? 'Creating...'
              : 'Create Relationship'
            : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RelationshipWizard;
