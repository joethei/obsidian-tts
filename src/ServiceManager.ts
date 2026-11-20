import {TTSService} from "./services/TTSService";
import TTSPlugin from "./main";
import {SpeechSynthesis} from "./services/SpeechSynthesis";
import {Notice} from "obsidian";

/**
 * The API other plugins get through `pluginApi('tts')`.
 */
export interface TTSApi {
	/**
	 * Speak a text. Markdown is cleaned up according to the user's settings,
	 * the text is queued if something is already playing.
	 * @param title spoken before the text, if the user enabled that. Pass an empty string to skip it.
	 * @param languageCode ISO 639-1 code, e.g. "en". Detected from the text if left out.
	 */
	say(title: string, text: string, languageCode?: string): Promise<void>;

	stop(): void;

	pause(): void;

	resume(): void;

	isSpeaking(): boolean;

	isPaused(): boolean;
}

export class ServiceManager implements TTSApi {
	private readonly plugin: TTSPlugin;
	private services: TTSService[] = [];

	constructor(plugin: TTSPlugin) {
		this.plugin = plugin;
		this.services.push(new SpeechSynthesis(this.plugin));
		//this.services.push(new OpenAI(this));
	}

	public getServices(): TTSService[] {
		return this.services;
	}

	public isSpeaking(): boolean {
		return this.services.some(service => service.isSpeaking());
	}

	public isPaused(): boolean {
		return this.services.every(service => service.isPaused());
	}

	async say(title: string, text: string, languageCode?: string): Promise<void> {
		await this.plugin.say(this.plugin.prepareText(title, text), languageCode || this.plugin.detectLanguage(text), !!languageCode);
	}

	stop() : void {
		for (const service of this.services) {
			if(service.isSpeaking() || service.isPaused()) {
				service.stop();
			}
		}
	}

	pause() : void {
		for (const service of this.services) {
			if(service.isSpeaking()) {
				service.pause();
			}
		}
	}

	resume(): void {
		for (const service of this.services) {
			if(service.isPaused()) {
				service.resume();
			}
		}
	}

	getProgress(): number | undefined {
		const service = this.services.find(service => service.isSpeaking() && service.getProgress);
		return service?.getProgress();
	}

	seek(percent: number): void {
		for (const service of this.services) {
			if (service.isSpeaking() && service.seek) {
				service.seek(percent);
			}
		}
	}

	async sayWithVoice(text: string, voice: string): Promise<void> {
		const service = this.services.filter(service => voice.startsWith(service.id)).first();
		const split = voice.split("-");
		split.shift();
		voice = split.join("-");
		if(!service) {
			new Notice("TTS: no service found for voice " + voice);
			return;
		}
		await service.sayWithVoice(text, voice);

	}

	async getVoices() {
		const voices = [];
		for (const service of this.services) {
			for (const voice of await service.getVoices()) {
				voices.push({
					service: service.id,
					id: voice.id,
					name: voice.name,
					languages: voice.languages
				});
			}
		}
		return voices;
	}


}
