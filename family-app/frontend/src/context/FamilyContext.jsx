import React, { createContext, useContext, useState, useEffect } from 'react';

const FamilyContext = createContext();

const STORAGE_KEY = 'activeFamily';

/**
 * FamilyContext Provider
 * Manages active family state with localStorage persistence
 */
export const FamilyProvider = ({ children }) => {
  const [activeFamilyId, setActiveFamilyId] = useState(null);
  const [activeFamilyName, setActiveFamilyName] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setActiveFamilyId(parsed.activeFamilyId || null);
        setActiveFamilyName(parsed.activeFamilyName || null);
      }
    } catch (error) {
      console.error('Error loading active family from localStorage:', error);
      // Gracefully degrade - state only, no persistence
    }
  }, []);

  // Persist to localStorage when state changes
  useEffect(() => {
    try {
      if (activeFamilyId && activeFamilyName) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            activeFamilyId,
            activeFamilyName,
          })
        );
      } else {
        // Clear localStorage if no family is selected
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving active family to localStorage:', error);
      // Gracefully degrade - state only, no persistence
    }
  }, [activeFamilyId, activeFamilyName]);

  /**
   * Set the active family
   * @param {number} familyId - The family ID
   * @param {string} familyName - The family name
   */
  const setActiveFamily = (familyId, familyName) => {
    setActiveFamilyId(familyId);
    setActiveFamilyName(familyName);
  };

  /**
   * Clear the active family
   */
  const clearActiveFamily = () => {
    setActiveFamilyId(null);
    setActiveFamilyName(null);
  };

  const value = {
    activeFamilyId,
    activeFamilyName,
    setActiveFamily,
    clearActiveFamily,
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
};

/**
 * Hook to use FamilyContext
 * @returns {object} Family context value
 */
export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};
