/* Environment configuration and validation */

const isProduction = () => process.env.NODE_ENV === 'production';

export const requiredInProduction = [
  'JWT_SECRET',
  // CORS allowlist (comma-separated)
  'ALLOWED_ORIGINS',
  // Zed Business integration
  'ZED_API_BASE_URL',
  'ZED_AUTH_TOKEN',
  'ZED_EXTERNAL_ORIGIN',
];

export function validateEnv(): void {
  if (!isProduction()) {
    // In development, no hard failure but helpful hints
    if (!process.env.JWT_SECRET) {
      console.warn('[env] Warning: JWT_SECRET is not set (development only).');
    }
    return;
  }

  const missing = requiredInProduction.filter((key) => !process.env[key] || process.env[key]!.trim() === '');
  if (missing.length > 0) {
    // Fail fast with clear error message
    console.error('[env] Missing required environment variables for production:');
    missing.forEach((k) => console.error(`  - ${k}`));
    console.error('[env] Set the variables above and restart the server.');
    process.exit(1);
  }
}

export function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS || process.env.CORS_ALLOWED_ORIGINS || '';
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

