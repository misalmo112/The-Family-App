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
 * @param {Object} personData - Optional person profile data
 * @param {string} personData.first_name - First name
 * @param {string} personData.last_name - Last name
 * @param {string} personData.dob - Date of birth (YYYY-MM-DD)
 * @param {string} personData.gender - Gender (MALE, FEMALE, OTHER, UNKNOWN)
 * @returns {Promise<Object>} Created family object
 */
export const createFamily = async (name, personData = {}) => {
  const payload = { name };
  if (personData.first_name) payload.first_name = personData.first_name;
  if (personData.last_name) payload.last_name = personData.last_name;
  if (personData.dob) payload.dob = personData.dob;
  if (personData.gender) payload.gender = personData.gender;
  
  const response = await api.post('/api/families/', payload);
  return response.data;
};

/**
 * Submit a join request to a family
 * @param {Object} params - Join request parameters
 * @param {string} params.code - Family code (8 characters)
 * @param {number} [params.chosen_person_id] - Optional person ID if joining as existing person
 * @param {Object} [params.new_person_payload] - Optional person data for new person
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
 * @returns {Promise<Object>} Response object with message and membership_id
 */
export const approveJoinRequest = async (id) => {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'services/families.js:77',message:'approveJoinRequest service called',data:{id,idType:typeof id,url:`/api/families/join-requests/${id}/approve/`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  try {
    const response = await api.post(`/api/families/join-requests/${id}/approve/`);
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
