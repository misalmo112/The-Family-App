import api from './api';

/**
 * Register a new user
 * @param {string} username - Username
 * @param {string} email - Email address
 * @param {string} password - Password
 * @param {string} passwordConfirm - Password confirmation
 * @param {string} [firstName] - First name (optional)
 * @param {string} [lastName] - Last name (optional)
 * @param {string} [dob] - Date of birth (YYYY-MM-DD, optional)
 * @param {string} [gender] - Gender (MALE, FEMALE, OTHER, UNKNOWN, optional)
 * @returns {Promise<Object>} User data
 */
export const register = async (username, email, password, passwordConfirm, firstName, lastName, dob, gender) => {
  const payload = {
    username,
    email,
    password,
    password_confirm: passwordConfirm,
  };
  
  if (firstName) payload.first_name = firstName;
  if (lastName) payload.last_name = lastName;
  if (dob) payload.dob = dob;
  if (gender) payload.gender = gender;
  
  const response = await api.post('/api/auth/register/', payload);
  return response.data;
};

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile object
 */
export const getProfile = async () => {
  const response = await api.get('/api/auth/me/');
  return response.data;
};

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @param {string} [profileData.email] - Email address
 * @param {string} [profileData.first_name] - First name
 * @param {string} [profileData.last_name] - Last name
 * @param {string} [profileData.dob] - Date of birth (YYYY-MM-DD)
 * @param {string} [profileData.gender] - Gender (MALE, FEMALE, OTHER, UNKNOWN)
 * @returns {Promise<Object>} Updated user profile
 */
export const updateProfile = async (profileData) => {
  const payload = {};
  if (profileData.email !== undefined) payload.email = profileData.email;
  if (profileData.first_name !== undefined) payload.first_name = profileData.first_name;
  if (profileData.last_name !== undefined) payload.last_name = profileData.last_name;
  if (profileData.dob !== undefined) payload.dob = profileData.dob || null;
  if (profileData.gender !== undefined) payload.gender = profileData.gender || null;
  
  const response = await api.patch('/api/auth/me/', payload);
  return response.data;
};

/**
 * Change user password
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @param {string} newPasswordConfirm - New password confirmation
 * @returns {Promise<Object>} Success message
 */
export const changePassword = async (oldPassword, newPassword, newPasswordConfirm) => {
  const payload = {
    old_password: oldPassword,
    new_password: newPassword,
    new_password_confirm: newPasswordConfirm,
  };
  
  const response = await api.post('/api/auth/change-password/', payload);
  return response.data;
};
