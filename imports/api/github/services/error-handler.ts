/**
 * GitHub API error handling utilities
 */

import { Meteor } from 'meteor/meteor';
import { isErrorWithStatus, isErrorWithMessage } from '../../../utils/errors';

/**
 * Handle GitHub API errors and throw appropriate Meteor errors
 */
export function handleGitHubError(error: unknown, defaultMessage: string): never {
  if (isErrorWithStatus(error)) {
    if (error.status === 401) {
      throw new Meteor.Error(
        'github-auth-error',
        'GitHub authentication failed. Please re-connect your GitHub account.'
      );
    }
    if (error.status === 403) {
      throw new Meteor.Error(
        'github-rate-limit',
        'GitHub API rate limit exceeded. Please try again later.'
      );
    }
    if (error.status === 404) {
      throw new Meteor.Error(
        'pr-not-found',
        'Pull request not found. Make sure the repository is accessible and the PR exists.'
      );
    }
  }

  console.error('GitHub error:', error);
  const message = isErrorWithMessage(error) ? error.message : defaultMessage;
  throw new Meteor.Error('github-error', message);
}

/**
 * Handle GitHub API errors with shorter messages (for secondary operations)
 */
export function handleGitHubErrorBrief(error: unknown, defaultMessage: string): never {
  if (isErrorWithStatus(error)) {
    if (error.status === 401) {
      throw new Meteor.Error('github-auth-error', 'GitHub authentication failed');
    }
    if (error.status === 403) {
      throw new Meteor.Error('github-rate-limit', 'GitHub API rate limit exceeded');
    }
    if (error.status === 404) {
      throw new Meteor.Error('pr-not-found', 'Pull request not found');
    }
  }

  const message = isErrorWithMessage(error) ? error.message : defaultMessage;
  throw new Meteor.Error('github-error', message);
}
