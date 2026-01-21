import type React from "react";

interface AvatarProps {
	name: string;
	src?: string;
	size?: "sm" | "md" | "lg";
	className?: string;
}

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.substring(0, 2);
}

function stringToColor(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}

	const colors = [
		"bg-red-500",
		"bg-orange-500",
		"bg-amber-500",
		"bg-yellow-500",
		"bg-lime-500",
		"bg-green-500",
		"bg-emerald-500",
		"bg-teal-500",
		"bg-cyan-500",
		"bg-sky-500",
		"bg-blue-500",
		"bg-indigo-500",
		"bg-violet-500",
		"bg-purple-500",
		"bg-fuchsia-500",
		"bg-pink-500",
		"bg-rose-500",
	];

	return colors[Math.abs(hash) % colors.length];
}

export const Avatar: React.FC<AvatarProps> = ({
	name,
	src,
	size = "md",
	className = "",
}) => {
	const sizes = {
		sm: "w-6 h-6 text-xs",
		md: "w-8 h-8 text-sm",
		lg: "w-10 h-10 text-base",
	};

	if (src) {
		return (
			<img
				src={src}
				alt={name}
				className={`${sizes[size]} rounded-full object-cover ${className}`}
			/>
		);
	}

	const bgColor = stringToColor(name);

	return (
		<div
			className={`${sizes[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-medium ${className}`}
			title={name}
		>
			{getInitials(name)}
		</div>
	);
};
