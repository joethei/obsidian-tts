import { setIcon } from "obsidian";

export const cleanText = (text: string, patterns: string[]): string => {
	if (!patterns || patterns.length === 0) return text;
	let res = text;
	for (const pattern of patterns) {
		res = res.replace(new RegExp(pattern, "g"), "");
	}
	return res;
}

export const resetStatusbar = (statusbar: HTMLElement): void => {
	statusbar.empty();
	setIcon(statusbar, 'audio-file');
}
