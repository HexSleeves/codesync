/**
 * GitHub File Processor Service
 * Processes PR files and creates database records
 */

import type { Octokit } from '@octokit/rest';
import { nanoid } from 'nanoid';
import { db } from '../../db/client';
import { files } from '../../db/schema';
import { parsePatch } from '../../utils/github-parser';
import { detectLanguage, getFilename } from '../../utils/language';
import { fetchFileContent, type GitHubPRFile } from './pr-fetcher';

/**
 * Context for processing files
 */
export interface FileProcessingContext {
  owner: string;
  repo: string;
  baseSha: string;
  headSha: string;
}

export interface ProcessPRFilesResult {
  processedCount: number;
  failedCount: number;
  failedFiles: string[];
}

/**
 * Process a single PR file and insert into database
 * @returns true if successful, false otherwise
 */
export async function processPRFile(
  octokit: Octokit,
  sessionId: string,
  prFile: GitHubPRFile,
  context: FileProcessingContext
): Promise<boolean> {
  try {
    let originalContent: string | null = null;
    let content: string | null = null;

    // Fetch original content for modified/deleted/renamed files
    if (
      prFile.status === 'removed' ||
      prFile.status === 'modified' ||
      prFile.status === 'renamed'
    ) {
      const pathToFetch = prFile.previous_filename || prFile.filename;
      originalContent = await fetchFileContent(
        octokit,
        context.owner,
        context.repo,
        pathToFetch,
        context.baseSha
      );
    }

    // Fetch new content for added/modified/renamed/changed files
    if (
      prFile.status === 'added' ||
      prFile.status === 'modified' ||
      prFile.status === 'renamed' ||
      prFile.status === 'changed'
    ) {
      content = await fetchFileContent(
        octokit,
        context.owner,
        context.repo,
        prFile.filename,
        context.headSha
      );
    }

    // Parse patch into hunks
    const hunks = parsePatch(prFile.patch);

    // Get filename and detect language
    const name = getFilename(prFile.filename);
    const language = detectLanguage(name);

    await db.insert(files).values({
      id: nanoid(),
      sessionId,
      path: prFile.filename,
      name,
      content,
      originalContent,
      language,
      isDeleted: prFile.status === 'removed',
      isAdded: prFile.status === 'added',
      isModified:
        prFile.status === 'modified' || prFile.status === 'changed' || prFile.status === 'renamed',
      isReviewed: false,
      hunks,
    });

    return true;
  } catch (error) {
    console.error(`Error processing file ${prFile.filename}:`, error);
    return false;
  }
}

/**
 * Process multiple PR files with bounded concurrency
 * @returns count of successfully processed files
 */
export async function processPRFiles(
  octokit: Octokit,
  sessionId: string,
  prFiles: GitHubPRFile[],
  context: FileProcessingContext
): Promise<ProcessPRFilesResult> {
  const CONCURRENCY = 5;
  let processedCount = 0;
  let failedCount = 0;
  const failedFiles: string[] = [];

  // Process in batches of CONCURRENCY
  for (let i = 0; i < prFiles.length; i += CONCURRENCY) {
    const batch = prFiles.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((prFile) => processPRFile(octokit, sessionId, prFile, context))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        processedCount++;
        return;
      }

      failedCount++;
      failedFiles.push(batch[index].filename);
    });
  }

  return {
    processedCount,
    failedCount,
    failedFiles,
  };
}
