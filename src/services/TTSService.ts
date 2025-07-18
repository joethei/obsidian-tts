export interface Voice {
	id: string;
	name: string;
	languages: string[];
}

export interface TTSService {

	id: string;
	name: string;
	progress: number;

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

	seek(position: number): void;

	/**
	 * @internal
	 * This may not be used, depending on user settings
	 * @param text Some text will be removed according to user settings, before playback starts.
	 * @param voice if there is no voice configured with this name the default voice, according to user settings, will be used.
	 */
	sayWithVoice(text: string, voice: string): Promise<void>;


}
