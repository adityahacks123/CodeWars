// API configuration
export const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE_URL = `${SERVER_URL}/api`;

export const API_ENDPOINTS = {
  // Auth endpoints
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  ME: `${API_BASE_URL}/auth/me`,
  GOOGLE_AUTH: `${API_BASE_URL}/auth/google`,
  AUTH_STATUS: `${API_BASE_URL}/auth/status`,
  
  // Questions endpoints (legacy)
  QUESTIONS: `${API_BASE_URL}/questions`,

  // Problems endpoints (new problem bank)
  PROBLEMS: `${API_BASE_URL}/problems`,
  
  // Rooms endpoints
  ROOMS: `${API_BASE_URL}/rooms`,

  // Code Execution
  EXECUTE: `${API_BASE_URL}/code/execute`,

  // Submissions
  SUBMISSIONS: `${API_BASE_URL}/submissions`,

  // User & Stats
  LEADERBOARD: `${API_BASE_URL}/user/leaderboard`,
  USER_STATS: (userId) => `${API_BASE_URL}/user/${userId}/stats`,
  USER_SOLVED: (userId) => `${API_BASE_URL}/user/${userId}/solved`,
  
  // Profile & Settings
  UPLOAD_AVATAR: `${API_BASE_URL}/upload/avatar`,
  UPDATE_PROFILE: `${API_BASE_URL}/users/profile`,
  CHANGE_PASSWORD: `${API_BASE_URL}/users/password`,
  CHANGE_EMAIL: `${API_BASE_URL}/users/email`,
  NOTIFICATIONS: `${API_BASE_URL}/users/notifications`,
  DELETE_ACCOUNT: `${API_BASE_URL}/users/account`,
};

export default API_BASE_URL;
