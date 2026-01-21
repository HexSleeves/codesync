import type React from "react";
import { useMemo, useState } from "react";
import type { File } from "../../../api/files/files";
import { FileNode, type TreeNode } from "./FileNode";

interface FileTreeProps {
	files: File[];
	selectedFileId: string | null;
	onFileSelect: (fileId: string) => void;
}

function buildTree(files: File[]): TreeNode[] {
	const root: TreeNode[] = [];

	// Sort files by path
	const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

	for (const file of sortedFiles) {
		const parts = file.path.split("/");
		let currentLevel = root;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			const isFile = i === parts.length - 1;

			let existing = currentLevel.find((n) => n.name === part);

			if (!existing) {
				existing = {
					name: part,
					path: parts.slice(0, i + 1).join("/"),
					isFile,
					file: isFile ? file : undefined,
					children: [],
				};
				currentLevel.push(existing);
			}

			currentLevel = existing.children;
		}
	}

	return root;
}

export const FileTree: React.FC<FileTreeProps> = ({
	files,
	selectedFileId,
	onFileSelect,
}) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

	const tree = useMemo(() => buildTree(files), [files]);

	const filteredFiles = useMemo(() => {
		if (!searchQuery) return files;
		const query = searchQuery.toLowerCase();
		return files.filter(
			(f) =>
				f.path.toLowerCase().includes(query) ||
				f.name.toLowerCase().includes(query),
		);
	}, [files, searchQuery]);

	const filteredTree = useMemo(() => {
		if (!searchQuery) return tree;
		return buildTree(filteredFiles);
	}, [searchQuery, filteredFiles, tree]);

	const toggleExpanded = (path: string) => {
		setExpandedPaths((prev) => {
			const next = new Set(prev);
			if (next.has(path)) {
				next.delete(path);
			} else {
				next.add(path);
			}
			return next;
		});
	};

	const expandAll = () => {
		const allPaths = new Set<string>();
		const collectPaths = (nodes: TreeNode[]) => {
			for (const node of nodes) {
				if (!node.isFile) {
					allPaths.add(node.path);
					collectPaths(node.children);
				}
			}
		};
		collectPaths(tree);
		setExpandedPaths(allPaths);
	};

	const collapseAll = () => {
		setExpandedPaths(new Set());
	};

	return (
		<div className="flex flex-col h-full">
			{/* Search */}
			<div className="p-3 border-b border-gray-200 dark:border-gray-700">
				<div className="relative">
					<svg
						className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<input
						type="text"
						placeholder="Search files..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
					/>
				</div>
			</div>

			{/* Controls */}
			<div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
				<button
					onClick={expandAll}
					className="hover:text-gray-700 dark:hover:text-gray-300"
				>
					Expand all
				</button>
				<span>•</span>
				<button
					onClick={collapseAll}
					className="hover:text-gray-700 dark:hover:text-gray-300"
				>
					Collapse all
				</button>
				<span className="ml-auto">{files.length} files</span>
			</div>

			{/* Tree */}
			<div className="flex-1 overflow-y-auto px-2 pb-4">
				{filteredTree.map((node) => (
					<FileNode
						key={node.path}
						node={node}
						depth={0}
						selectedFileId={selectedFileId}
						expandedPaths={
							searchQuery
								? new Set([...expandedPaths, ...getAllPaths(node)])
								: expandedPaths
						}
						onToggleExpanded={toggleExpanded}
						onFileSelect={onFileSelect}
					/>
				))}
			</div>
		</div>
	);
};

function getAllPaths(node: TreeNode): string[] {
	const paths: string[] = [];
	if (!node.isFile) {
		paths.push(node.path);
		for (const child of node.children) {
			paths.push(...getAllPaths(child));
		}
	}
	return paths;
}
