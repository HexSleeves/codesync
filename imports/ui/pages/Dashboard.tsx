import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/UI/Button";
import { Modal } from "../components/UI/Modal";
import { useMySessions } from "../hooks/useSession";

export const Dashboard: React.FC = () => {
	const navigate = useNavigate();
	const [showNewSession, setShowNewSession] = useState(false);
	const { sessions, isLoading } = useMySessions();

	const user = useTracker(() => Meteor.user(), []);
	const profile = user?.profile as any;
	const services = user?.services as any;
	const userName =
		profile?.name ||
		services?.github?.username ||
		user?.emails?.[0]?.address ||
		"Anonymous";

	const handleLogout = () => {
		Meteor.logout(() => navigate("/"));
	};

	const formatDate = (date: Date) => {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / 86400000);

		if (days === 0) return "Today";
		if (days === 1) return "Yesterday";
		if (days < 7) return `${days} days ago`;
		return date.toLocaleDateString();
	};

	const statusColors = {
		draft: "bg-gray-500",
		in_review: "bg-blue-500",
		approved: "bg-green-500",
		changes_requested: "bg-orange-500",
		merged: "bg-purple-500",
	};

	return (
		<div className="min-h-screen bg-gray-100 dark:bg-gray-900">
			{/* Header */}
			<header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
				<div className="container mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-blue-600">
							<svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
							</svg>
							<span className="text-xl font-bold">CodeSync</span>
						</div>

						<div className="flex items-center gap-4">
							<span className="text-gray-600 dark:text-gray-300">
								{userName}
							</span>
							<button
								onClick={handleLogout}
								className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
							>
								Sign out
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* Main content */}
			<main className="container mx-auto px-6 py-8">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						Your Sessions
					</h1>
					<Button onClick={() => setShowNewSession(true)}>
						<svg
							className="w-5 h-5 mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 4v16m8-8H4"
							/>
						</svg>
						New Session
					</Button>
				</div>

				{isLoading ? (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6"
							>
								<div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
								<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
							</div>
						))}
					</div>
				) : sessions.length === 0 ? (
					<div className="text-center py-12">
						<svg
							className="w-16 h-16 mx-auto text-gray-400 mb-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
							No sessions yet
						</h3>
						<p className="text-gray-500 mb-6">
							Create your first code review session to get started.
						</p>
						<Button onClick={() => setShowNewSession(true)}>
							Create Session
						</Button>
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{sessions.map((session) => (
							<div
								key={session._id}
								onClick={() => navigate(`/session/${session._id}`)}
								className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-colors"
							>
								<div className="flex items-start justify-between mb-4">
									<h3 className="font-semibold text-gray-900 dark:text-white truncate pr-4">
										{session.title}
									</h3>
									<span
										className={`px-2 py-1 text-xs text-white rounded ${statusColors[session.status]}`}
									>
										{session.status.replace("_", " ")}
									</span>
								</div>

								{session.description && (
									<p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
										{session.description}
									</p>
								)}

								<div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
									<div className="flex items-center gap-4">
										<span className="flex items-center gap-1">
											<svg
												className="w-4 h-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
											{session.stats.fileCount}
										</span>
										<span className="flex items-center gap-1">
											<svg
												className="w-4 h-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
												/>
											</svg>
											{session.stats.commentCount}
										</span>
									</div>
									<span>{formatDate(session.updatedAt)}</span>
								</div>

								{session.source.type === "github" && (
									<div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
										<span className="text-xs text-gray-400 flex items-center gap-1">
											<svg
												className="w-4 h-4"
												fill="currentColor"
												viewBox="0 0 24 24"
											>
												<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
											</svg>
											{session.source.repository} #{session.source.prNumber}
										</span>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</main>

			{/* New Session Modal */}
			<Modal
				isOpen={showNewSession}
				onClose={() => setShowNewSession(false)}
				title="Create New Session"
				size="lg"
			>
				<NewSessionForm onClose={() => setShowNewSession(false)} />
			</Modal>
		</div>
	);
};

interface NewSessionFormProps {
	onClose: () => void;
}

const NewSessionForm: React.FC<NewSessionFormProps> = ({ onClose }) => {
	const navigate = useNavigate();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [sourceType, setSourceType] = useState<"manual" | "github">("manual");
	const [githubUrl, setGithubUrl] = useState("");
	const [isPublic, setIsPublic] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [githubStatus, setGithubStatus] = useState<{
		connected: boolean;
		username: string | null;
	} | null>(null);
	const [prInfo, setPrInfo] = useState<{
		title: string;
		fileCount: number;
		author: string;
	} | null>(null);
	const [validatingPR, setValidatingPR] = useState(false);

	// Check GitHub connection status on mount
	useEffect(() => {
		Meteor.call("github.checkConnection", (err: any, result: any) => {
			if (!err && result) {
				setGithubStatus(result);
			}
		});
	}, []);

	// Validate PR URL when it changes (debounced)
	useEffect(() => {
		if (sourceType !== "github" || !githubUrl) {
			setPrInfo(null);
			return;
		}

		const timer = setTimeout(() => {
			setValidatingPR(true);
			setPrInfo(null);
			setError("");

			Meteor.call(
				"github.validatePRUrl",
				githubUrl,
				(err: any, result: any) => {
					setValidatingPR(false);
					if (err) {
						setError(err.reason || err.message);
					} else if (result) {
						setPrInfo({
							title: result.title,
							fileCount: result.fileCount,
							author: result.author,
						});
					}
				},
			);
		}, 500);

		return () => clearTimeout(timer);
	}, [githubUrl, sourceType]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		// If GitHub source with a URL, use the GitHub import method
		if (sourceType === "github" && githubUrl) {
			Meteor.call(
				"github.importPR",
				githubUrl,
				{ isPublic },
				(err: any, sessionId: string) => {
					setLoading(false);
					if (err) {
						setError(err.reason || err.message);
					} else {
						onClose();
						navigate(`/session/${sessionId}`);
					}
				},
			);
		} else {
			// Manual session creation
			Meteor.call(
				"sessions.create",
				{
					title: title || "Untitled Session",
					description,
					source: {
						type: sourceType,
						url: sourceType === "github" ? githubUrl : undefined,
					},
					isPublic,
				},
				(err: any, sessionId: string) => {
					setLoading(false);
					if (err) {
						setError(err.reason || err.message);
					} else {
						onClose();
						navigate(`/session/${sessionId}`);
					}
				},
			);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					Session Title
				</label>
				<input
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="e.g., Feature X Code Review"
					className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					Description (optional)
				</label>
				<textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={3}
					placeholder="What are you reviewing?"
					className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
					Source
				</label>
				<div className="grid grid-cols-2 gap-4">
					<button
						type="button"
						onClick={() => setSourceType("manual")}
						className={`p-4 border rounded-lg text-left transition-colors ${
							sourceType === "manual"
								? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
								: "border-gray-300 dark:border-gray-600 hover:border-gray-400"
						}`}
					>
						<div className="font-medium text-gray-900 dark:text-white">
							Upload Files
						</div>
						<div className="text-sm text-gray-500">
							Drag and drop or paste code
						</div>
					</button>

					<button
						type="button"
						onClick={() => setSourceType("github")}
						className={`p-4 border rounded-lg text-left transition-colors ${
							sourceType === "github"
								? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
								: "border-gray-300 dark:border-gray-600 hover:border-gray-400"
						}`}
					>
						<div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
							</svg>
							GitHub PR
						</div>
						<div className="text-sm text-gray-500">
							Import from pull request
						</div>
					</button>
				</div>
			</div>

			{sourceType === "github" && (
				<div className="space-y-4">
					{/* GitHub Connection Status */}
					{githubStatus && !githubStatus.connected && (
						<div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-lg">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
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
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
										/>
									</svg>
									<span className="text-sm font-medium">
										GitHub not connected
									</span>
								</div>
								<button
									type="button"
									onClick={() => {
										(Meteor as any).loginWithGithub(
											{ requestPermissions: ["user:email", "repo"] },
											(err: any) => {
												if (!err) {
													// Refresh connection status
													Meteor.call(
														"github.checkConnection",
														(e: any, result: any) => {
															if (!e) setGithubStatus(result);
														},
													);
												}
											},
										);
									}}
									className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
								>
									<svg
										className="w-4 h-4"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
									</svg>
									Connect GitHub
								</button>
							</div>
							<p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
								Connect your GitHub account to import pull requests.
							</p>
						</div>
					)}

					{githubStatus?.connected && (
						<div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
							<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
							</svg>
							Connected as{" "}
							<span className="font-medium">@{githubStatus.username}</span>
						</div>
					)}

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Pull Request URL
						</label>
						<div className="relative">
							<input
								type="url"
								value={githubUrl}
								onChange={(e) => setGithubUrl(e.target.value)}
								placeholder="https://github.com/owner/repo/pull/123"
								disabled={!githubStatus?.connected}
								className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
							/>
							{validatingPR && (
								<div className="absolute right-3 top-1/2 -translate-y-1/2">
									<svg
										className="w-5 h-5 animate-spin text-blue-500"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
								</div>
							)}
						</div>
						<p className="text-xs text-gray-500 mt-1">
							Supports: github.com/owner/repo/pull/123 or owner/repo#123
						</p>
					</div>

					{/* PR Preview */}
					{prInfo && (
						<div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
							<div className="flex items-start gap-3">
								<svg
									className="w-5 h-5 text-green-500 mt-0.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<div className="flex-1 min-w-0">
									<h4 className="font-medium text-gray-900 dark:text-white truncate">
										{prInfo.title}
									</h4>
									<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
										by @{prInfo.author} • {prInfo.fileCount} files changed
									</p>
								</div>
							</div>
						</div>
					)}
				</div>
			)}

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

			{error && (
				<div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
					{error}
				</div>
			)}

			<div className="flex justify-end gap-3 pt-4">
				<Button variant="secondary" type="button" onClick={onClose}>
					Cancel
				</Button>
				<Button type="submit" loading={loading}>
					Create Session
				</Button>
			</div>
		</form>
	);
};
