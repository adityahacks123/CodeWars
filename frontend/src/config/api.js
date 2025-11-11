// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  ME: `${API_BASE_URL}/auth/me`,
  GOOGLE_AUTH: `${API_BASE_URL}/auth/google`,
  AUTH_STATUS: `${API_BASE_URL}/auth/status`,
  
  // Questions endpoints
  QUESTIONS: `${API_BASE_URL}/questions`,
  
  // Rooms endpoints
  ROOMS: `${API_BASE_URL}/rooms`,
};

export default API_BASE_URL;
