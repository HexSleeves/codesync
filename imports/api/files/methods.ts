import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { nanoid } from "nanoid";
import { detectLanguage } from "../../ui/utils/file-icons";
import { canAccessSession, canEditSession } from "../sessions/methods";
import { Sessions } from "../sessions/sessions";
import { type File, Files, Hunk } from "./files";

Meteor.methods({
	async "files.add"(
		sessionId: string,
		fileData: Omit<
			File,
			| "_id"
			| "sessionId"
			| "isReviewed"
			| "reviewedBy"
			| "createdAt"
			| "updatedAt"
		>,
	) {
		check(sessionId, String);

		if (!this.userId) {
			throw new Meteor.Error("not-authorized");
		}

		const hasAccess = await canEditSession(sessionId, this.userId);
		if (!hasAccess) {
			throw new Meteor.Error("not-authorized");
		}

		const fileId = await Files.insertAsync({
			_id: nanoid(),
			sessionId,
			...fileData,
			isReviewed: false,
			reviewedBy: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		} as File);

		// Update session stats
		await Sessions.updateAsync(sessionId, {
			$inc: { "stats.fileCount": 1 },
			$set: { updatedAt: new Date() },
		});

		return fileId;
	},

	async "files.addMultiple"(
		sessionId: string,
		filesData: Array<
			Omit<
				File,
				| "_id"
				| "sessionId"
				| "isReviewed"
				| "reviewedBy"
				| "createdAt"
				| "updatedAt"
			>
		>,
	) {
		check(sessionId, String);

		if (!this.userId) {
			throw new Meteor.Error("not-authorized");
		}

		const hasAccess = await canEditSession(sessionId, this.userId);
		if (!hasAccess) {
			throw new Meteor.Error("not-authorized");
		}

		const fileIds: string[] = [];
		const now = new Date();

		for (const fileData of filesData) {
			const fileId = await Files.insertAsync({
				_id: nanoid(),
				sessionId,
				...fileData,
				isReviewed: false,
				reviewedBy: [],
				createdAt: now,
				updatedAt: now,
			} as File);
			fileIds.push(fileId);
		}

		// Update session stats
		await Sessions.updateAsync(sessionId, {
			$inc: { "stats.fileCount": filesData.length },
			$set: { updatedAt: now },
		});

		return fileIds;
	},

	async "files.update"(
		fileId: string,
		updates: Partial<Pick<File, "content" | "originalContent" | "hunks">>,
	) {
		check(fileId, String);

		if (!this.userId) {
			throw new Meteor.Error("not-authorized");
		}

		const file = await Files.findOneAsync(fileId);
		if (!file) {
			throw new Meteor.Error("file-not-found");
		}

		const hasAccess = await canEditSession(file.sessionId, this.userId);
		if (!hasAccess) {
			throw new Meteor.Error("not-authorized");
		}

		await Files.updateAsync(fileId, {
			$set: {
				...updates,
				updatedAt: new Date(),
			},
		});
	},

	async "files.delete"(fileId: string) {
		check(fileId, String);

		if (!this.userId) {
			throw new Meteor.Error("not-authorized");
		}

		const file = await Files.findOneAsync(fileId);
		if (!file) {
			throw new Meteor.Error("file-not-found");
		}

		const hasAccess = await canEditSession(file.sessionId, this.userId);
		if (!hasAccess) {
			throw new Meteor.Error("not-authorized");
		}

		await Files.removeAsync(fileId);

		await Sessions.updateAsync(file.sessionId, {
			$inc: { "stats.fileCount": -1 },
			$set: { updatedAt: new Date() },
		});
	},

	async "files.markReviewed"(fileId: string) {
		check(fileId, String);

		if (!this.userId) {
			throw new Meteor.Error("not-authorized");
		}

		const file = await Files.findOneAsync(fileId);
		if (!file) {
			throw new Meteor.Error("file-not-found");
		}

		const hasAccess = await canAccessSession(file.sessionId, this.userId);
		if (!hasAccess) {
			throw new Meteor.Error("not-authorized");
		}

		await Files.updateAsync(fileId, {
			$set: { isReviewed: true },
			$addToSet: { reviewedBy: this.userId },
		});
	},

	async "files.unmarkReviewed"(fileId: string) {
		check(fileId, String);

		if (!this.userId) {
			throw new Meteor.Error("not-authorized");
		}

		const file = await Files.findOneAsync(fileId);
		if (!file) {
			throw new Meteor.Error("file-not-found");
		}

		const hasAccess = await canAccessSession(file.sessionId, this.userId);
		if (!hasAccess) {
			throw new Meteor.Error("not-authorized");
		}

		await Files.updateAsync(fileId, {
			$pull: { reviewedBy: this.userId },
		});

		// Check if any reviewers remain
		const updated = await Files.findOneAsync(fileId);
		if (updated && updated.reviewedBy.length === 0) {
			await Files.updateAsync(fileId, {
				$set: { isReviewed: false },
			});
		}
	},
});
