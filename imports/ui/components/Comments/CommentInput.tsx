import type React from "react";
import { useEffect, useRef, useState } from "react";

interface CommentInputProps {
	placeholder?: string;
	onSubmit: (text: string) => void;
	onCancel?: () => void;
	autoFocus?: boolean;
}

export const CommentInput: React.FC<CommentInputProps> = ({
	placeholder = "Write a comment...",
	onSubmit,
	onCancel,
	autoFocus = false,
}) => {
	const [text, setText] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (autoFocus && textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [autoFocus]);

	const handleSubmit = () => {
		if (text.trim()) {
			onSubmit(text.trim());
			setText("");
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		// Submit on Cmd/Ctrl + Enter
		if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
			e.preventDefault();
			handleSubmit();
		}
		// Cancel on Escape
		if (e.key === "Escape" && onCancel) {
			e.preventDefault();
			onCancel();
		}
	};

	// Auto-resize textarea
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	}, [text]);

	return (
		<div
			className={`relative rounded-lg border ${
				isFocused
					? "border-blue-500 ring-2 ring-blue-500/20"
					: "border-gray-300 dark:border-gray-600"
			} bg-white dark:bg-gray-700 transition-all`}
		>
			<textarea
				ref={textareaRef}
				value={text}
				onChange={(e) => setText(e.target.value)}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				rows={1}
				className="w-full p-3 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none min-h-[40px] max-h-40"
			/>

			{/* Footer with submit button */}
			{(text.trim() || isFocused) && (
				<div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-600">
					<div className="text-xs text-gray-400">
						<kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-xs">
							⌘
						</kbd>
						{" + "}
						<kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-xs">
							Enter
						</kbd>
						{" to submit"}
					</div>

					<div className="flex gap-2">
						{onCancel && (
							<button
								onClick={onCancel}
								className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
							>
								Cancel
							</button>
						)}
						<button
							onClick={handleSubmit}
							disabled={!text.trim()}
							className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Comment
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
