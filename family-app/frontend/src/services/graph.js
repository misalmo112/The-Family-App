import api from './api';

/**
 * Fetch persons list for a family
 * @param {Object} params - Query parameters
 * @param {number} params.familyId - The family ID
 * @returns {Promise<Array>} Array of person objects
 */
export const getPersons = async ({ familyId }) => {
  const response = await api.get('/api/graph/persons/', {
    params: {
      family_id: familyId,
    },
  });
  return response.data;
};

/**
 * Fetch topology for a family from a viewer's perspective
 * @param {Object} params - Query parameters
 * @param {number} params.familyId - The family ID
 * @param {number} params.viewerPersonId - The person ID viewing the topology
 * @returns {Promise<Object>} Topology object with nodes and edges
 */
export const getTopology = async ({ familyId, viewerPersonId }) => {
  const response = await api.get('/api/graph/topology/', {
    params: {
      family_id: familyId,
      viewer_person_id: viewerPersonId,
    },
  });
  return response.data;
};

/**
 * Create a relationship between two persons
 * @param {Object} params - Relationship parameters
 * @param {number} params.familyId - The family ID
 * @param {number} params.fromPersonId - The person ID for the "from" side
 * @param {number} params.toPersonId - The person ID for the "to" side
 * @param {string} params.type - Relationship type ('PARENT_OF' or 'SPOUSE_OF')
 * @returns {Promise<Object>} Created relationship object(s)
 */
export const createRelationship = async ({ familyId, fromPersonId, toPersonId, type }) => {
  const response = await api.post('/api/graph/relationships/', {
    family_id: familyId,
    from_person_id: fromPersonId,
    to_person_id: toPersonId,
    type: type,  // 'PARENT_OF' or 'SPOUSE_OF'
  });
  return response.data;
};

/**
 * Get the current user's person ID in a family
 * Uses heuristic: tries to fetch posts with scope=all_families for each person
 * The person that succeeds is the current user's person
 * @param {number} familyId - The family ID
 * @returns {Promise<number|null>} Person ID or null if not found
 */
export const getCurrentUserPersonId = async (familyId) => {
  try {
    // Import getFeed dynamically to avoid circular dependency
    const { getFeed } = await import('./feed');
    const { getProfile } = await import('./auth');
    
    // Get current user profile
    const profile = await getProfile();
    if (!profile?.username) {
      return null;
    }
    
    // Get all persons in the family
    const persons = await getPersons({ familyId });
    if (!persons || persons.length === 0) {
      return null;
    }
    
    // Try to find the person ID by attempting to fetch posts with scope=all_families
    // The first person ID that works is the user's person ID
    for (const person of persons) {
      try {
        await getFeed({
          familyId: familyId,
          authorPersonId: person.id,
          type: 'POST',
          scope: 'all_families',
          page: 1,
        });
        // If successful, this is the user's person ID
        return person.id;
      } catch (err) {
        // Not this person, continue
        continue;
      }
    }
    
    // If no person worked with scope=all_families, return null
    return null;
  } catch (err) {
    console.error('Error getting current user person ID:', err);
    return null;
  }
};