import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Tooltip,
  IconButton,
  Alert,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { relationshipCategories, getRelationshipIcon, getRelationshipDisplayName } from './relationshipIcons';

/**
 * Step 2: Select Relationship Label
 * Visual picker for relationship labels organized by category
 */
const StepSelectLabel = ({ 
  selectedLabel, 
  onSelectLabel, 
  disabledLabels = [],
  topology,
  viewerId,
  targetId,
}) => {
  const isLabelDisabled = (label) => {
    return disabledLabels.includes(label.toLowerCase());
  };

  const getLabelTooltip = (label) => {
    const tooltips = {
      father: 'Creates: Target → Viewer (PARENT_OF)',
      mother: 'Creates: Target → Viewer (PARENT_OF)',
      son: 'Creates: Viewer → Target (PARENT_OF)',
      daughter: 'Creates: Viewer → Target (PARENT_OF)',
      husband: 'Creates: Viewer ↔ Target (SPOUSE_OF)',
      wife: 'Creates: Viewer ↔ Target (SPOUSE_OF)',
      spouse: 'Creates: Viewer ↔ Target (SPOUSE_OF)',
      brother: 'Requires: Shared parent between viewer and target',
      sister: 'Requires: Shared parent between viewer and target',
      grandfather: 'Requires: Viewer → Parent → Grandparent chain',
      grandmother: 'Requires: Viewer → Parent → Grandparent chain',
      grandson: 'Requires: Viewer → Child → Grandchild chain',
      granddaughter: 'Requires: Viewer → Child → Grandchild chain',
      uncle: 'Requires: Viewer → Parent → Grandparent → Parent\'s sibling',
      aunt: 'Requires: Viewer → Parent → Grandparent → Parent\'s sibling',
      nephew: 'Requires: Viewer → Parent → Sibling → Sibling\'s child',
      niece: 'Requires: Viewer → Parent → Sibling → Sibling\'s child',
      cousin: 'Requires: Viewer → Parent → Grandparent → Parent\'s sibling → Cousin',
      'father-in-law': 'Requires: Viewer → Spouse → Spouse\'s Father',
      'mother-in-law': 'Requires: Viewer → Spouse → Spouse\'s Mother',
    };
    return tooltips[label.toLowerCase()] || 'Select this relationship type';
  };

  const renderLabelCard = (label, category) => {
    const Icon = getRelationshipIcon(label);
    const displayName = getRelationshipDisplayName(label);
    const disabled = isLabelDisabled(label);
    const isSelected = selectedLabel?.toLowerCase() === label.toLowerCase();

    return (
      <Grid item xs={6} sm={4} md={3} key={label}>
        <Tooltip title={getLabelTooltip(label)} arrow>
          <Card
            sx={{
              cursor: disabled ? 'not-allowed' : 'pointer',
              border: isSelected ? 2 : 1,
              borderColor: isSelected ? `${category.color}.main` : 'divider',
              backgroundColor: disabled 
                ? 'action.disabledBackground' 
                : isSelected 
                  ? `${category.color}.light` 
                  : 'background.paper',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.2s',
              '&:hover': disabled ? {} : {
                boxShadow: 4,
                transform: 'translateY(-2px)',
                borderColor: `${category.color}.main`,
              },
            }}
            onClick={() => !disabled && onSelectLabel(label)}
          >
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                <Icon 
                  sx={{ 
                    fontSize: 40, 
                    color: disabled ? 'text.disabled' : `${category.color}.main` 
                  }} 
                />
                <Typography 
                  variant="body2" 
                  fontWeight={isSelected ? 600 : 400}
                  color={disabled ? 'text.disabled' : 'text.primary'}
                  textAlign="center"
                >
                  {displayName}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Tooltip>
      </Grid>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose Relationship Type
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select how these two people are related
      </Typography>

      {Object.values(relationshipCategories).map((category) => (
        <Box key={category.title} sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: `${category.color}.main` }}>
            {category.title}
          </Typography>
          <Grid container spacing={2}>
            {category.labels.map((label) => renderLabelCard(label, category))}
          </Grid>
        </Box>
      ))}

      {selectedLabel && (
        <Alert severity="info" sx={{ mt: 3 }}>
          Selected: <strong>{getRelationshipDisplayName(selectedLabel)}</strong>
          <br />
          <Typography variant="caption">
            {getLabelTooltip(selectedLabel)}
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default StepSelectLabel;
