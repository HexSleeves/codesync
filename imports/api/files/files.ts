import { Mongo } from "meteor/mongo";

export interface DiffLine {
	type: "add" | "remove" | "context";
	content: string;
	oldLineNumber?: number;
	newLineNumber?: number;
}

export interface Hunk {
	oldStart: number;
	oldLines: number;
	newStart: number;
	newLines: number;
	lines: DiffLine[];
}

export interface File {
	_id: string;
	sessionId: string;
	path: string;
	name: string;
	extension: string;
	size: number;
	content: string;
	originalContent?: string;
	encoding: "utf-8" | "base64";
	language: string;
	isDeleted: boolean;
	isAdded: boolean;
	isModified: boolean;
	isRenamed: boolean;
	oldPath?: string;
	hunks?: Hunk[];
	isReviewed: boolean;
	reviewedBy: string[];
	createdAt: Date;
	updatedAt: Date;
}

export const Files = new Mongo.Collection<File>("files");

Files.deny({
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
