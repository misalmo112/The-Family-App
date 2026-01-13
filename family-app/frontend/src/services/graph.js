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
