export const API_BASE_URL = (() => {
  // Check if we have a custom backend URL in environment
  const customBackendUrl = import.meta.env.VITE_BACKEND_URL;
  if (customBackendUrl) {
    return customBackendUrl;
  }
  
  // For production/remote access via zeduno.piskoe.com (HTTPS)
  // We need to use the same origin to avoid mixed content issues
  // The server at zeduno.piskoe.com should proxy to the backend
  if (window.location.hostname === 'zeduno.piskoe.com') {
    return '/api';
  }
  
  // For direct IP access
  if (window.location.hostname === '192.168.2.43') {
    return 'http://192.168.2.43:5000/api';
  }
  
  // For local development, use relative URL (will be proxied by Vite)
  return import.meta.env.VITE_API_URL || '/api';
})();

export const getApiUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Re-export utility functions for backward compatibility
export { getAssetUrl, getAssetBaseUrl } from '@/utils/url';