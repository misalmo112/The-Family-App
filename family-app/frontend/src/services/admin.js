import api from './api';

/**
 * Get health check status
 * @returns {Promise<Object>} Health check response with status, time, and db status
 */
export const getHealth = async () => {
  const response = await api.get('/api/admin/health/');
  return response.data;
};

/**
 * Get health check status (alias for getHealth)
 * @returns {Promise<Object>} Health check response with status, time, and db status
 */
export const getHealthStatus = async () => {
  return getHealth();
};

/**
 * Get dashboard statistics
 * @param {number} days - Number of days for statistics (default: 30)
 * @returns {Promise<Object>} Statistics object with user, family, post, and join request counts
 */
export const getDashboardStats = async (days = 30) => {
  const response = await api.get('/api/admin/stats/', { params: { days } });
  return response.data;
};

/**
 * Get users list with search
 * @param {string} q - Search query
 * @returns {Promise<Array>} Array of user objects
 */
export const getUsers = async (q = '') => {
  const params = q ? { q } : {};
  const response = await api.get('/api/admin/users/', { params });
  return response.data;
};

/**
 * Disable a user
 * @param {number} id - User ID
 * @param {string} reason - Reason for disabling
 * @returns {Promise<Object>} Response object
 */
export const disableUser = async (id, reason = '') => {
  const response = await api.post(`/api/admin/users/${id}/disable/`, { reason });
  return response.data;
};

/**
 * Toggle superadmin status for a user
 * @param {number} id - User ID
 * @returns {Promise<Object>} Response object
 */
export const toggleSuperadmin = async (id) => {
  const response = await api.post(`/api/admin/users/${id}/toggle-superadmin/`);
  return response.data;
};

/**
 * Get families list with search
 * @param {string} q - Search query
 * @returns {Promise<Array>} Array of family objects
 */
export const getFamilies = async (q = '') => {
  const params = q ? { q } : {};
  const response = await api.get('/api/admin/families/', { params });
  return response.data;
};

/**
 * Suspend a family
 * @param {number} id - Family ID
 * @param {string} reason - Reason for suspension
 * @returns {Promise<Object>} Response object
 */
export const suspendFamily = async (id, reason = '') => {
  const response = await api.post(`/api/admin/families/${id}/suspend/`, { reason });
  return response.data;
};

/**
 * Unsuspend a family
 * @param {number} id - Family ID
 * @returns {Promise<Object>} Response object
 */
export const unsuspendFamily = async (id) => {
  const response = await api.post(`/api/admin/families/${id}/unsuspend/`);
  return response.data;
};

/**
 * Get error logs list
 * @returns {Promise<Array>} Array of error log objects
 */
export const getErrorLogs = async () => {
  const response = await api.get('/api/admin/error-logs/');
  return response.data;
};

/**
 * Get audit logs list
 * @returns {Promise<Array>} Array of audit log objects
 */
export const getAuditLogs = async () => {
  const response = await api.get('/api/admin/audit-logs/');
  return response.data;
};

/**
 * Get feedback list
 * @returns {Promise<Array>} Array of feedback objects
 */
export const getFeedback = async () => {
  const response = await api.get('/api/admin/feedback/');
  return response.data;
};

/**
 * Update feedback status
 * @param {number} id - Feedback ID
 * @param {string} status - New status (NEW, IN_PROGRESS, RESOLVED)
 * @returns {Promise<Object>} Response object
 */
export const updateFeedbackStatus = async (id, status) => {
  const response = await api.patch(`/api/admin/feedback/${id}/status/`, { status });
  return response.data;
};
