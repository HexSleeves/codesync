import { Meteor } from "meteor/meteor";
import type React from "react";
import { useState } from "react";
import type { Comment } from "../../../api/comments/comments";
import { useThreadComments } from "../../hooks/useComments";
import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";

interface CommentThreadProps {
	sessionId: string;
	fileId: string;
	lineNumber: number;
	rootComments: Comment[];
	onClose: () => void;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
	sessionId,
	fileId,
	lineNumber,
	rootComments,
	onClose,
}) => {
	const [replyingTo, setReplyingTo] = useState<string | null>(null);

	const handleAddComment = (text: string, parentId?: string) => {
		Meteor.call(
			"comments.add",
			{
				sessionId,
				fileId,
				lineNumber,
				text,
				parentId,
			},
			(error: any) => {
				if (error) {
					console.error("Error adding comment:", error);
				} else {
					setReplyingTo(null);
				}
			},
		);
	};

	const handleResolve = (commentId: string) => {
		Meteor.call("comments.resolve", commentId);
	};

	const handleUnresolve = (commentId: string) => {
		Meteor.call("comments.unresolve", commentId);
	};

	return (
		<div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 flex flex-col z-40">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
				<h3 className="font-semibold text-gray-900 dark:text-white">
					Comments on line {lineNumber}
				</h3>
				<button
					onClick={onClose}
					className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
				>
					<svg
						className="w-5 h-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			{/* Comments list */}
			<div className="flex-1 overflow-y-auto">
				{rootComments.length === 0 ? (
					<div className="p-4 text-center text-gray-500">
						<p>No comments yet</p>
						<p className="text-sm mt-1">Be the first to leave a comment!</p>
					</div>
				) : (
					<div className="divide-y divide-gray-100 dark:divide-gray-700">
						{rootComments.map((comment) => (
							<CommentWithReplies
								key={comment._id}
								comment={comment}
								replyingTo={replyingTo}
								onReply={setReplyingTo}
								onResolve={handleResolve}
								onUnresolve={handleUnresolve}
								onSubmitReply={(text) => handleAddComment(text, comment._id)}
							/>
						))}
					</div>
				)}
			</div>

			{/* New comment input */}
			<div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
				<CommentInput
					placeholder="Add a comment..."
					onSubmit={(text) => handleAddComment(text)}
				/>
			</div>
		</div>
	);
};

interface CommentWithRepliesProps {
	comment: Comment;
	replyingTo: string | null;
	onReply: (commentId: string | null) => void;
	onResolve: (commentId: string) => void;
	onUnresolve: (commentId: string) => void;
	onSubmitReply: (text: string) => void;
}

const CommentWithReplies: React.FC<CommentWithRepliesProps> = ({
	comment,
	replyingTo,
	onReply,
	onResolve,
	onUnresolve,
	onSubmitReply,
}) => {
	const { comments: replies } = useThreadComments(comment._id);
	const threadReplies = replies.filter((r) => r._id !== comment._id);

	return (
		<div className="p-4">
			<CommentItem
				comment={comment}
				onReply={() => onReply(comment._id)}
				onResolve={() =>
					comment.isResolved ? onUnresolve(comment._id) : onResolve(comment._id)
				}
			/>

			{/* Replies */}
			{threadReplies.length > 0 && (
				<div className="ml-8 mt-3 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
					{threadReplies.map((reply) => (
						<CommentItem key={reply._id} comment={reply} compact />
					))}
				</div>
			)}

			{/* Reply input */}
			{replyingTo === comment._id && (
				<div className="ml-8 mt-3">
					<CommentInput
						placeholder="Write a reply..."
						onSubmit={onSubmitReply}
						onCancel={() => onReply(null)}
						autoFocus
					/>
				</div>
			)}
		</div>
	);
};
