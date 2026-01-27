/**
 * Shared domain types for CodeSync
 * Used by both API and Client packages
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  githubId: string | null;
  githubUsername: string | null;
  createdAt: Date;
}

export type SessionStatus = 'draft' | 'in_review' | 'approved' | 'merged';

export interface Session {
  id: string;
  title: string;
  description: string | null;
  createdBy: string;
  isPublic: boolean;
  shareToken: string | null;
  status: SessionStatus;
  source: SessionSource | null;
  settings: SessionSettings | null;
  // Review workflow tracking
  reviewStartedAt: Date | null;
  reviewStartedBy: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  mergedAt: Date | null;
  mergedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined data (populated by API)
  reviewer?: User | null;
  approver?: User | null;
  merger?: User | null;
}

export interface SessionSource {
  type: 'manual' | 'github';
  url?: string;
  repository?: string;
  prNumber?: number;
  branch?: string;
  commit?: string;
}

export interface SessionSettings {
  requireApproval?: boolean;
  allowComments?: boolean;
  diffView?: 'unified' | 'split';
}

export interface File {
  id: string;
  sessionId: string;
  path: string;
  name: string;
  content: string | null;
  originalContent: string | null;
  language: string | null;
  isDeleted: boolean;
  isAdded: boolean;
  isModified: boolean;
  isReviewed: boolean;
  hunks: DiffHunk[] | null;
  createdAt: Date;
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface Comment {
  id: string;
  sessionId: string;
  fileId: string;
  authorId: string;
  lineNumber: number | null;
  text: string;
  parentId: string | null;
  threadId: string | null;
  isResolved: boolean;
  createdAt: Date;
  // Joined data
  author?: User;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  authorId: string;
  text: string;
  createdAt: Date;
  // Joined data
  author?: User;
}

export interface CursorPosition {
  userId: string;
  sessionId: string;
  fileId: string | null;
  line: number;
  column: number;
  userName: string;
  color: string;
}

export interface SessionParticipant {
  userId: string;
  sessionId: string;
  role: 'owner' | 'reviewer' | 'viewer';
  isOnline: boolean;
  user?: User;
}
