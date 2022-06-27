import {MarkdownView} from "obsidian";

export interface TTSService {

	/**
	 * @public
	 */
	stop(): void;

	/**
	 * @public
	 */
	pause(): void;

	/**
	 * @public
	 */
	resume(): void;

	/**
	 * @public
	 */
	isSpeaking(): boolean;

	/**
	 * @public
	 */
	isPaused(): boolean;

	/**
	 * @internal
	 * get the name of the voice configured for this language
	 * if there is no voice configured this returns the default
	 * @param languageCode {@link https://www.loc.gov/standards/iso639-2/php/English_list.php ISO 639-1 code}
	 */
	getVoice(languageCode: string) : string;

	/**
	 * @internal
	 * @param title First thing to be spoken, with a pause before the text.
	 * This may not be used, depending on user settings
	 * @param text Some text will be removed according to user settings, before playback starts.
	 * @param voice if there is no voice configured with this name the default voice, according to user settings, will be used.
	 */
	sayWithVoice(title: string, text: string, voice: string): Promise<void>;

	/**
	 *
	 * @public
	 * @param title First thing to be spoken, with a pause before the text.
	 * This may not be used, depending on user settings
	 * @param text Some text will be removed according to user settings, before playback starts.
	 * @param languageCode {@link https://www.loc.gov/standards/iso639-2/php/English_list.php ISO 639-1 code}
	 */
	say(title: string, text: string, languageCode?: string): Promise<void>;

	/**
	 * Use the content of the selected view as source.
	 * @internal
	 * @param view
	 */
	play(view: MarkdownView): void;

}
