/**
 * GitHub file processing service
 * Handles converting GitHub PR files into our internal file format
 */

import { Files, File } from '../../files/files';
import { nanoid } from 'nanoid';
import { detectLanguage } from '../../../ui/utils/file-icons';
import { parsePatch } from '../parser';
import { fetchFileContent } from '../fetcher';
import { isErrorWithMessage } from '../../../utils/errors';
import type { Octokit } from '@octokit/rest';

export interface PRFileInfo {
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'changed';
  patch?: string;
  previous_filename?: string;
}

export interface PRContext {
  owner: string;
  repo: string;
  baseSha: string;
  headSha: string;
}

/**
 * Process a single PR file and insert it into the database
 */
export async function processPRFile(
  octokit: Octokit,
  sessionId: string,
  prFile: PRFileInfo,
  context: PRContext
): Promise<boolean> {
  try {
    let originalContent: string | undefined;
    let content = '';

    // Fetch original content for modified/deleted files
    if (
      prFile.status === 'removed' ||
      prFile.status === 'modified' ||
      prFile.status === 'renamed'
    ) {
      const pathToFetch = prFile.previous_filename || prFile.filename;
      originalContent =
        (await fetchFileContent(
          octokit,
          context.owner,
          context.repo,
          pathToFetch,
          context.baseSha
        )) || '';
    }

    // Fetch new content for added/modified files
    if (
      prFile.status === 'added' ||
      prFile.status === 'modified' ||
      prFile.status === 'renamed' ||
      prFile.status === 'changed'
    ) {
      const fetchedContent = await fetchFileContent(
        octokit,
        context.owner,
        context.repo,
        prFile.filename,
        context.headSha
      );
      content = fetchedContent || '';
    } else if (prFile.status === 'removed') {
      content = '';
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
      createdAt: new Date(),
      updatedAt: new Date(),
    } as File);

    return true;
  } catch (fileError: unknown) {
    console.error(
      `Error processing file ${prFile.filename}:`,
      isErrorWithMessage(fileError) ? fileError.message : String(fileError)
    );
    return false;
  }
}

/**
 * Process multiple PR files and return the count of successfully processed files
 */
export async function processPRFiles(
  octokit: Octokit,
  sessionId: string,
  prFiles: PRFileInfo[],
  context: PRContext
): Promise<number> {
  let fileCount = 0;

  for (const prFile of prFiles) {
    const success = await processPRFile(octokit, sessionId, prFile, context);
    if (success) {
      fileCount++;
    }
  }

  return fileCount;
}
