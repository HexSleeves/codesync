import { Mongo } from 'meteor/mongo';

export interface SessionReviewer {
  userId: string;
  status: 'pending' | 'approved' | 'changes_requested';
  reviewedAt?: Date;
}

export interface SessionSettings {
  diffMode: 'unified' | 'split' | 'inline';
  theme: 'light' | 'dark' | 'high-contrast';
  showWhitespace: boolean;
  tabSize: number;
}

export interface SessionSource {
  type: 'github' | 'gitlab' | 'upload' | 'manual';
  url?: string;
  repository?: string;
  prNumber?: number;
  branch?: string;
  commit?: string;
}

export interface SessionStats {
  fileCount: number;
  commentCount: number;
  activeUsers: number;
}

export interface Session {
  _id: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  allowedUsers: string[];
  shareToken?: string;
  source: SessionSource;
  status: 'draft' | 'in_review' | 'approved' | 'changes_requested' | 'merged';
  reviewers: SessionReviewer[];
  settings: SessionSettings;
  stats: SessionStats;
}

export const Sessions = new Mongo.Collection<Session>('sessions');

// Deny all client-side modifications - use methods only
Sessions.deny({
  insert() {
    return true;
  },
  update() {
    return true;
  },
  remove() {
    return true;
  },
});
