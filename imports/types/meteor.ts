/**
 * Extended Meteor types for OAuth and user profiles
 */

// GitHub service data stored by accounts-github
export interface GitHubServiceData {
  id: number;
  accessToken: string;
  username: string;
  email?: string;
  avatar_url?: string;
}

// User services object
export interface UserServices {
  github?: GitHubServiceData;
  password?: {
    bcrypt: string;
  };
  resume?: {
    loginTokens: Array<{
      when: Date;
      hashedToken: string;
    }>;
  };
}

// User profile
export interface UserProfile {
  name?: string;
  avatar?: string;
}

// Extended Meteor user with proper typing
export interface MeteorUser {
  _id: string;
  username?: string;
  emails?: Array<{
    address: string;
    verified: boolean;
  }>;
  profile?: UserProfile;
  services?: UserServices;
  createdAt?: Date;
}

// Meteor method callback error
export interface MeteorError {
  error: string | number;
  reason?: string;
  message: string;
  details?: string;
}

// Generic Meteor method callback
export type MethodCallback<T = void> = (error: MeteorError | null, result?: T) => void;

// GitHub connection check result
export interface GitHubConnectionStatus {
  connected: boolean;
  username: string | null;
}

// GitHub PR validation result
export interface GitHubPRValidationResult {
  valid: boolean;
  owner: string;
  repo: string;
  prNumber: number;
  title: string;
  state: string;
  fileCount: number;
  author: string;
}

// Session invite result
export interface SessionInviteResult {
  status: 'added' | 'already_invited' | 'invited';
  inviteUrl?: string;
}

// Diff line with optional hunk header flag
export interface DiffLineWithHeader {
  type: 'add' | 'remove' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
  isHunkHeader?: boolean;
}
