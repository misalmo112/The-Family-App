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
