/**
 * GitHub Routes Index
 * Combines OAuth and Import routes
 */

import { Hono } from 'hono';
import type { AuthVariables } from '../../middleware/auth';
import { importRoutes } from './import';
import { oauthRoutes } from './oauth';

export const githubRoutes = new Hono<{ Variables: AuthVariables }>()
  // OAuth routes: /authorize, /callback, /disconnect, /status
  .route('/', oauthRoutes)
  // Import routes: /validate, /import, /repositories
  .route('/', importRoutes);
