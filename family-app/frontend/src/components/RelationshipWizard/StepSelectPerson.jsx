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
} from '@mui/material';
import { Person as PersonIcon, Search as SearchIcon } from '@mui/icons-material';

/**
 * Step 1: Select Person
 * Allows user to select a person from the family
 */
const StepSelectPerson = ({ persons, selectedPersonId, onSelectPerson, viewerPersonId, searchTerm, onSearchChange }) => {
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

  // Filter persons based on search term
  const filteredPersons = persons.filter(person => {
    if (!searchTerm) return true;
    const name = getPersonName(person).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

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

      <Grid container spacing={2}>
        {filteredPersons.map((person) => {
          const isSelected = selectedPersonId === person.id;
          const isViewer = person.id === viewerPersonId;
          const fullName = getPersonName(person);

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
                  <Box display="flex" alignItems="center" gap={2}>
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
                      {isViewer && (
                        <Typography variant="caption" color="primary">
                          (You)
                        </Typography>
                      )}
                    </Box>
                    {isSelected && (
                      <PersonIcon color="primary" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredPersons.length === 0 && (
        <Box textAlign="center" py={4}>
          <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            No persons found matching "{searchTerm}"
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StepSelectPerson;
