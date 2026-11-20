export interface Voice {
	id: string;
	name: string;
	languages: string[];
}

/**
 * Callbacks for a single text, used to highlight the spoken word.
 */
export interface SpeakOptions {
	/**
	 * Called when the speech engine starts a new word.
	 * @param charIndex position of the word in the text passed to sayWithVoice
	 */
	onBoundary?(charIndex: number): void;

	/**
	 * Called when the text has been spoken, was stopped or failed.
	 */
	onEnd?(): void;
}

export interface TTSService {

	id: string;
	name: string;

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

	isConfigured(): boolean;

	isValid(): boolean;

	getVoices() : Promise<Voice[]>;

	/**
	 * @public
	 * @returns how much of the current text has been spoken, in percent. undefined if nothing is playing or the service cannot tell.
	 */
	getProgress?(): number | undefined;

	/**
	 * @public
	 * Continue the current text at the given position.
	 * @param percent position in the current text, 0-100
	 */
	seek?(percent: number): void;

	/**
	 * @internal
	 * This may not be used, depending on user settings
	 * @param text Some text will be removed according to user settings, before playback starts.
	 * @param voice if there is no voice configured with this name the default voice, according to user settings, will be used.
	 * @param options not every service reports word boundaries.
	 */
	sayWithVoice(text: string, voice: string, options?: SpeakOptions): Promise<void>;


}
