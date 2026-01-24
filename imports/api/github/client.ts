import { Octokit } from '@octokit/rest';
import { Meteor } from 'meteor/meteor';
import type { UserServices } from '../../types';

/**
 * Get user's GitHub OAuth token from Meteor user services
 */
export async function getGitHubToken(userId: string): Promise<string | null> {
  const user = await Meteor.users.findOneAsync(userId);
  if (!user) return null;

  const services = user.services as UserServices | undefined;
  return services?.github?.accessToken ?? null;
}

/**
 * Create an authenticated Octokit instance for a user
 */
export function createOctokit(token: string): Octokit {
  return new Octokit({
    auth: token,
  });
}
