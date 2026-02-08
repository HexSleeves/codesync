/**
 * GitHub OAuth Routes
 * Handles GitHub authentication flow: authorize, callback, disconnect, status
 */

import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
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

    // Generate HMAC-signed state containing userId for CSRF protection + user binding
    const nonce = nanoid(32);
    const state = await sign(
      { sub: userId, nonce, exp: Math.floor(Date.now() / 1000) + 600 },
      config.jwtSecret
    );

    // Store nonce in cookie for double-check verification
    setCookie(c, 'github_oauth_state', nonce, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: 'Lax',
      maxAge: 60 * 10, // 10 minutes
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

    // Verify signed state — extracts userId securely
    const storedNonce = getCookie(c, 'github_oauth_state');

    let userId: string;
    try {
      const payload = await verify(state, config.jwtSecret, 'HS256') as { sub?: string; nonce?: string };
      if (!payload?.sub || !payload?.nonce) {
        return redirectWithError('invalid_state');
      }
      if (payload.nonce !== storedNonce) {
        return redirectWithError('invalid_state');
      }
      userId = payload.sub;
    } catch {
      return redirectWithError('invalid_state');
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

      // Clear OAuth cookie
      setCookie(c, 'github_oauth_state', '', { maxAge: 0, path: '/' });

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
