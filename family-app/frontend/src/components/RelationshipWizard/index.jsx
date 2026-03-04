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
import RelationshipSuggestions from '../RelationshipSuggestions';
import { translateLabel, validateRelationship } from '../../services/relationshipTranslator';
import { createRelationship, getRelationshipSuggestions } from '../../services/graph';

// Step labels - will be adjusted based on admin status
const getSteps = (isAdmin) => {
  if (isAdmin) {
    return [
      { label: 'Who is adding the relationship?', icon: PersonIcon },
      { label: 'How are they related?', icon: LabelIcon },
      { label: 'Who is the other person?', icon: PersonIcon },
      { label: 'Confirm Relationship', icon: PreviewIcon },
    ];
  } else {
    return [
      { label: 'How are you related?', icon: LabelIcon },
      { label: 'Who is the other person?', icon: PersonIcon },
      { label: 'Confirm Relationship', icon: PreviewIcon },
    ];
  }
};

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
  currentUserPersonId,
  isAdmin,
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
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [lastCreatedRelationship, setLastCreatedRelationship] = useState(null);

  // Get steps based on admin status
  const steps = getSteps(isAdmin);
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      // For regular users, start at step 0 (which is step 2 in the original flow)
      // For admins, start at step 0 (step 1 in original flow)
      setActiveStep(0);
      
      // Auto-set selected person for regular users
      if (!isAdmin && currentUserPersonId) {
        setSelectedPersonId(currentUserPersonId);
      } else {
        setSelectedPersonId(viewerPersonId || (persons.length > 0 ? persons[0].id : null));
      }
      
      setSelectedLabel(null);
      setTargetPersonId(null);
      setSearchTerm1('');
      setSearchTerm2('');
      setError(null);
      setDisabledLabels([]);
      setSuggestionsOpen(false);
      setSuggestions([]);
      setLastCreatedRelationship(null);
    }
  }, [open, viewerPersonId, persons, isAdmin, currentUserPersonId]);

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
    
    // Adjust step indices based on admin status
    const step1Index = isAdmin ? 0 : -1; // Step 1 only exists for admins
    const step2Index = isAdmin ? 1 : 0; // Choose relationship
    const step3Index = isAdmin ? 2 : 1; // Select other person
    const step4Index = isAdmin ? 3 : 2; // Review
    
    if (activeStep === step1Index && !selectedPersonId) {
      setError('Please select a person');
      return;
    }
    
    if (activeStep === step2Index && !selectedLabel) {
      setError('Please select a relationship type');
      return;
    }
    
    if (activeStep === step3Index && !targetPersonId) {
      setError('Please select the other person');
      return;
    }

    if (activeStep === step4Index) {
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
      // Create each edge sequentially (pass label so backend can set gender for grandmother, uncle, etc.)
      let lastEdge = null;
      for (const edge of translation.edges) {
        await createRelationship({
          familyId,
          fromPersonId: edge.from,
          toPersonId: edge.to,
          type: edge.type,
          ...(selectedLabel && { label: selectedLabel }),
        });
        lastEdge = edge;
      }

      // Store last created relationship for suggestions
      if (lastEdge) {
        setLastCreatedRelationship({
          fromPersonId: lastEdge.from,
          toPersonId: lastEdge.to,
          type: lastEdge.type,
        });
      }

      // Fetch suggestions for the last created relationship
      if (lastEdge) {
        try {
          const fetchedSuggestions = await getRelationshipSuggestions({
            familyId,
            fromPersonId: lastEdge.from,
            toPersonId: lastEdge.to,
            type: lastEdge.type,
          });
          
          if (fetchedSuggestions && fetchedSuggestions.length > 0) {
            setSuggestions(fetchedSuggestions);
            setSuggestionsOpen(true);
            // Don't close wizard yet - wait for user to handle suggestions
            return;
          }
        } catch (suggestionErr) {
          console.error('Error fetching suggestions:', suggestionErr);
          // Continue with normal flow if suggestions fail
        }
      }

      // Success - no suggestions or suggestions failed
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
    if (!submitting && !suggestionsOpen) {
      setActiveStep(0);
      setSelectedPersonId(null);
      setSelectedLabel(null);
      setTargetPersonId(null);
      setError(null);
      setSuggestionsOpen(false);
      setSuggestions([]);
      setLastCreatedRelationship(null);
      onClose();
    }
  };

  const handleSuggestionsClose = () => {
    setSuggestionsOpen(false);
    setSuggestions([]);
    if (onSuccess) {
      onSuccess();
    }
    handleClose();
  };

  const handleSuggestionsSuccess = () => {
    setSuggestionsOpen(false);
    setSuggestions([]);
    if (onSuccess) {
      onSuccess();
    }
    handleClose();
  };

  const renderStepContent = () => {
    // Adjust step indices based on admin status
    const step1Index = isAdmin ? 0 : -1; // Step 1 only exists for admins
    const step2Index = isAdmin ? 1 : 0; // Choose relationship
    const step3Index = isAdmin ? 2 : 1; // Select other person
    const step4Index = isAdmin ? 3 : 2; // Review
    
    if (activeStep === step1Index) {
      // Step 1: Select Person (Admin only)
      return (
        <StepSelectPerson
          persons={persons}
          selectedPersonId={selectedPersonId}
          onSelectPerson={handlePersonSelect}
          viewerPersonId={viewerPersonId}
          searchTerm={searchTerm1}
          onSearchChange={setSearchTerm1}
          topology={topology}
          currentUserPersonId={currentUserPersonId}
          stepContext="step1"
        />
      );
    }
    
    if (activeStep === step2Index) {
      // Step 2: Choose Relationship
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
    }
    
    if (activeStep === step3Index) {
      // Step 3: Select Other Person
      return (
        <StepSelectPerson
          persons={persons.filter(p => p.id !== selectedPersonId)}
          selectedPersonId={targetPersonId}
          onSelectPerson={handleTargetSelect}
          viewerPersonId={viewerPersonId}
          searchTerm={searchTerm2}
          onSearchChange={setSearchTerm2}
          topology={topology}
          currentUserPersonId={currentUserPersonId}
          stepContext="step3"
          selectedPersonFromStep1={selectedPersonId}
        />
      );
    }
    
    if (activeStep === step4Index) {
      // Step 4: Review
      return (
        <StepReview
          viewerId={selectedPersonId}
          targetId={targetPersonId}
          label={selectedLabel}
          topology={topology}
          persons={persons}
        />
      );
    }
    
    return null;
  };

  const getStepLabel = (step) => {
    if (step < steps.length) {
      return steps[step].label;
    }
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

      {/* Relationship Suggestions Dialog */}
      <RelationshipSuggestions
        open={suggestionsOpen}
        onClose={handleSuggestionsClose}
        familyId={familyId}
        suggestions={suggestions}
        persons={persons}
        onSuccess={handleSuggestionsSuccess}
      />
    </Dialog>
  );
};

export default RelationshipWizard;
