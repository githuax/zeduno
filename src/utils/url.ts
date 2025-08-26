/**
 * URL utility functions for ZedUno application
 */

/**
 * Get the base URL for API calls
 */
export const getBaseUrl = (): string => {
  return import.meta.env.VITE_API_URL || window.location.origin;
};

/**
 * Get the base URL for assets (uploads, images, etc.)
 * This removes /api from the end if it exists since assets are served from root
 */
export const getAssetBaseUrl = (): string => {
  const baseUrl = getBaseUrl();
  return baseUrl.replace(/\/api$/, '');
};

/**
 * Convert a relative asset path to a full URL
 * @param assetPath - The relative path to the asset (e.g., '/uploads/logos/logo.svg')
 */
export const getAssetUrl = (assetPath: string): string => {
  if (!assetPath) return '';
  
  // If it's already a full URL, return as is
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }
  
  const baseUrl = getAssetBaseUrl();
  const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  
  return `${baseUrl}${cleanPath}`;
};

/**
 * Get the full API URL for an endpoint
 * @param endpoint - The API endpoint (e.g., 'users/profile')
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || '/api';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

/**
 * Check if the current environment is development
 */
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV || false;
};

/**
 * Check if the current environment is production
 */
export const isProduction = (): boolean => {
  return import.meta.env.PROD || false;
};