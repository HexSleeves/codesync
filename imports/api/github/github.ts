import { Octokit } from "@octokit/rest";
import { Meteor } from "meteor/meteor";
import type { DiffLine, Hunk } from "../files/files";

export interface GitHubPRInfo {
	owner: string;
	repo: string;
	prNumber: number;
}

export interface GitHubPRData {
	title: string;
	body: string | null;
	head: {
		ref: string;
		sha: string;
	};
	base: {
		ref: string;
		sha: string;
	};
	user: {
		login: string;
	};
	html_url: string;
	state: string;
}

export interface GitHubPRFile {
	filename: string;
	status:
		| "added"
		| "removed"
		| "modified"
		| "renamed"
		| "copied"
		| "changed"
		| "unchanged";
	additions: number;
	deletions: number;
	changes: number;
	patch?: string;
	previous_filename?: string;
	sha: string;
	blob_url: string;
	raw_url: string;
	contents_url: string;
}

/**
 * Parse a GitHub PR URL to extract owner, repo, and PR number
 */
export function parseGitHubPRUrl(url: string): GitHubPRInfo | null {
	// Support formats:
	// https://github.com/owner/repo/pull/123
	// github.com/owner/repo/pull/123
	// owner/repo#123
	// owner/repo/pull/123

	const fullUrlMatch = url.match(
		/(?:https?:\/\/)?github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i,
	);
	if (fullUrlMatch) {
		return {
			owner: fullUrlMatch[1],
			repo: fullUrlMatch[2],
			prNumber: parseInt(fullUrlMatch[3], 10),
		};
	}

	// Short format: owner/repo#123
	const shortMatch = url.match(/^([^/]+)\/([^#]+)#(\d+)$/);
	if (shortMatch) {
		return {
			owner: shortMatch[1],
			repo: shortMatch[2],
			prNumber: parseInt(shortMatch[3], 10),
		};
	}

	// Path format: owner/repo/pull/123
	const pathMatch = url.match(/^([^/]+)\/([^/]+)\/pull\/(\d+)$/);
	if (pathMatch) {
		return {
			owner: pathMatch[1],
			repo: pathMatch[2],
			prNumber: parseInt(pathMatch[3], 10),
		};
	}

	return null;
}

/**
 * Get user's GitHub OAuth token from Meteor user services
 */
export async function getGitHubToken(userId: string): Promise<string | null> {
	const user = await Meteor.users.findOneAsync(userId);
	if (!user) return null;

	const services = user.services as any;
	return services?.github?.accessToken || null;
}

/**
 * Create an authenticated Octokit instance for a user
 */
export function createOctokit(token: string): Octokit {
	return new Octokit({
		auth: token,
	});
}

/**
 * Fetch PR details from GitHub
 */
export async function fetchPRDetails(
	octokit: Octokit,
	owner: string,
	repo: string,
	prNumber: number,
): Promise<GitHubPRData> {
	const { data } = await octokit.pulls.get({
		owner,
		repo,
		pull_number: prNumber,
	});

	return {
		title: data.title,
		body: data.body,
		head: {
			ref: data.head.ref,
			sha: data.head.sha,
		},
		base: {
			ref: data.base.ref,
			sha: data.base.sha,
		},
		user: {
			login: data.user?.login || "unknown",
		},
		html_url: data.html_url,
		state: data.state,
	};
}

/**
 * Fetch PR files (diff) from GitHub
 */
export async function fetchPRFiles(
	octokit: Octokit,
	owner: string,
	repo: string,
	prNumber: number,
): Promise<GitHubPRFile[]> {
	const files: GitHubPRFile[] = [];
	let page = 1;
	const perPage = 100;

	// GitHub API paginates PR files, so we need to fetch all pages
	while (true) {
		const { data } = await octokit.pulls.listFiles({
			owner,
			repo,
			pull_number: prNumber,
			per_page: perPage,
			page,
		});

		for (const file of data) {
			files.push({
				filename: file.filename,
				status: file.status as GitHubPRFile["status"],
				additions: file.additions,
				deletions: file.deletions,
				changes: file.changes,
				patch: file.patch,
				previous_filename: file.previous_filename || undefined,
				sha: file.sha || "",
				blob_url: file.blob_url,
				raw_url: file.raw_url,
				contents_url: file.contents_url,
			});
		}

		if (data.length < perPage) break;
		page++;
	}

	return files;
}

/**
 * Fetch file content from GitHub
 */
export async function fetchFileContent(
	octokit: Octokit,
	owner: string,
	repo: string,
	path: string,
	ref: string,
): Promise<string | null> {
	try {
		const { data } = await octokit.repos.getContent({
			owner,
			repo,
			path,
			ref,
		});

		if ("content" in data && data.content) {
			// GitHub returns base64 encoded content
			return Buffer.from(data.content, "base64").toString("utf-8");
		}
		return null;
	} catch (error: any) {
		// File doesn't exist at this ref (might be a new file)
		if (error.status === 404) {
			return null;
		}
		throw error;
	}
}

/**
 * Parse a GitHub patch into hunks
 */
export function parsePatch(patch: string | undefined): Hunk[] {
	if (!patch) return [];

	const hunks: Hunk[] = [];
	const lines = patch.split("\n");

	let currentHunk: Hunk | null = null;
	let oldLineNum = 0;
	let newLineNum = 0;

	for (const line of lines) {
		// Hunk header: @@ -old_start,old_lines +new_start,new_lines @@
		const hunkMatch = line.match(/^@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);

		if (hunkMatch) {
			if (currentHunk) {
				hunks.push(currentHunk);
			}

			const oldStart = parseInt(hunkMatch[1], 10);
			const oldLines = parseInt(hunkMatch[2] || "1", 10);
			const newStart = parseInt(hunkMatch[3], 10);
			const newLines = parseInt(hunkMatch[4] || "1", 10);

			currentHunk = {
				oldStart,
				oldLines,
				newStart,
				newLines,
				lines: [],
			};

			oldLineNum = oldStart;
			newLineNum = newStart;
		} else if (currentHunk) {
			let type: DiffLine["type"] = "context";
			let content = line;
			let oldLn: number | undefined;
			let newLn: number | undefined;

			if (line.startsWith("+")) {
				type = "add";
				content = line.substring(1);
				newLn = newLineNum++;
			} else if (line.startsWith("-")) {
				type = "remove";
				content = line.substring(1);
				oldLn = oldLineNum++;
			} else if (line.startsWith(" ") || line === "") {
				type = "context";
				content = line.startsWith(" ") ? line.substring(1) : line;
				oldLn = oldLineNum++;
				newLn = newLineNum++;
			} else if (line.startsWith("\\")) {
				// "\ No newline at end of file" marker - skip
				continue;
			} else {
				// Skip other lines (shouldn't happen in patches)
				continue;
			}

			currentHunk.lines.push({
				type,
				content,
				oldLineNumber: oldLn,
				newLineNumber: newLn,
			});
		}
	}

	if (currentHunk) {
		hunks.push(currentHunk);
	}

	return hunks;
}

/**
 * Reconstruct file content from base content and patch
 */
export function applyPatch(baseContent: string | null, hunks: Hunk[]): string {
	if (!baseContent || hunks.length === 0) {
		// If no base content, this is a new file - reconstruct from hunks
		if (hunks.length > 0) {
			const lines: string[] = [];
			for (const hunk of hunks) {
				for (const line of hunk.lines) {
					if (line.type === "add" || line.type === "context") {
						lines.push(line.content);
					}
				}
			}
			return lines.join("\n");
		}
		return "";
	}

	// For modified files, we already fetch the new content directly
	// This function is mainly for fallback reconstruction
	return baseContent;
}
