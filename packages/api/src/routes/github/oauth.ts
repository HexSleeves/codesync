/**
 * GitHub OAuth Routes
 * Handles GitHub authentication flow: authorize, callback, disconnect, status
 */

import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { nanoid } from 'nanoid';
import { config } from '../../config';
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { type AuthVariables, authMiddleware } from '../../middleware/auth';
import { createOctokit } from '../../services/github/pr-fetcher';

export const oauthRoutes = new Hono<{ Variables: AuthVariables }>()
  /**
   * GET /authorize
   * Redirect to GitHub OAuth authorization page
   */
  .get('/authorize', authMiddleware, async (c) => {
    if (!config.github.clientId) {
      return c.json({ error: 'GitHub OAuth not configured' }, 500);
    }

    const userId = c.get('userId');

    // Generate state for CSRF protection
    const state = nanoid(32);

    // Store state in cookie for verification
    setCookie(c, 'github_oauth_state', state, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: 'Lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    // Store user ID to link after callback
    setCookie(c, 'github_oauth_user', userId, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: 'Lax',
      maxAge: 60 * 10,
      path: '/',
    });

    const params = new URLSearchParams({
      client_id: config.github.clientId,
      redirect_uri: config.github.redirectUri,
      scope: config.github.scopes,
      state,
    });

    return c.redirect(`https://github.com/login/oauth/authorize?${params}`);
  })

  /**
   * GET /callback
   * Handle GitHub OAuth callback
   */
  .get('/callback', async (c) => {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');
    const errorDescription = c.req.query('error_description');

    const redirectWithError = (msg: string) =>
      c.redirect(`${config.frontendUrl}/dashboard?github_error=${encodeURIComponent(msg)}`);

    // Check for OAuth errors
    if (error) {
      console.error('GitHub OAuth error:', error, errorDescription);
      return redirectWithError(errorDescription || error);
    }

    if (!code || !state) {
      return redirectWithError('missing_params');
    }

    // Verify state
    const storedState = getCookie(c, 'github_oauth_state');
    const userId = getCookie(c, 'github_oauth_user');

    if (!storedState || state !== storedState) {
      return redirectWithError('invalid_state');
    }

    if (!userId) {
      return redirectWithError('session_expired');
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: config.github.clientId,
          client_secret: config.github.clientSecret,
          code,
          redirect_uri: config.github.redirectUri,
        }),
      });

      const tokenData = (await tokenResponse.json()) as {
        access_token?: string;
        error?: string;
        error_description?: string;
      };

      if (tokenData.error || !tokenData.access_token) {
        console.error('GitHub token exchange error:', tokenData.error);
        return redirectWithError(tokenData.error_description || tokenData.error || 'token_error');
      }

      const accessToken = tokenData.access_token;

      // Get GitHub user info
      const octokit = createOctokit(accessToken);
      const { data: githubUser } = await octokit.users.getAuthenticated();

      // Update user with GitHub info
      await db
        .update(users)
        .set({
          githubId: String(githubUser.id),
          githubUsername: githubUser.login,
          githubAccessToken: accessToken,
        })
        .where(eq(users.id, userId));

      // Clear OAuth cookies
      setCookie(c, 'github_oauth_state', '', { maxAge: 0, path: '/' });
      setCookie(c, 'github_oauth_user', '', { maxAge: 0, path: '/' });

      return c.redirect(`${config.frontendUrl}/dashboard?github_connected=true`);
    } catch (err) {
      console.error('GitHub OAuth callback error:', err);
      return redirectWithError('server_error');
    }
  })

  /**
   * POST /disconnect
   * Disconnect GitHub account from user
   */
  .post('/disconnect', authMiddleware, async (c) => {
    const userId = c.get('userId');

    await db
      .update(users)
      .set({
        githubId: null,
        githubUsername: null,
        githubAccessToken: null,
      })
      .where(eq(users.id, userId));

    return c.json({ success: true, message: 'GitHub account disconnected' });
  })

  /**
   * GET /status
   * Get GitHub connection status for current user
   */
  .get('/status', authMiddleware, async (c) => {
    const userId = c.get('userId');

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        githubId: true,
        githubUsername: true,
      },
    });

    return c.json({
      connected: !!user?.githubId,
      username: user?.githubUsername || null,
    });
  });
