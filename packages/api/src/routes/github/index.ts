/**
 * GitHub Routes Index
 * Combines OAuth, Import, and Sync routes
 */

import { Hono } from 'hono';
import type { AuthVariables } from '../../middleware/auth';
import { importRoutes } from './import';
import { oauthRoutes } from './oauth';
import { syncRoutes } from './sync';

export const githubRoutes = new Hono<{ Variables: AuthVariables }>()
  // OAuth routes: /authorize, /callback, /disconnect, /status
  .route('/', oauthRoutes)
  // Import routes: /validate, /import, /repositories
  .route('/', importRoutes)
  // Sync routes: /sessions/:id/submit-review, /sessions/:id/sync-status
  .route('/', syncRoutes);
