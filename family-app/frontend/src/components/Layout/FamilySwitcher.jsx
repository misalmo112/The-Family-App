import React, { useState, useEffect } from 'react';
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
      <div style={{ padding: '0.5rem 1rem' }}>
        <span style={{ color: '#666' }}>Loading...</span>
      </div>
    );
  }

  if (error || families.length === 0) {
    return null; // Don't show anything if there's an error or no families
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <label 
        htmlFor="family-switcher"
        style={{ 
          fontSize: '0.9rem', 
          color: '#666',
          whiteSpace: 'nowrap'
        }}
      >
        Family:
      </label>
      <select
        id="family-switcher"
        value={activeFamilyId || ''}
        onChange={handleFamilyChange}
        style={{
          padding: '0.5rem',
          borderRadius: '4px',
          border: '1px solid #ddd',
          backgroundColor: '#fff',
          cursor: 'pointer',
          fontSize: '0.9rem',
          minWidth: '150px',
        }}
      >
        {!activeFamilyId && (
          <option value="">Select Family</option>
        )}
        {families.map((family) => (
          <option key={family.id} value={family.id}>
            {family.name}
          </option>
        ))}
      </select>
      {activeFamilyName && (
        <span 
          style={{ 
            fontSize: '0.85rem', 
            color: '#666',
            fontStyle: 'italic'
          }}
        >
          ({activeFamilyName})
        </span>
      )}
    </div>
  );
};

export default FamilySwitcher;
