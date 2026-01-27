/**
 * Zod schemas for validation
 * Used by both API (server-side) and Client (form validation)
 */

import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

// Session schemas
export const sessionSourceSchema = z.object({
  type: z.enum(['manual', 'github']),
  url: z.url().optional(),
  repository: z.string().optional(),
  prNumber: z.number().int().positive().optional(),
  branch: z.string().optional(),
  commit: z.string().optional(),
});

export const createSessionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().default(false),
  source: sessionSourceSchema.optional(),
});

export const updateSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().optional(),
});

// Session status transition schema
export const sessionStatusSchema = z.enum(['draft', 'in_review', 'approved', 'merged']);

export const updateSessionStatusSchema = z.object({
  status: sessionStatusSchema,
});

// File schemas
export const createFileSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  name: z.string().min(1, 'Name is required'),
  content: z.string(),
  originalContent: z.string().optional(),
  language: z.string().optional(),
  isDeleted: z.boolean().default(false),
  isAdded: z.boolean().default(false),
  isModified: z.boolean().default(false),
});

export const updateFileSchema = z.object({
  content: z.string().optional(),
  isReviewed: z.boolean().optional(),
});

// Comment schemas
export const createCommentSchema = z.object({
  text: z.string().min(1, 'Comment text is required').max(5000),
  lineNumber: z.number().int().positive().optional(),
  parentId: z.string().optional(),
  threadId: z.string().optional(),
});

export const updateCommentSchema = z.object({
  text: z.string().min(1).max(5000).optional(),
  isResolved: z.boolean().optional(),
});

// Chat schemas
export const sendChatMessageSchema = z.object({
  text: z.string().min(1, 'Message is required').max(2000),
});

// GitHub schemas
export const importPRSchema = z.object({
  prUrl: z.url('Invalid PR URL'),
  sessionId: z.string().optional(), // If importing to existing session
});

export const validatePRUrlSchema = z.object({
  prUrl: z.url('Invalid PR URL'),
});

// WebSocket message schemas
export const cursorUpdateSchema = z.object({
  type: z.literal('cursor'),
  fileId: z.string().nullable(),
  line: z.number().int(),
  column: z.number().int(),
});

export const presenceSchema = z.object({
  type: z.enum(['join', 'leave']),
  userId: z.string(),
  userName: z.string(),
});

// Export types inferred from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type CreateFileInput = z.infer<typeof createFileSchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
export type ImportPRInput = z.infer<typeof importPRSchema>;
export type ValidatePRUrlInput = z.infer<typeof validatePRUrlSchema>;
export type CursorUpdate = z.infer<typeof cursorUpdateSchema>;
export type Presence = z.infer<typeof presenceSchema>;
