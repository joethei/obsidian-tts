import {TTSService} from "./services/TTSService";
import TTSPlugin from "./main";
import {SpeechSynthesis} from "./services/SpeechSynthesis";
import {Notice, Platform} from "obsidian";
import { OpenAI } from "./services/OpenAI";
import { Azure } from "./services/Azure";
import { cleanText } from "./utils";

export interface Voice {
	service: string;
	id: string;
	name: string;
	languages: string[];
}
export class ServiceManager {
	private readonly plugin: TTSPlugin;
	private services: TTSService[] = [];
	private activeService: TTSService;

	constructor(plugin: TTSPlugin) {
		this.plugin = plugin;
		// Due to a bug in android SpeechSynthesis does not work on this platform
		// https://bugs.chromium.org/p/chromium/issues/detail?id=487255
		if (!Platform.isAndroidApp) {
			this.services.push(new SpeechSynthesis(this.plugin));
		}
		this.services.push(new OpenAI(this.plugin));
		this.services.push(new Azure(this.plugin));
		this.activeService = this.services.find(service => this.plugin.settings.defaultService === service.id);
	}

	public getServices(): TTSService[] {
		return this.services;
	}

	public isSpeaking(): boolean {
		return this.activeService.isSpeaking();
	}

	public isPaused(): boolean {
		return this.activeService.isPaused();
	}

	stop() : void {
		this.activeService.stop();
	}

	pause() : void {
		this.activeService.pause();
	}

	resume(): void {
		this.activeService.resume();
	}

	async sayWithVoice(text: string, voice: string): Promise<void> {
		const service = this.services.filter(service => voice.startsWith(service.id)).first();
		const split = voice.split("-");
		split.shift();
		voice = split.join("-");
		if(!service) {
			new Notice("No service found for voice" + voice);
		}
		await service.sayWithVoice(cleanText(text, this.plugin.settings.regexPatternsToIgnore), voice);
	}

	async getVoices(): Promise<Voice[]> {
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

	get progress(): number {
		return this.activeService.progress;
	}

	seek(progress: number): void {
		this.activeService.seek(progress);
	}

}
