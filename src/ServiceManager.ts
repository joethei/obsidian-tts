import {TTSService} from "./services/TTSService";
import TTSPlugin from "./main";
import {SpeechSynthesis} from "./services/SpeechSynthesis";
import {Notice} from "obsidian";
import { OpenAI } from "./services/OpenAI";
import { Azure } from "./services/Azure";

export class ServiceManager {
	private readonly plugin: TTSPlugin;
	private services: TTSService[] = [];

	constructor(plugin: TTSPlugin) {
		this.plugin = plugin;
		this.services.push(new SpeechSynthesis(this.plugin));
		this.services.push(new OpenAI(this.plugin));
		this.services.push(new Azure(this.plugin));
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

	async sayWithVoice(text: string, voice: string): Promise<void> {
		const service = this.services.filter(service => voice.startsWith(service.id)).first();
		const split = voice.split("-");
		split.shift();
		voice = split.join("-");
		if(!service) {
			new Notice("No service found for voice" + voice);
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
