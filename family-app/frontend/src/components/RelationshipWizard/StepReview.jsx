import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
  FamilyRestroom as FamilyRestroomIcon,
  Wc as WcIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { getRelationshipDisplayName } from './relationshipIcons';
import { translateLabel } from '../../services/relationshipTranslator';

/**
 * Step 3: Review and Confirm
 * Shows summary of relationship to be created and edges that will be added
 */
const StepReview = ({ viewerId, targetId, label, topology, persons }) => {
  const getPersonName = (personId) => {
    // Try persons array first, then topology nodes
    let person = persons?.find(p => p.id === personId);
    if (!person && topology?.nodes) {
      person = topology.nodes.find(n => n.id === personId);
    }
    if (!person) return `Person ${personId}`;
    return `${person.first_name || ''} ${person.last_name || ''}`.trim() || `Person ${personId}`;
  };

  const viewerName = getPersonName(viewerId);
  const targetName = getPersonName(targetId);
  const displayLabel = getRelationshipDisplayName(label);

  // Translate label to edges
  const translation = translateLabel(label, viewerId, targetId, topology);

  const getEdgeIcon = (type) => {
    return type === 'PARENT_OF' ? <FamilyRestroomIcon /> : <WcIcon />;
  };

  const getEdgeColor = (type) => {
    return type === 'PARENT_OF' ? 'primary' : 'secondary';
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Relationship
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Confirm the details before creating this relationship
      </Typography>

      {/* Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Relationship Summary
          </Typography>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" sx={{ mt: 2 }}>
            <Chip 
              label={viewerName} 
              icon={<PersonIcon />} 
              color="primary" 
              variant="outlined"
            />
            <ArrowForwardIcon />
            <Chip 
              label={displayLabel} 
              color="info"
            />
            <ArrowForwardIcon />
            <Chip 
              label={targetName} 
              icon={<PersonIcon />} 
              color="secondary" 
              variant="outlined"
            />
          </Box>
          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
            "{targetName}" will be added as "{displayLabel}" to "{viewerName}"
          </Typography>
        </CardContent>
      </Card>

      {/* Edges to be Created */}
      {translation.edges.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Edges to be Created
            </Typography>
            <List>
              {translation.edges.map((edge, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      {getEdgeIcon(edge.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="body1" fontWeight={600}>
                            {getPersonName(edge.from)}
                          </Typography>
                          <ArrowForwardIcon fontSize="small" />
                          <Typography variant="body1" fontWeight={600}>
                            {getPersonName(edge.to)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Chip
                          label={edge.type.replace('_', ' ')}
                          size="small"
                          color={getEdgeColor(edge.type)}
                          icon={getEdgeIcon(edge.type)}
                          sx={{ mt: 1 }}
                        />
                      }
                    />
                  </ListItem>
                  {index < translation.edges.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Missing Persons Warning */}
      {translation.missingPersons.length > 0 && (
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Additional relationships needed:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {translation.missingPersons.map((mp, index) => (
              <li key={index}>
                <Typography variant="body2">
                  {mp.message}
                </Typography>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Warnings */}
      {translation.warnings.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {translation.warnings.map((warning, index) => (
            <Typography key={index} variant="body2">
              {warning}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Success Message */}
      {translation.edges.length > 0 && translation.missingPersons.length === 0 && (
        <Alert severity="success">
          Ready to create this relationship. Click "Create Relationship" to proceed.
        </Alert>
      )}
    </Box>
  );
};

export default StepReview;
