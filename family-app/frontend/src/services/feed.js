import api from './api';

/**
 * Fetch feed posts for a family
 * @param {Object} params - Query parameters
 * @param {number} params.familyId - The family ID
 * @param {number} [params.page=1] - Page number for pagination
 * @param {string} [params.type] - Filter by post type: 'POST', 'ANNOUNCEMENT', or 'MESSAGE'
 * @param {number} [params.authorPersonId] - Filter by author person ID
 * @param {string} [params.scope] - Filter scope (e.g., 'all_families')
 * @returns {Promise<Object>} Response with results array and pagination info
 */
export const getFeed = async ({ familyId, page = 1, type, authorPersonId, scope }) => {
  const params = {
    family_id: familyId,
    page,
  };
  
  // Only include optional params if they are provided
  if (type) {
    params.type = type;
  }
  if (authorPersonId) {
    params.author_person_id = authorPersonId;
  }
  if (scope) {
    params.scope = scope;
  }
  
  const response = await api.get('/api/feed/', { params });
  
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
 * @param {string} postData.type - Post type: 'MESSAGE', 'POST', or 'ANNOUNCEMENT'
 * @param {string} postData.text - Post text content
 * @param {string} [postData.imageUrl] - Optional image URL (not allowed for MESSAGE type)
 * @param {File} [postData.photo] - Optional photo file (for POST/ANNOUNCEMENT types)
 * @param {File} [postData.voiceMessage] - Optional voice message file (for MESSAGE type)
 * @param {File} [postData.fileAttachment] - Optional file attachment (for MESSAGE type)
 * @param {number} [postData.authorPersonId] - Optional author person ID
 * @returns {Promise<Object>} Created post object
 */
export const createPost = async ({ 
  familyId, 
  type, 
  text, 
  imageUrl, 
  photo, 
  voiceMessage, 
  fileAttachment,
  authorPersonId
}) => {
  // Check if we have any files to upload
  const hasFiles = photo || voiceMessage || fileAttachment;
  
  if (hasFiles) {
    // Use FormData for file uploads
    const formData = new FormData();
    formData.append('family_id', familyId);
    formData.append('type', type);
    formData.append('text', text);
    
    // Add optional fields
    if (imageUrl && imageUrl.trim() !== '') {
      formData.append('image_url', imageUrl.trim());
    }
    if (authorPersonId) {
      formData.append('author_person_id', authorPersonId);
    }
    if (photo) {
      formData.append('photo', photo);
    }
    if (voiceMessage) {
      formData.append('voice_message', voiceMessage);
    }
    if (fileAttachment) {
      formData.append('file_attachment', fileAttachment);
    }
    
    // Don't set Content-Type header - axios will set it automatically with boundary for FormData
    const response = await api.post('/api/feed/posts/', formData);
    return response.data;
  } else {
    // Use JSON for text-only posts
    const payload = {
      family_id: familyId,
      type,
      text,
    };
    
    // Only include image_url if provided (not empty string)
    if (imageUrl && imageUrl.trim() !== '') {
      payload.image_url = imageUrl.trim();
    }
    
    // Include author_person_id if provided
    if (authorPersonId) {
      payload.author_person_id = authorPersonId;
    }
    
    const response = await api.post('/api/feed/posts/', payload);
    return response.data;
  }
};

/**
 * Fetch comments for a post
 * @param {number} postId - The post ID
 * @param {number} [page=1] - Page number for pagination
 * @returns {Promise<Object>} Response with results array and pagination info
 */
export const getComments = async (postId, page = 1) => {
  const response = await api.get(`/api/feed/posts/${postId}/comments/`, {
    params: {
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
 * Create a comment on a post
 * @param {number} postId - The post ID
 * @param {string} text - Comment text content
 * @param {number} [authorPersonId] - Optional author person ID
 * @returns {Promise<Object>} Created comment object
 */
export const createComment = async (postId, text, authorPersonId) => {
  const payload = {
    text,
  };
  
  // Only include author_person_id if provided
  if (authorPersonId) {
    payload.author_person_id = authorPersonId;
  }
  
  const response = await api.post(`/api/feed/posts/${postId}/comments/`, payload);
  return response.data;
};
