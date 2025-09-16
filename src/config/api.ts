export const API_BASE_URL = (() => {
  // Check if we have a custom backend URL in environment
  const customBackendUrl = import.meta.env.VITE_BACKEND_URL;
  if (customBackendUrl) {
    return customBackendUrl;
  }

  // Guard: if hostname is empty (e.g., opened via file://), default to localhost backend
  // This prevents generating invalid URLs like "http://:5000/api"
  if (!window.location.hostname) {
    return 'http://localhost:5000/api';
  }
  
  // For production/remote access via zeduno.piskoe.com (HTTPS)
  // We need to use the same origin to avoid mixed content issues
  // The server at zeduno.piskoe.com should proxy to the backend
  if (window.location.hostname === 'zeduno.piskoe.com') {
    return '/api';
  }
  
  // For specific IP access patterns
  if (window.location.hostname === '192.168.2.43') {
    return 'http://192.168.2.43:5000/api';
  }
  
  // For the IP mentioned in the error logs
  if (window.location.hostname === '100.92.188.34') {
    return 'http://100.92.188.34:5000/api';
  }
  
  // For localhost variations
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // For local development or any other IP access
  // Use the same hostname but backend port
  const hostname = window.location.hostname;
  return `http://${hostname}:5000/api`;
})();

export const getApiUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Re-export utility functions for backward compatibility
export { getAssetUrl, getAssetBaseUrl } from '@/utils/url';
