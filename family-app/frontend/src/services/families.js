import api from './api';

/**
 * Fetch all families for the authenticated user
 * @returns {Promise<Array>} Array of family objects
 */
export const getFamilies = async () => {
  const response = await api.get('/api/families/');
  return response.data;
};

/**
 * Create a new family
 * @param {string} name - Family name
 * @returns {Promise<Object>} Created family object
 */
export const createFamily = async (name) => {
  const payload = { name };
  const response = await api.post('/api/families/', payload);
  return response.data;
};

/**
 * Submit a join request to a family
 * @param {Object} params - Join request parameters
 * @param {string} params.code - Family code (8 characters)
 * @param {number} [params.chosen_person_id] - Optional person ID if joining as existing person
 * @param {Object} [params.new_person_payload] - Optional person data for new person (if not provided, user profile data will be used)
 * @param {string} [params.new_person_payload.first_name] - First name
 * @param {string} [params.new_person_payload.last_name] - Last name
 * @param {string} [params.new_person_payload.dob] - Date of birth (YYYY-MM-DD)
 * @param {string} [params.new_person_payload.gender] - Gender (MALE, FEMALE, OTHER, UNKNOWN)
 * @returns {Promise<Object>} Join request object
 */
export const submitJoinRequest = async ({ code, chosen_person_id, new_person_payload }) => {
  const payload = { code };
  if (chosen_person_id) payload.chosen_person_id = chosen_person_id;
  if (new_person_payload) payload.new_person_payload = new_person_payload;
  // If neither chosen_person_id nor new_person_payload is provided, backend will use user profile data
  
  const response = await api.post('/api/families/join/', payload);
  return response.data;
};

/**
 * Fetch join requests made by the current user
 * @returns {Promise<Array>} Array of join request objects
 */
export const getMyJoinRequests = async () => {
  const response = await api.get('/api/families/my-join-requests/');
  return response.data;
};

/**
 * Fetch pending join requests for families where user is admin
 * @returns {Promise<Array>} Array of join request objects
 */
export const getJoinRequests = async () => {
  const response = await api.get('/api/families/join-requests/');
  return response.data;
};

/**
 * Approve a join request
 * @param {number} id - Join request ID
 * @param {number|null} personId - Optional person ID to link to existing person
 * @returns {Promise<Object>} Response object with message and membership_id
 */
export const approveJoinRequest = async (id, personId = null) => {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'services/families.js:77',message:'approveJoinRequest service called',data:{id,idType:typeof id,personId,url:`/api/families/join-requests/${id}/approve/`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  try {
    const payload = {};
    if (personId !== null && personId !== undefined) {
      payload.person_id = personId;
    }
    const response = await api.post(`/api/families/join-requests/${id}/approve/`, payload);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'services/families.js:81',message:'approveJoinRequest API response received',data:{id,status:response.status,statusText:response.statusText,data:JSON.stringify(response.data)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return response.data;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'services/families.js:85',message:'approveJoinRequest API error',data:{id,errorMessage:error.message,status:error.response?.status,statusText:error.response?.statusText,responseData:error.response?.data?JSON.stringify(error.response.data):'no data',requestUrl:error.config?.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    throw error;
  }
};

/**
 * Reject a join request
 * @param {number} id - Join request ID
 * @returns {Promise<Object>} Response object with message and join_request_id
 */
export const rejectJoinRequest = async (id) => {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'services/families.js:95',message:'rejectJoinRequest service called',data:{id,idType:typeof id,url:`/api/families/join-requests/${id}/reject/`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  try {
    const response = await api.post(`/api/families/join-requests/${id}/reject/`);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'services/families.js:99',message:'rejectJoinRequest API response received',data:{id,status:response.status,statusText:response.statusText,data:JSON.stringify(response.data)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return response.data;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'services/families.js:103',message:'rejectJoinRequest API error',data:{id,errorMessage:error.message,status:error.response?.status,statusText:error.response?.statusText,responseData:error.response?.data?JSON.stringify(error.response.data):'no data',requestUrl:error.config?.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    throw error;
  }
};

/**
 * Check if the current user is an admin of a family
 * @param {number} familyId - The family ID
 * @returns {Promise<boolean>} True if user is admin, false otherwise
 */
export const checkIsFamilyAdmin = async (familyId) => {
  try {
    const response = await api.get(`/api/families/${familyId}/is_admin/`);
    return response.data?.is_admin === true;
  } catch (error) {
    // If endpoint doesn't exist, return false
    if (error.response?.status === 404) {
      console.warn('Admin check endpoint not found, assuming not admin');
      return false;
    }
    console.error('Error checking family admin status:', error);
    return false;
  }
};
