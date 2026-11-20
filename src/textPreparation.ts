import {TTSSettings} from "./settings";

export type TextPreparationSettings = Pick<TTSSettings,
	"speakSyntax" | "speakLinks" | "speakCodeblocks" | "speakComments" | "speakEmoji" | "speakTitle" | "ignoredPatterns">;

/**
 * Turn markdown into text that can be handed to a speech engine.
 * Frontmatter is not handled here, strip it before calling this.
 */
export function prepareText(settings: TextPreparationSettings, title: string, text: string): string {
	let content = text;

	//user defined patterns run on the raw markdown, so they match what the user sees in the note.
	for (const pattern of settings.ignoredPatterns ?? []) {
		try {
			content = content.replace(new RegExp(pattern, "gm"), "");
		} catch (e) {
			console.warn("TTS: ignoring invalid pattern " + pattern, e);
		}
	}

	//embedded files (images, audio, pdf, ...) only add their file name, which is noise when spoken.
	content = content.replace(/!\[\[([^\]|#]*)(?:[#|][^\]]*)?]]/g, (match, target: string) => {
		return /\.(?!md$)[a-z0-9]+$/i.test(target.trim()) ? "" : match;
	});
	content = content.replace(/!\[[^\]]*]\([^)]*\)/g, "");

	if (!settings.speakCodeblocks) {
		content = content.replace(/```[\s\S]*?```/g, '');
	}

	if (!settings.speakComments) {
		content = content.replace(/%%[\s\S]*?%%/g, '');
		content = content.replace(/<!--[\s\S]*?-->/g, '');
	}

	if (!settings.speakSyntax) {
		//block references, e.g. "some text ^block-id" or "^block-id" on its own line
		content = content.replace(/(^|[ \t])\^[A-Za-z0-9-]+[ \t]*$/gm, "$1");

		content = content.replace(/#/g, "");
		content = content.replace(/-/g, "");
		content = content.replace(/_/g, "");
		content = content.replace(/\*/g, "");
		content = content.replace(/\^/g, "");
		content = content.replace(/==/g, "");
	}

	if (!settings.speakLinks) {
		//regex from https://stackoverflow.com/a/37462442/5589264
		content = content.replace(/(?:__|[*#])|\[(.*?)]\(.*?\)/gm, '$1');
		content = content.replace(/http[s]:\/\/[^\s]*/gm, '');
	}

	if (!settings.speakEmoji) {
		//regex from https://ihateregex.io/expr/emoji/
		content = content.replace(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g, '');
	}

	//add pauses, taken from https://stackoverflow.com/a/50944593/5589264
	content = content.replace(/\n/g, " ! ");

	//only speak link aliases.
	content = content.replace(/\[\[(?:[^\]|]*\|)?([^\]|]*)]]/g, '$1');

	if (settings.speakTitle && title?.length > 0) {
		content = title + " ! ! " + content;
	}

	return content;
}
