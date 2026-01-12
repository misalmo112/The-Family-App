import api from './api';

/**
 * Fetch feed posts for a family
 * @param {Object} params - Query parameters
 * @param {number} params.familyId - The family ID
 * @param {number} [params.page=1] - Page number for pagination
 * @returns {Promise<Object>} Response with results array and pagination info
 */
export const getFeed = async ({ familyId, page = 1 }) => {
  const response = await api.get('/api/feed/', {
    params: {
      family_id: familyId,
      page,
    },
  });
  
  // Handle both paginated response { results: [...] } and direct array
  if (response.data.results) {
    return response.data;
  }
  return { results: response.data, count: response.data.length };
};

/**
 * Create a new post
 * @param {Object} postData - Post data
 * @param {number} postData.familyId - The family ID
 * @param {string} postData.type - Post type: 'POST' or 'ANNOUNCEMENT'
 * @param {string} postData.text - Post text content
 * @param {string} [postData.imageUrl] - Optional image URL
 * @returns {Promise<Object>} Created post object
 */
export const createPost = async ({ familyId, type, text, imageUrl }) => {
  const payload = {
    family_id: familyId,
    type,
    text,
  };
  
  // Only include image_url if provided (not empty string)
  if (imageUrl && imageUrl.trim() !== '') {
    payload.image_url = imageUrl.trim();
  }
  
  const response = await api.post('/api/feed/posts/', payload);
  return response.data;
};
