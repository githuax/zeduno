/**
 * API Configuration Utility
 * Handles API endpoint resolution for different environments
 */

export const getApiUrl = (): string => {
  // For development on network IP, use direct backend connection
  if (window.location.hostname === '192.168.2.43') {
    return 'http://192.168.2.43:5000/api';
  }
  
  // For localhost development, use Vite proxy
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/api';
  }
  
  // For production, use relative paths
  return '/api';
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${getApiUrl()}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  return fetch(url, config);
};

export default { getApiUrl, apiRequest };
