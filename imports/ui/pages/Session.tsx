import { Meteor } from "meteor/meteor";
import type React from "react";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CodeView } from "../components/CodeEditor/CodeView";
import { CommentThread } from "../components/Comments/CommentThread";
import { DiffViewer } from "../components/Diff/DiffViewer";
import { FileTree } from "../components/FileTree/FileTree";
import { TopBar } from "../components/Header/TopBar";
import { ChatPanel } from "../components/Sidebar/ChatPanel";
import { UserList } from "../components/Sidebar/UserList";
import { Button } from "../components/UI/Button";
import { useCommentsByLine } from "../hooks/useComments";
import { useCursors } from "../hooks/useCursors";
import { useFile, useFiles } from "../hooks/useFileContent";
import { useSession } from "../hooks/useSession";

export const SessionPage: React.FC = () => {
	const { sessionId } = useParams<{ sessionId: string }>();
	const navigate = useNavigate();

	const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<"code" | "diff">("diff");
	const [commentLine, setCommentLine] = useState<number | null>(null);
	const [showRightSidebar, setShowRightSidebar] = useState(true);

	// Data subscriptions
	const { session, isLoading: sessionLoading } = useSession(sessionId);
	const { files, isLoading: filesLoading } = useFiles(sessionId);
	const { file: selectedFile, isLoading: fileLoading } =
		useFile(selectedFileId);
	const { commentsByLine, isLoading: commentsLoading } =
		useCommentsByLine(selectedFileId);
	const { cursors, updateCursor } = useCursors(sessionId, selectedFileId);

	// Handle line click to open comment panel
	const handleLineClick = useCallback((lineNumber: number) => {
		setCommentLine(lineNumber);
	}, []);

	// Handle cursor movement
	const handleCursorMove = useCallback(
		(line: number, column: number) => {
			updateCursor(line, column);
		},
		[updateCursor],
	);

	// File upload handler
	const handleFileUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const uploadedFiles = e.target.files;
			if (!uploadedFiles || !sessionId) return;

			Array.from(uploadedFiles).forEach((file) => {
				const reader = new FileReader();
				reader.onload = (event) => {
					const content = event.target?.result as string;
					const extension = file.name.split(".").pop() || "";

					Meteor.call("files.add", sessionId, {
						path: file.name,
						name: file.name,
						extension,
						size: file.size,
						content,
						encoding: "utf-8",
						language: extension,
						isDeleted: false,
						isAdded: true,
						isModified: false,
						isRenamed: false,
					});
				};
				reader.readAsText(file);
			});
		},
		[sessionId],
	);

	// Loading state
	if (sessionLoading || filesLoading) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
					<p className="text-gray-400">Loading session...</p>
				</div>
			</div>
		);
	}

	// Session not found
	if (!session) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-4">
						Session Not Found
					</h1>
					<p className="text-gray-400 mb-6">
						This session doesn't exist or you don't have access.
					</p>
					<Button onClick={() => navigate("/dashboard")}>
						Go to Dashboard
					</Button>
				</div>
			</div>
		);
	}

	// Get root comments for the selected line
	const lineComments = commentLine ? commentsByLine.get(commentLine) || [] : [];

	return (
		<div className="flex flex-col h-screen bg-gray-900">
			{/* Top bar */}
			<TopBar session={session} />

			{/* Main content */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left sidebar - File tree */}
				<aside className="w-64 shrink-0 border-r border-gray-700 bg-gray-800 flex flex-col">
					<FileTree
						files={files}
						selectedFileId={selectedFileId}
						onFileSelect={setSelectedFileId}
					/>

					{/* File upload */}
					{session.source.type === "manual" && (
						<div className="p-4 border-t border-gray-700">
							<label className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 hover:bg-gray-700/50 transition-colors">
								<svg
									className="w-5 h-5 text-gray-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
									/>
								</svg>
								<span className="text-sm text-gray-400">Upload files</span>
								<input
									type="file"
									multiple
									onChange={handleFileUpload}
									className="hidden"
								/>
							</label>
						</div>
					)}
				</aside>

				{/* Center - Code/Diff view */}
				<main className="flex-1 overflow-hidden flex flex-col min-w-0">
					{selectedFile ? (
						<>
							{/* File header */}
							<div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800 shrink-0">
								<div className="flex items-center gap-3 min-w-0">
									<h2 className="font-mono text-sm font-medium text-gray-200 truncate">
										{selectedFile.path}
									</h2>

									{selectedFile.isReviewed && (
										<span className="flex items-center gap-1 px-2 py-0.5 bg-green-900/50 text-green-400 rounded text-xs">
											<svg
												className="w-3 h-3"
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
											Reviewed
										</span>
									)}
								</div>

								<div className="flex items-center gap-2">
									{/* Mark as reviewed */}
									<button
										onClick={() => {
											if (selectedFile.isReviewed) {
												Meteor.call("files.unmarkReviewed", selectedFile._id);
											} else {
												Meteor.call("files.markReviewed", selectedFile._id);
											}
										}}
										className={`px-3 py-1 text-sm rounded transition-colors ${
											selectedFile.isReviewed
												? "bg-gray-700 text-gray-300 hover:bg-gray-600"
												: "bg-green-600/20 text-green-400 hover:bg-green-600/30"
										}`}
									>
										{selectedFile.isReviewed
											? "Unmark reviewed"
											: "Mark as reviewed"}
									</button>

									{/* View mode toggle */}
									<div className="flex rounded-lg overflow-hidden border border-gray-600">
										<button
											onClick={() => setViewMode("code")}
											className={`px-3 py-1 text-sm transition-colors ${
												viewMode === "code"
													? "bg-blue-600 text-white"
													: "bg-gray-700 text-gray-300 hover:bg-gray-600"
											}`}
										>
											Code
										</button>
										<button
											onClick={() => setViewMode("diff")}
											className={`px-3 py-1 text-sm transition-colors ${
												viewMode === "diff"
													? "bg-blue-600 text-white"
													: "bg-gray-700 text-gray-300 hover:bg-gray-600"
											}`}
										>
											Diff
										</button>
									</div>
								</div>
							</div>

							{/* Code/Diff display */}
							<div className="flex-1 overflow-auto">
								{fileLoading ? (
									<div className="flex items-center justify-center h-full">
										<div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
									</div>
								) : viewMode === "code" ? (
									<CodeView
										file={selectedFile}
										comments={commentsByLine}
										cursors={cursors}
										onLineClick={handleLineClick}
										onCursorMove={handleCursorMove}
									/>
								) : (
									<DiffViewer
										file={selectedFile}
										mode={session.settings.diffMode}
										comments={commentsByLine}
										onLineClick={handleLineClick}
									/>
								)}
							</div>
						</>
					) : (
						<div className="flex items-center justify-center h-full text-gray-500">
							<div className="text-center">
								<svg
									className="w-16 h-16 mx-auto mb-4 text-gray-600"
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
								<p className="text-lg">Select a file to review</p>
								<p className="text-sm mt-2">
									Choose a file from the sidebar to start reviewing
								</p>
							</div>
						</div>
					)}
				</main>

				{/* Right sidebar - Users & Chat */}
				{showRightSidebar && (
					<aside className="w-80 shrink-0 border-l border-gray-700 bg-gray-800 flex flex-col">
						<UserList sessionId={sessionId!} />
						<ChatPanel sessionId={sessionId!} />
					</aside>
				)}

				{/* Toggle right sidebar button */}
				<button
					onClick={() => setShowRightSidebar(!showRightSidebar)}
					className="absolute right-0 top-1/2 -translate-y-1/2 p-1 bg-gray-700 hover:bg-gray-600 rounded-l-lg text-gray-400 z-10"
					style={{ right: showRightSidebar ? "320px" : "0" }}
				>
					<svg
						className={`w-5 h-5 transition-transform ${showRightSidebar ? "" : "rotate-180"}`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>

			{/* Comment thread panel */}
			{commentLine !== null && selectedFileId && sessionId && (
				<CommentThread
					sessionId={sessionId}
					fileId={selectedFileId}
					lineNumber={commentLine}
					rootComments={lineComments}
					onClose={() => setCommentLine(null)}
				/>
			)}
		</div>
	);
};
