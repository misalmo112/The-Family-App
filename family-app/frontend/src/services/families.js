import api from './api';

/**
 * Fetch all families for the authenticated user
 * @returns {Promise<Array>} Array of family objects
 */
export const getFamilies = async () => {
  const response = await api.get('/api/families/');
  return response.data;
};
