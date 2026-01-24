/**
 * Database schema using Drizzle ORM
 * PostgreSQL tables for CodeSync
 */

import { pgTable, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { SessionSource, SessionSettings, DiffHunk } from '@codesync/shared';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash'),
  name: text('name'),
  githubId: text('github_id').unique(),
  githubUsername: text('github_username'),
  githubAccessToken: text('github_access_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  title: text('title').notNull(),
  description: text('description'),
  createdBy: text('created_by').references(() => users.id).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  shareToken: text('share_token'),
  status: text('status').$type<'draft' | 'in_review' | 'approved' | 'merged'>().default('draft').notNull(),
  source: jsonb('source').$type<SessionSource>(),
  settings: jsonb('settings').$type<SessionSettings>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const files = pgTable('files', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  path: text('path').notNull(),
  name: text('name').notNull(),
  content: text('content'),
  originalContent: text('original_content'),
  language: text('language'),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  isAdded: boolean('is_added').default(false).notNull(),
  isModified: boolean('is_modified').default(false).notNull(),
  isReviewed: boolean('is_reviewed').default(false).notNull(),
  hunks: jsonb('hunks').$type<DiffHunk[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const comments = pgTable('comments', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  fileId: text('file_id').references(() => files.id, { onDelete: 'cascade' }).notNull(),
  authorId: text('author_id').references(() => users.id).notNull(),
  lineNumber: integer('line_number'),
  text: text('text').notNull(),
  parentId: text('parent_id'),
  threadId: text('thread_id'),
  isResolved: boolean('is_resolved').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  authorId: text('author_id').references(() => users.id).notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessionParticipants = pgTable('session_participants', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  role: text('role').$type<'owner' | 'reviewer' | 'viewer'>().default('viewer').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  comments: many(comments),
  chatMessages: many(chatMessages),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  creator: one(users, {
    fields: [sessions.createdBy],
    references: [users.id],
  }),
  files: many(files),
  comments: many(comments),
  chatMessages: many(chatMessages),
  participants: many(sessionParticipants),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
  session: one(sessions, {
    fields: [files.sessionId],
    references: [sessions.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  session: one(sessions, {
    fields: [comments.sessionId],
    references: [sessions.id],
  }),
  file: one(files, {
    fields: [comments.fileId],
    references: [files.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(sessions, {
    fields: [chatMessages.sessionId],
    references: [sessions.id],
  }),
  author: one(users, {
    fields: [chatMessages.authorId],
    references: [users.id],
  }),
}));

export const sessionParticipantsRelations = relations(sessionParticipants, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionParticipants.sessionId],
    references: [sessions.id],
  }),
  user: one(users, {
    fields: [sessionParticipants.userId],
    references: [users.id],
  }),
}));
