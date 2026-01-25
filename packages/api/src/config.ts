/**
 * Configuration - Centralized environment variables
 */

export const config = {
  // Server
  port: Number.parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgres://codesync:codesync@localhost:5432/codesync',

  // Auth
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  passwordSalt: process.env.PASSWORD_SALT || 'salt',
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
