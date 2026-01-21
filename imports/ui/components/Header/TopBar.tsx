import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Session } from "../../../api/sessions/sessions";
import { Button } from "../UI/Button";
import { Modal } from "../UI/Modal";
import { useToast } from "../UI/Toast";
import { ShareButton } from "./ShareButton";

interface TopBarProps {
	session: Session;
}

export const TopBar: React.FC<TopBarProps> = ({ session }) => {
	const navigate = useNavigate();
	const [showSettings, setShowSettings] = useState(false);
	const [showReviewModal, setShowReviewModal] = useState(false);
	const [reviewAction, setReviewAction] = useState<
		"approve" | "request_changes" | null
	>(null);
	const { showToast } = useToast();

	const user = useTracker(() => Meteor.user(), []);
	const profile = user?.profile as any;
	const services = user?.services as any;
	const userName =
		profile?.name ||
		services?.github?.username ||
		user?.emails?.[0]?.address ||
		"Anonymous";

	const isOwner = session.createdBy === Meteor.userId();
	const isReviewer = session.reviewers.some(
		(r) => r.userId === Meteor.userId(),
	);
	const myReview = session.reviewers.find((r) => r.userId === Meteor.userId());
	const canReview =
		isReviewer &&
		session.status === "in_review" &&
		myReview?.status === "pending";

	const handleLogout = () => {
		Meteor.logout(() => {
			navigate("/login");
		});
	};

	const handleStartReview = () => {
		Meteor.call("sessions.startReview", session._id, (err: any) => {
			if (err) {
				showToast(err.reason || "Failed to start review", "error");
			} else {
				showToast("Review started", "success");
			}
		});
	};

	const handleSubmitReview = (status: "approved" | "changes_requested") => {
		Meteor.call("sessions.submitReview", session._id, status, (err: any) => {
			if (err) {
				showToast(err.reason || "Failed to submit review", "error");
			} else {
				showToast(
					status === "approved" ? "Review approved!" : "Changes requested",
					"success",
				);
				setShowReviewModal(false);
			}
		});
	};

	const handleMerge = () => {
		Meteor.call("sessions.merge", session._id, (err: any) => {
			if (err) {
				showToast(err.reason || "Failed to merge", "error");
			} else {
				showToast("Session merged!", "success");
			}
		});
	};

	const statusColors = {
		draft: "bg-gray-500",
		in_review: "bg-blue-500",
		approved: "bg-green-500",
		changes_requested: "bg-orange-500",
		merged: "bg-purple-500",
	};

	const statusLabels = {
		draft: "Draft",
		in_review: "In Review",
		approved: "Approved",
		changes_requested: "Changes Requested",
		merged: "Merged",
	};

	return (
		<header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
			<div className="flex items-center gap-4">
				{/* Logo */}
				<button
					onClick={() => navigate("/dashboard")}
					className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
				>
					<svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
					</svg>
					<span className="font-bold hidden sm:inline">CodeSync</span>
				</button>

				{/* Separator */}
				<span className="text-gray-300 dark:text-gray-600">/</span>

				{/* Session info */}
				<div className="flex items-center gap-3">
					<h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-md">
						{session.title}
					</h1>

					<span
						className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${statusColors[session.status]}`}
					>
						{statusLabels[session.status]}
					</span>

					{session.source.type === "github" && session.source.prNumber && (
						<a
							href={session.source.url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
						>
							#{session.source.prNumber}
						</a>
					)}
				</div>
			</div>

			<div className="flex items-center gap-3">
				{/* Review Actions */}
				{isOwner && session.status === "draft" && (
					<Button onClick={handleStartReview} size="sm">
						Start Review
					</Button>
				)}

				{canReview && (
					<>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								setReviewAction("request_changes");
								setShowReviewModal(true);
							}}
						>
							<svg
								className="w-4 h-4 mr-1"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							Request Changes
						</Button>
						<Button
							size="sm"
							onClick={() => {
								setReviewAction("approve");
								setShowReviewModal(true);
							}}
							className="bg-green-600 hover:bg-green-700"
						>
							<svg
								className="w-4 h-4 mr-1"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
							Approve
						</Button>
					</>
				)}

				{isOwner && session.status === "approved" && (
					<Button
						size="sm"
						onClick={handleMerge}
						className="bg-purple-600 hover:bg-purple-700"
					>
						<svg
							className="w-4 h-4 mr-1"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
							/>
						</svg>
						Merge
					</Button>
				)}

				{/* Share button */}
				<ShareButton session={session} />

				{/* Settings (for owner) */}
				{isOwner && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowSettings(true)}
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
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					</Button>
				)}

				{/* User menu */}
				<div className="relative group">
					<button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
						<div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
							{userName.charAt(0).toUpperCase()}
						</div>
						<span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
							{userName}
						</span>
					</button>

					{/* Dropdown */}
					<div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
						<div className="py-1">
							<button
								onClick={() => navigate("/dashboard")}
								className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
							>
								Dashboard
							</button>
							<button
								onClick={handleLogout}
								className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
							>
								Sign out
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Settings Modal */}
			<Modal
				isOpen={showSettings}
				onClose={() => setShowSettings(false)}
				title="Session Settings"
				size="md"
			>
				<SessionSettings
					session={session}
					onClose={() => setShowSettings(false)}
				/>
			</Modal>

			{/* Review Modal */}
			<Modal
				isOpen={showReviewModal}
				onClose={() => setShowReviewModal(false)}
				title={
					reviewAction === "approve" ? "Approve Review" : "Request Changes"
				}
				size="md"
			>
				<ReviewSubmitForm
					action={reviewAction}
					onSubmit={handleSubmitReview}
					onCancel={() => setShowReviewModal(false)}
				/>
			</Modal>
		</header>
	);
};

interface ReviewSubmitFormProps {
	action: "approve" | "request_changes" | null;
	onSubmit: (status: "approved" | "changes_requested") => void;
	onCancel: () => void;
}

const ReviewSubmitForm: React.FC<ReviewSubmitFormProps> = ({
	action,
	onSubmit,
	onCancel,
}) => {
	const [comment, setComment] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = () => {
		setSubmitting(true);
		onSubmit(action === "approve" ? "approved" : "changes_requested");
	};

	return (
		<div className="space-y-4">
			<p className="text-gray-600 dark:text-gray-400">
				{action === "approve"
					? "You are about to approve this code review."
					: "You are requesting changes to this code review."}
			</p>

			<div>
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					Comment (optional)
				</label>
				<textarea
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					rows={3}
					placeholder={
						action === "approve"
							? "LGTM! 🎉"
							: "Please address the following..."
					}
					className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div className="flex justify-end gap-3 pt-4">
				<Button variant="secondary" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					loading={submitting}
					className={
						action === "approve"
							? "bg-green-600 hover:bg-green-700"
							: "bg-orange-600 hover:bg-orange-700"
					}
				>
					{action === "approve" ? "Approve" : "Request Changes"}
				</Button>
			</div>
		</div>
	);
};

interface SessionSettingsProps {
	session: Session;
	onClose: () => void;
}

const SessionSettings: React.FC<SessionSettingsProps> = ({
	session,
	onClose,
}) => {
	const [title, setTitle] = useState(session.title);
	const [description, setDescription] = useState(session.description || "");
	const [isPublic, setIsPublic] = useState(session.isPublic);
	const [diffMode, setDiffMode] = useState(session.settings.diffMode);
	const [saving, setSaving] = useState(false);

	const handleSave = () => {
		setSaving(true);
		Meteor.call(
			"sessions.update",
			session._id,
			{
				title,
				description,
				isPublic,
				settings: {
					...session.settings,
					diffMode,
				},
			},
			(error: any) => {
				setSaving(false);
				if (!error) {
					onClose();
				}
			},
		);
	};

	return (
		<div className="space-y-4">
			<div>
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					Title
				</label>
				<input
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					Description
				</label>
				<textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={3}
					className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					Diff Mode
				</label>
				<select
					value={diffMode}
					onChange={(e) => setDiffMode(e.target.value as any)}
					className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
				>
					<option value="unified">Unified</option>
					<option value="split">Split</option>
				</select>
			</div>

			<div className="flex items-center gap-2">
				<input
					type="checkbox"
					id="isPublic"
					checked={isPublic}
					onChange={(e) => setIsPublic(e.target.checked)}
					className="w-4 h-4 text-blue-600 rounded"
				/>
				<label
					htmlFor="isPublic"
					className="text-sm text-gray-700 dark:text-gray-300"
				>
					Make this session public
				</label>
			</div>

			<div className="flex justify-end gap-3 pt-4">
				<Button variant="secondary" onClick={onClose}>
					Cancel
				</Button>
				<Button onClick={handleSave} loading={saving}>
					Save Changes
				</Button>
			</div>
		</div>
	);
};
