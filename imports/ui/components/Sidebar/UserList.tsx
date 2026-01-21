import type React from "react";
import { useFiles } from "../../hooks/useFileContent";
import { type UserPresence, usePresence } from "../../hooks/usePresence";
import { Avatar } from "../UI/Avatar";

interface UserListProps {
	sessionId: string;
}

export const UserList: React.FC<UserListProps> = ({ sessionId }) => {
	const { users, isLoading } = usePresence(sessionId);
	const { files } = useFiles(sessionId);

	const getFileName = (fileId: string | undefined): string | null => {
		if (!fileId) return null;
		const file = files.find((f) => f._id === fileId);
		return file?.name || null;
	};

	const activeUsers = users.filter((u) => u.isActive);
	const inactiveUsers = users.filter((u) => !u.isActive);

	if (isLoading) {
		return (
			<div className="p-4">
				<div className="animate-pulse space-y-3">
					<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
					<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
					<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 border-b border-gray-200 dark:border-gray-700">
			<h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
				Participants ({users.length})
			</h3>

			<div className="space-y-2">
				{activeUsers.map((user) => (
					<UserItem
						key={user._id}
						user={user}
						fileName={getFileName(user.currentFileId)}
					/>
				))}

				{inactiveUsers.length > 0 && activeUsers.length > 0 && (
					<div className="text-xs text-gray-400 pt-2">Offline</div>
				)}

				{inactiveUsers.map((user) => (
					<UserItem
						key={user._id}
						user={user}
						fileName={getFileName(user.currentFileId)}
						inactive
					/>
				))}
			</div>
		</div>
	);
};

interface UserItemProps {
	user: UserPresence;
	fileName: string | null;
	inactive?: boolean;
}

const UserItem: React.FC<UserItemProps> = ({ user, fileName, inactive }) => {
	return (
		<div
			className={`flex items-center gap-3 p-2 rounded-lg ${inactive ? "opacity-50" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
		>
			<div className="relative">
				<Avatar name={user.name} src={user.avatar} size="sm" />
				{!inactive && (
					<span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
				)}
			</div>

			<div className="flex-1 min-w-0">
				<div className="text-sm font-medium text-gray-900 dark:text-white truncate">
					{user.name}
				</div>
				{fileName && (
					<div className="text-xs text-gray-500 dark:text-gray-400 truncate">
						viewing {fileName}
					</div>
				)}
			</div>
		</div>
	);
};
