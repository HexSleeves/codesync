import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Sessions, Session } from '../sessions/collection';
import { nanoid } from 'nanoid';
import { getGitHubToken, createOctokit } from './client';
import { parseGitHubPRUrl } from './parser';
import { fetchPRDetails, fetchPRFiles } from './fetcher';
import { UserServices } from '../../types/meteor';
import {
  processPRFiles,
  handleGitHubError,
  handleGitHubErrorBrief,
  type PRFileInfo,
} from './services';
import { isErrorWithStatus, isErrorWithMessage } from '../../utils/errors';

Meteor.methods({
  /**
   * Import a GitHub PR into a new session
   */
  async 'github.importPR'(prUrl: string, options: { isPublic?: boolean } = {}) {
    check(prUrl, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    const prInfo = parseGitHubPRUrl(prUrl);
    if (!prInfo) {
      throw new Meteor.Error(
        'invalid-url',
        'Invalid GitHub PR URL. Use format: https://github.com/owner/repo/pull/123'
      );
    }

    const token = await getGitHubToken(this.userId);
    if (!token) {
      throw new Meteor.Error(
        'no-github-token',
        'Please connect your GitHub account to import pull requests. Sign in with GitHub to continue.'
      );
    }

    const octokit = createOctokit(token);

    try {
      const prData = await fetchPRDetails(octokit, prInfo.owner, prInfo.repo, prInfo.prNumber);

      // Create session
      const sessionId = nanoid();

      await Sessions.insertAsync({
        _id: sessionId,
        title: prData.title || `PR #${prInfo.prNumber}`,
        description: prData.body || '',
        createdBy: this.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: options.isPublic ?? false,
        allowedUsers: [this.userId],
        shareToken: nanoid(12),
        source: {
          type: 'github',
          url: prData.html_url,
          repository: `${prInfo.owner}/${prInfo.repo}`,
          prNumber: prInfo.prNumber,
          branch: prData.head.ref,
          commit: prData.head.sha,
        },
        status: 'in_review',
        reviewers: [],
        settings: {
          diffMode: 'unified',
          theme: 'dark',
          showWhitespace: false,
          tabSize: 2,
        },
        stats: {
          fileCount: 0,
          commentCount: 0,
          activeUsers: 1,
        },
      } as Session);

      // Fetch and process PR files
      const prFiles = await fetchPRFiles(octokit, prInfo.owner, prInfo.repo, prInfo.prNumber);

      const fileCount = await processPRFiles(octokit, sessionId, prFiles as PRFileInfo[], {
        owner: prInfo.owner,
        repo: prInfo.repo,
        baseSha: prData.base.sha,
        headSha: prData.head.sha,
      });

      // Update session stats
      await Sessions.updateAsync(sessionId, {
        $set: {
          'stats.fileCount': fileCount,
          updatedAt: new Date(),
        },
      });

      return sessionId;
    } catch (error: unknown) {
      handleGitHubError(error, 'Failed to import pull request from GitHub');
    }
  },

  /**
   * Import PR files into an existing session
   */
  async 'github.importPRToSession'(sessionId: string, prUrl: string) {
    check(sessionId, String);
    check(prUrl, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    const session = await Sessions.findOneAsync(sessionId);
    if (!session) {
      throw new Meteor.Error('session-not-found', 'Session not found');
    }
    if (session.createdBy !== this.userId) {
      throw new Meteor.Error('not-authorized', 'Only the session owner can import files');
    }

    const prInfo = parseGitHubPRUrl(prUrl);
    if (!prInfo) {
      throw new Meteor.Error('invalid-url', 'Invalid GitHub PR URL');
    }

    const token = await getGitHubToken(this.userId);
    if (!token) {
      throw new Meteor.Error('no-github-token', 'Please connect your GitHub account');
    }

    const octokit = createOctokit(token);

    try {
      const prData = await fetchPRDetails(octokit, prInfo.owner, prInfo.repo, prInfo.prNumber);
      const prFiles = await fetchPRFiles(octokit, prInfo.owner, prInfo.repo, prInfo.prNumber);

      const fileCount = await processPRFiles(octokit, sessionId, prFiles as PRFileInfo[], {
        owner: prInfo.owner,
        repo: prInfo.repo,
        baseSha: prData.base.sha,
        headSha: prData.head.sha,
      });

      // Update session
      await Sessions.updateAsync(sessionId, {
        $set: {
          source: {
            type: 'github',
            url: prData.html_url,
            repository: `${prInfo.owner}/${prInfo.repo}`,
            prNumber: prInfo.prNumber,
            branch: prData.head.ref,
            commit: prData.head.sha,
          },
          updatedAt: new Date(),
        },
        $inc: { 'stats.fileCount': fileCount },
      });

      return { fileCount };
    } catch (error: unknown) {
      handleGitHubErrorBrief(error, 'Failed to import pull request');
    }
  },

  /**
   * Check if user has GitHub connected
   */
  async 'github.checkConnection'() {
    if (!this.userId) {
      return { connected: false, username: null };
    }

    const token = await getGitHubToken(this.userId);
    const user = await Meteor.users.findOneAsync(this.userId);
    const services = user?.services as UserServices;

    return {
      connected: !!token,
      username: services?.github?.username || null,
    };
  },

  /**
   * Validate a PR URL and return basic info
   */
  async 'github.validatePRUrl'(prUrl: string) {
    check(prUrl, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const prInfo = parseGitHubPRUrl(prUrl);
    if (!prInfo) {
      throw new Meteor.Error('invalid-url', 'Invalid GitHub PR URL');
    }

    const token = await getGitHubToken(this.userId);
    if (!token) {
      throw new Meteor.Error('no-github-token', 'GitHub not connected');
    }

    const octokit = createOctokit(token);

    try {
      const prData = await fetchPRDetails(octokit, prInfo.owner, prInfo.repo, prInfo.prNumber);
      const prFiles = await fetchPRFiles(octokit, prInfo.owner, prInfo.repo, prInfo.prNumber);

      return {
        valid: true,
        owner: prInfo.owner,
        repo: prInfo.repo,
        prNumber: prInfo.prNumber,
        title: prData.title,
        state: prData.state,
        fileCount: prFiles.length,
        author: prData.user.login,
      };
    } catch (error: unknown) {
      if (isErrorWithStatus(error) && error.status === 404) {
        throw new Meteor.Error('pr-not-found', 'Pull request not found or not accessible');
      }
      const message = isErrorWithMessage(error) ? error.message : 'Unknown GitHub error';
      throw new Meteor.Error('github-error', message);
    }
  },
});
