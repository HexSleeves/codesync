/**
 * GitHub services - centralized exports
 */

export { processPRFile, processPRFiles, type PRFileInfo, type PRContext } from './file-processor';
export { handleGitHubError, handleGitHubErrorBrief } from './error-handler';
