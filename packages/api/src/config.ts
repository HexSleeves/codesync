/**
 * Configuration - Centralized environment variables
 */

// Validate critical secrets in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
    throw new Error('FATAL: JWT_SECRET must be set in production');
  }
}

export const config = {
  // Server
  port: Number.parseInt(process.env.PORT || '8001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgres://codesync:codesync@localhost:5432/codesync',

  // Auth
  jwtSecret: process.env.JWT_SECRET || `dev-only-secret-${crypto.randomUUID()}`,
  tokenExpiryDays: 7,

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // GitHub OAuth
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:8001/api/github/callback',
    scopes: 'repo read:user user:email',
  },
} as const;

export type Config = typeof config;
