import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { ChatMessages, ChatMessage, CodeSnippet } from "./chat";
import { Sessions } from "../sessions/collection";
import { canAccessSession } from "../sessions/methods";
import { nanoid } from "nanoid";

function extractMentions(text: string): string[] {
  const regex = /@(\w+)/g;
  const matches = text.match(regex);
  return matches ? matches.map((m) => m.substring(1)) : [];
}

interface UserServices {
  github?: {
    username?: string;
    avatar_url?: string;
  };
}

interface UserProfile {
  name?: string;
  avatar?: string;
}

Meteor.methods({
  async "chat.send"(data: {
    sessionId: string;
    message: string;
    code?: CodeSnippet;
  }) {
    check(data.sessionId, String);
    check(data.message, String);

    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }

    const hasAccess = await canAccessSession(data.sessionId, this.userId);
    if (!hasAccess) {
      throw new Meteor.Error("not-authorized");
    }

    const user = await Meteor.users.findOneAsync(this.userId);
    const profile = user?.profile as UserProfile;
    const services = user?.services as UserServices;
    const githubUsername = services?.github?.username;
    const githubAvatar = services?.github?.avatar_url;

    const messageId = await ChatMessages.insertAsync({
      _id: nanoid(),
      sessionId: data.sessionId,
      userId: this.userId,
      userName:
        profile?.name ||
        githubUsername ||
        user?.emails?.[0]?.address ||
        "Anonymous",
      userAvatar: profile?.avatar || githubAvatar,
      message: data.message,
      type: data.code ? "code_snippet" : "text",
      code: data.code,
      mentions: extractMentions(data.message),
      reactions: [],
      createdAt: new Date(),
    } as ChatMessage);

    return messageId;
  },

  async "chat.edit"(messageId: string, message: string) {
    check(messageId, String);
    check(message, String);

    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }

    const chatMessage = await ChatMessages.findOneAsync(messageId);
    if (!chatMessage) {
      throw new Meteor.Error("message-not-found");
    }

    if (chatMessage.userId !== this.userId) {
      throw new Meteor.Error("not-authorized");
    }

    await ChatMessages.updateAsync(messageId, {
      $set: {
        message,
        editedAt: new Date(),
        mentions: extractMentions(message),
      },
    });
  },

  async "chat.delete"(messageId: string) {
    check(messageId, String);

    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }

    const chatMessage = await ChatMessages.findOneAsync(messageId);
    if (!chatMessage) {
      throw new Meteor.Error("message-not-found");
    }

    if (chatMessage.userId !== this.userId) {
      const session = await Sessions.findOneAsync(chatMessage.sessionId);
      if (session?.createdBy !== this.userId) {
        throw new Meteor.Error("not-authorized");
      }
    }

    await ChatMessages.updateAsync(messageId, {
      $set: { deletedAt: new Date() },
    });
  },

  async "chat.addReaction"(messageId: string, emoji: string) {
    check(messageId, String);
    check(emoji, String);

    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }

    const chatMessage = await ChatMessages.findOneAsync(messageId);
    if (!chatMessage) {
      throw new Meteor.Error("message-not-found");
    }

    const existingReaction = chatMessage.reactions.find(
      (r) => r.emoji === emoji,
    );

    if (existingReaction) {
      if (existingReaction.users.includes(this.userId)) {
        // Remove user from reaction
        await ChatMessages.updateAsync(
          { _id: messageId, "reactions.emoji": emoji },
          { $pull: { "reactions.$.users": this.userId } },
        );

        // Remove empty reactions
        await ChatMessages.updateAsync(
          {
            _id: messageId,
            "reactions.emoji": emoji,
            "reactions.users": { $size: 0 },
          },
          { $pull: { reactions: { emoji } } },
        );
      } else {
        // Add user to existing reaction
        await ChatMessages.updateAsync(
          { _id: messageId, "reactions.emoji": emoji },
          { $push: { "reactions.$.users": this.userId } },
        );
      }
    } else {
      // Add new reaction
      await ChatMessages.updateAsync(messageId, {
        $push: {
          reactions: {
            emoji,
            users: [this.userId],
          },
        },
      });
    }
  },

  async "chat.sendSystemMessage"(sessionId: string, message: string) {
    check(sessionId, String);
    check(message, String);

    // System messages can only be sent server-side
    if (!this.isSimulation) {
      await ChatMessages.insertAsync({
        _id: nanoid(),
        sessionId,
        userId: "system",
        userName: "System",
        message,
        type: "system",
        mentions: [],
        reactions: [],
        createdAt: new Date(),
      } as ChatMessage);
    }
  },
});
