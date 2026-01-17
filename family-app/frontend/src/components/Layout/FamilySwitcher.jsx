import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { useFamily } from '../../context/FamilyContext';
import { getFamilies } from '../../services/families';

/**
 * FamilySwitcher Component
 * Displays current active family and allows quick switching
 */
const FamilySwitcher = () => {
  const { activeFamilyId, activeFamilyName, setActiveFamily } = useFamily();
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFamilies();
  }, []);

  /**
   * Fetch families from API
   */
  const fetchFamilies = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getFamilies();
      setFamilies(data || []);
    } catch (err) {
      console.error('Error fetching families:', err);
      // Silently fail - don't show error in navbar
      setError('Failed to load families');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle family selection change
   * @param {Event} e - The change event
   */
  const handleFamilyChange = (e) => {
    const selectedFamilyId = parseInt(e.target.value);
    if (selectedFamilyId && !isNaN(selectedFamilyId)) {
      const selectedFamily = families.find((f) => f.id === selectedFamilyId);
      if (selectedFamily) {
        setActiveFamily(selectedFamily.id, selectedFamily.name);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (error || families.length === 0) {
    return null; // Don't show anything if there's an error or no families
  }

  return (
    <FormControl
      fullWidth
      size="small"
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'background.default',
        },
      }}
    >
      <InputLabel id="family-switcher-label">Active Family</InputLabel>
      <Select
        labelId="family-switcher-label"
        id="family-switcher"
        value={activeFamilyId || ''}
        label="Active Family"
        onChange={handleFamilyChange}
      >
        {!activeFamilyId && (
          <MenuItem value="">
            <em>Select Family</em>
          </MenuItem>
        )}
        {families.map((family) => (
          <MenuItem key={family.id} value={family.id}>
            {family.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default FamilySwitcher;
