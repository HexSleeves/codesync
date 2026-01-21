import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Sessions, Session } from '../sessions/sessions';
import { Files, File } from '../files/files';
import { nanoid } from 'nanoid';
import { detectLanguage } from '../../ui/utils/file-icons';
import {
  parseGitHubPRUrl,
  getGitHubToken,
  createOctokit,
  fetchPRDetails,
  fetchPRFiles,
  fetchFileContent,
  parsePatch
} from './github';

Meteor.methods({
  /**
   * Import a GitHub PR into a new session
   */
  async 'github.importPR'(prUrl: string, options: { isPublic?: boolean } = {}) {
    check(prUrl, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    // Parse the PR URL
    const prInfo = parseGitHubPRUrl(prUrl);
    if (!prInfo) {
      throw new Meteor.Error('invalid-url', 'Invalid GitHub PR URL. Use format: https://github.com/owner/repo/pull/123');
    }
    
    // Get GitHub token
    const token = getGitHubToken(this.userId);
    if (!token) {
      throw new Meteor.Error('no-github-token', 'Please connect your GitHub account to import pull requests. Sign in with GitHub to continue.');
    }
    
    const octokit = createOctokit(token);
    
    try {
      // Fetch PR details
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
          commit: prData.head.sha
        },
        status: 'in_review',
        reviewers: [],
        settings: {
          diffMode: 'unified',
          theme: 'dark',
          showWhitespace: false,
          tabSize: 2
        },
        stats: {
          fileCount: 0,
          commentCount: 0,
          activeUsers: 1
        }
      } as Session);
      
      // Fetch PR files
      const prFiles = await fetchPRFiles(octokit, prInfo.owner, prInfo.repo, prInfo.prNumber);
      
      // Process each file
      let fileCount = 0;
      const now = new Date();
      
      for (const prFile of prFiles) {
        try {
          // Fetch original content for modified/deleted files
          let originalContent: string | undefined;
          let content = '';
          
          if (prFile.status === 'removed' || prFile.status === 'modified' || prFile.status === 'renamed') {
            const pathToFetch = prFile.previous_filename || prFile.filename;
            originalContent = await fetchFileContent(
              octokit,
              prInfo.owner,
              prInfo.repo,
              pathToFetch,
              prData.base.sha
            ) || '';
          }
          
          // Fetch new content for added/modified files
          if (prFile.status === 'added' || prFile.status === 'modified' || prFile.status === 'renamed' || prFile.status === 'changed') {
            const fetchedContent = await fetchFileContent(
              octokit,
              prInfo.owner,
              prInfo.repo,
              prFile.filename,
              prData.head.sha
            );
            content = fetchedContent || '';
          } else if (prFile.status === 'removed') {
            content = ''; // File was deleted
          }
          
          // Parse the patch into hunks
          const hunks = parsePatch(prFile.patch);
          
          // Determine file properties
          const name = prFile.filename.split('/').pop() || prFile.filename;
          const extension = name.includes('.') ? name.split('.').pop() || '' : '';
          const language = detectLanguage(name);
          
          await Files.insertAsync({
            _id: nanoid(),
            sessionId,
            path: prFile.filename,
            name,
            extension,
            size: content.length,
            content,
            originalContent,
            encoding: 'utf-8',
            language,
            isDeleted: prFile.status === 'removed',
            isAdded: prFile.status === 'added',
            isModified: prFile.status === 'modified' || prFile.status === 'changed',
            isRenamed: prFile.status === 'renamed',
            oldPath: prFile.previous_filename,
            hunks,
            isReviewed: false,
            reviewedBy: [],
            createdAt: now,
            updatedAt: now
          } as File);
          
          fileCount++;
        } catch (fileError: any) {
          // Log error but continue with other files
          console.error(`Error processing file ${prFile.filename}:`, fileError.message);
        }
      }
      
      // Update session stats
      await Sessions.updateAsync(sessionId, {
        $set: {
          'stats.fileCount': fileCount,
          updatedAt: new Date()
        }
      });
      
      return sessionId;
      
    } catch (error: any) {
      // Handle GitHub API errors
      if (error.status === 401) {
        throw new Meteor.Error('github-auth-error', 'GitHub authentication failed. Please re-connect your GitHub account.');
      }
      if (error.status === 403) {
        throw new Meteor.Error('github-rate-limit', 'GitHub API rate limit exceeded. Please try again later.');
      }
      if (error.status === 404) {
        throw new Meteor.Error('pr-not-found', `Pull request not found. Make sure the repository is accessible and the PR exists.`);
      }
      
      console.error('GitHub import error:', error);
      throw new Meteor.Error('github-error', error.message || 'Failed to import pull request from GitHub');
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
    
    // Check session access
    const session = await Sessions.findOneAsync(sessionId);
    if (!session) {
      throw new Meteor.Error('session-not-found', 'Session not found');
    }
    if (session.createdBy !== this.userId) {
      throw new Meteor.Error('not-authorized', 'Only the session owner can import files');
    }
    
    // Parse the PR URL
    const prInfo = parseGitHubPRUrl(prUrl);
    if (!prInfo) {
      throw new Meteor.Error('invalid-url', 'Invalid GitHub PR URL');
    }
    
    // Get GitHub token
    const token = getGitHubToken(this.userId);
    if (!token) {
      throw new Meteor.Error('no-github-token', 'Please connect your GitHub account');
    }
    
    const octokit = createOctokit(token);
    
    try {
      const prData = await fetchPRDetails(octokit, prInfo.owner, prInfo.repo, prInfo.prNumber);
      const prFiles = await fetchPRFiles(octokit, prInfo.owner, prInfo.repo, prInfo.prNumber);
      
      let fileCount = 0;
      const now = new Date();
      
      for (const prFile of prFiles) {
        try {
          let originalContent: string | undefined;
          let content = '';
          
          if (prFile.status === 'removed' || prFile.status === 'modified' || prFile.status === 'renamed') {
            const pathToFetch = prFile.previous_filename || prFile.filename;
            originalContent = await fetchFileContent(
              octokit,
              prInfo.owner,
              prInfo.repo,
              pathToFetch,
              prData.base.sha
            ) || '';
          }
          
          if (prFile.status === 'added' || prFile.status === 'modified' || prFile.status === 'renamed' || prFile.status === 'changed') {
            const fetchedContent = await fetchFileContent(
              octokit,
              prInfo.owner,
              prInfo.repo,
              prFile.filename,
              prData.head.sha
            );
            content = fetchedContent || '';
          }
          
          const hunks = parsePatch(prFile.patch);
          const name = prFile.filename.split('/').pop() || prFile.filename;
          const extension = name.includes('.') ? name.split('.').pop() || '' : '';
          const language = detectLanguage(name);
          
          await Files.insertAsync({
            _id: nanoid(),
            sessionId,
            path: prFile.filename,
            name,
            extension,
            size: content.length,
            content,
            originalContent,
            encoding: 'utf-8',
            language,
            isDeleted: prFile.status === 'removed',
            isAdded: prFile.status === 'added',
            isModified: prFile.status === 'modified' || prFile.status === 'changed',
            isRenamed: prFile.status === 'renamed',
            oldPath: prFile.previous_filename,
            hunks,
            isReviewed: false,
            reviewedBy: [],
            createdAt: now,
            updatedAt: now
          } as File);
          
          fileCount++;
        } catch (fileError: any) {
          console.error(`Error processing file ${prFile.filename}:`, fileError.message);
        }
      }
      
      // Update session
      await Sessions.updateAsync(sessionId, {
        $set: {
          source: {
            type: 'github',
            url: prData.html_url,
            repository: `${prInfo.owner}/${prInfo.repo}`,
            prNumber: prInfo.prNumber,
            branch: prData.head.ref,
            commit: prData.head.sha
          },
          updatedAt: new Date()
        },
        $inc: { 'stats.fileCount': fileCount }
      });
      
      return { fileCount };
      
    } catch (error: any) {
      if (error.status === 401) {
        throw new Meteor.Error('github-auth-error', 'GitHub authentication failed');
      }
      if (error.status === 403) {
        throw new Meteor.Error('github-rate-limit', 'GitHub API rate limit exceeded');
      }
      if (error.status === 404) {
        throw new Meteor.Error('pr-not-found', 'Pull request not found');
      }
      
      throw new Meteor.Error('github-error', error.message || 'Failed to import pull request');
    }
  },
  
  /**
   * Check if user has GitHub connected
   */
  'github.checkConnection'() {
    if (!this.userId) {
      return { connected: false };
    }
    
    const token = getGitHubToken(this.userId);
    const user = Meteor.users.findOne(this.userId);
    const services = user?.services as any;
    
    return {
      connected: !!token,
      username: services?.github?.username || null
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
    
    const token = getGitHubToken(this.userId);
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
        author: prData.user.login
      };
    } catch (error: any) {
      if (error.status === 404) {
        throw new Meteor.Error('pr-not-found', 'Pull request not found or not accessible');
      }
      throw new Meteor.Error('github-error', error.message);
    }
  }
});
