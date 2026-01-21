import { Mongo } from 'meteor/mongo';

export interface SessionInvite {
  _id: string;
  sessionId: string;
  email: string;
  invitedBy: string;
  invitedAt: Date;
  token: string;
  acceptedAt?: Date;
  acceptedBy?: string;
}

export const SessionInvites = new Mongo.Collection<SessionInvite>('session_invites');

SessionInvites.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; }
});
