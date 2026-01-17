import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Chip,
  Stack,
} from '@mui/material';
import { Person as PersonIcon, Search as SearchIcon, AccountTree as AccountTreeIcon } from '@mui/icons-material';

/**
 * Step 1 or Step 3: Select Person
 * Allows user to select a person from the family with relationship context
 */
const StepSelectPerson = ({ 
  persons, 
  selectedPersonId, 
  onSelectPerson, 
  viewerPersonId, 
  searchTerm, 
  onSearchChange,
  topology,
  currentUserPersonId,
  stepContext, // 'step1' or 'step3' - for different display contexts
  selectedPersonFromStep1, // For step 3, show relationship to person from step 1
}) => {
  const getInitials = (person) => {
    const firstName = person?.first_name || '';
    const lastName = person?.last_name || '';
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    return '?';
  };

  const getPersonName = (person) => {
    return `${person.first_name || ''} ${person.last_name || ''}`.trim() || `Person ${person.id}`;
  };

  // Get relationship context for a person
  const getRelationshipContext = (personId) => {
    if (!topology?.nodes) return null;
    
    const node = topology.nodes.find(n => n.id === personId);
    if (!node) return null;
    
    const relationLabel = node.relation_to_viewer;
    if (!relationLabel || relationLabel === 'self' || relationLabel === 'unknown') return null;
    
    // Format relationship label
    if (relationLabel.toLowerCase().startsWith('your ')) {
      return relationLabel;
    }
    return `Your ${relationLabel}`;
  };

  // Get relationship to selected person from step 1 (for step 3)
  const getRelationshipToSelected = (personId) => {
    if (!topology || !selectedPersonFromStep1 || stepContext !== 'step3') return null;
    
    // Find relationship path between selectedPersonFromStep1 and personId
    // This is a simplified version - in a real implementation, you'd traverse the graph
    const node = topology.nodes.find(n => n.id === personId);
    if (!node) return null;
    
    // For now, we'll use the relation_to_viewer as a proxy
    // In a full implementation, you'd calculate the relationship between two specific people
    return null; // Placeholder - would need more complex relationship resolution
  };

  // Group persons by relationship category
  const groupPersonsByCategory = (personsList) => {
    if (!topology?.nodes) {
      return { immediate: personsList, extended: [], inlaws: [] };
    }

    const immediate = [];
    const extended = [];
    const inlaws = [];

    personsList.forEach((person) => {
      const relationLabel = getRelationshipContext(person.id)?.toLowerCase() || '';
      const node = topology.nodes.find(n => n.id === person.id);
      const relation = node?.relation_to_viewer?.toLowerCase() || '';

      if (
        relation.includes('father') ||
        relation.includes('mother') ||
        relation.includes('brother') ||
        relation.includes('sister') ||
        relation.includes('son') ||
        relation.includes('daughter') ||
        relation.includes('spouse') ||
        relation.includes('husband') ||
        relation.includes('wife') ||
        relation === 'self'
      ) {
        immediate.push(person);
      } else if (relation.includes('in-law') || relation.includes('in law')) {
        inlaws.push(person);
      } else {
        extended.push(person);
      }
    });

    return { immediate, extended, inlaws };
  };

  // Filter persons based on search term
  const filteredPersons = persons.filter(person => {
    if (!searchTerm) return true;
    const name = getPersonName(person).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const groupedPersons = groupPersonsByCategory(filteredPersons);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select a Person
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose the person you want to add a relationship for
      </Typography>

      <TextField
        fullWidth
        placeholder="Search by name..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {/* Render grouped persons */}
      {groupedPersons.immediate.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} color="primary.main" sx={{ mb: 2 }}>
            Immediate Family
          </Typography>
          <Grid container spacing={2}>
            {groupedPersons.immediate.map((person) => {
              const isSelected = selectedPersonId === person.id;
              const isCurrentUser = person.id === currentUserPersonId;
              const fullName = getPersonName(person);
              const relationContext = getRelationshipContext(person.id);

              return (
                <Grid item xs={12} sm={6} md={4} key={person.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: isSelected ? 2 : 1,
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      backgroundColor: isSelected ? 'action.selected' : 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => onSelectPerson(person.id)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Avatar
                          sx={{
                            bgcolor: isSelected ? 'primary.main' : 'secondary.main',
                            width: 56,
                            height: 56,
                          }}
                        >
                          {getInitials(person)}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {fullName}
                          </Typography>
                          {isCurrentUser && (
                            <Chip label="You" size="small" color="primary" sx={{ mt: 0.5 }} />
                          )}
                        </Box>
                        {isSelected && (
                          <PersonIcon color="primary" />
                        )}
                      </Box>
                      {relationContext && !isCurrentUser && (
                        <Chip
                          label={relationContext}
                          size="small"
                          color="info"
                          icon={<AccountTreeIcon />}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {groupedPersons.extended.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} color="secondary.main" sx={{ mb: 2 }}>
            Extended Family
          </Typography>
          <Grid container spacing={2}>
            {groupedPersons.extended.map((person) => {
              const isSelected = selectedPersonId === person.id;
              const isCurrentUser = person.id === currentUserPersonId;
              const fullName = getPersonName(person);
              const relationContext = getRelationshipContext(person.id);

              return (
                <Grid item xs={12} sm={6} md={4} key={person.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: isSelected ? 2 : 1,
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      backgroundColor: isSelected ? 'action.selected' : 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => onSelectPerson(person.id)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Avatar
                          sx={{
                            bgcolor: isSelected ? 'primary.main' : 'secondary.main',
                            width: 56,
                            height: 56,
                          }}
                        >
                          {getInitials(person)}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {fullName}
                          </Typography>
                          {isCurrentUser && (
                            <Chip label="You" size="small" color="primary" sx={{ mt: 0.5 }} />
                          )}
                        </Box>
                        {isSelected && (
                          <PersonIcon color="primary" />
                        )}
                      </Box>
                      {relationContext && !isCurrentUser && (
                        <Chip
                          label={relationContext}
                          size="small"
                          color="info"
                          icon={<AccountTreeIcon />}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {groupedPersons.inlaws.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 2 }}>
            In-Laws
          </Typography>
          <Grid container spacing={2}>
            {groupedPersons.inlaws.map((person) => {
              const isSelected = selectedPersonId === person.id;
              const isCurrentUser = person.id === currentUserPersonId;
              const fullName = getPersonName(person);
              const relationContext = getRelationshipContext(person.id);

              return (
                <Grid item xs={12} sm={6} md={4} key={person.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: isSelected ? 2 : 1,
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      backgroundColor: isSelected ? 'action.selected' : 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => onSelectPerson(person.id)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Avatar
                          sx={{
                            bgcolor: isSelected ? 'primary.main' : 'secondary.main',
                            width: 56,
                            height: 56,
                          }}
                        >
                          {getInitials(person)}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {fullName}
                          </Typography>
                          {isCurrentUser && (
                            <Chip label="You" size="small" color="primary" sx={{ mt: 0.5 }} />
                          )}
                        </Box>
                        {isSelected && (
                          <PersonIcon color="primary" />
                        )}
                      </Box>
                      {relationContext && !isCurrentUser && (
                        <Chip
                          label={relationContext}
                          size="small"
                          color="info"
                          icon={<AccountTreeIcon />}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {filteredPersons.length === 0 && (
        <Box textAlign="center" py={4}>
          <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? `No persons found matching "${searchTerm}"` : 'No persons available'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StepSelectPerson;
