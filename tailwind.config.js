/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./client/**/*.{html,js,jsx,ts,tsx}",
		"./imports/**/*.{js,jsx,ts,tsx}",
		"./imports/ui/**/*.tsx",
		"./imports/ui/components/**/*.tsx",
	],
	theme: {
		extend: {},
	},
	plugins: [],
};
