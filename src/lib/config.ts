// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://pf-backend-x6xf.onrender.com/api/v1',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/users/login',
      REGISTER: '/users/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout'
    },
    USER: {
      PROFILE: '/user/profile',
      UPDATE: '/user/update'
    }
  },
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3
};

// External URLs
export const EXTERNAL_URLS = {
  SIGNUP: 'https://privacy-family.vercel.app/signup',
  PROFILE: 'https://privacy-family.vercel.app/profile'
};

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  PROFILES: 'profiles',
  CURRENT_PROFILE: 'currentProfile'
};

// Default headers for API requests
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
