import {TTSService} from "./TTSService";
import TTSPlugin from "../main";
import {requestUrl} from "obsidian";

export class OpenAI implements TTSService {
	plugin: TTSPlugin;
	id = "openai";
	name = "OpenAI";

	source: AudioBufferSourceNode;
	currentTime = 0;

	constructor(plugin: TTSPlugin) {
		this.plugin = plugin;
	}

	languages: [];

	async getVoices(): Promise<{ id: string; name: string; languages: string[] }[]> {
		return [
			{
				id: 'alloy',
				name: 'Alloy',
				languages: this.languages,
			},
			{
				id: 'echo',
				name: 'Echo',
				languages: this.languages,
			},
			{
				id: 'fable',
				name: 'Fable',
				languages: this.languages,
			},
			{
				id: 'onyx',
				name: 'Onyx',
				languages: this.languages,
			},
			{
				id: 'nova',
				name: 'Nova',
				languages: this.languages,
			},
			{
				id: 'shimmer',
				name: 'Shimmer',
				languages: this.languages,
			}
		];
	}

	isConfigured(): boolean {
		return this.plugin.settings.services.openai.key.length > 0;
	}

	isPaused(): boolean {
		return this.source.context.state === "suspended";
	}

	isSpeaking(): boolean {
		return this.source.context.state === "running";
	}

	isValid(): boolean {
		return this.plugin.settings.services.openai.key.startsWith('sk-');
	}

	pause(): void {
		this.currentTime = this.source.context.currentTime;
		this.source.stop();
	}

	resume(): void {
		this.source.start(this.currentTime);
	}

	async sayWithVoice(text: string, voice: string) : Promise<void> {

		const audioFile = await requestUrl({
			url: 'https://api.openai.com/v1/audio/speech',
			method: 'POST',
			headers: {
				'Authorization': 'Bearer ' + this.plugin.settings.services.openai.key,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				'model': 'tts-1',
				'input': text,
				'voice': voice,
			})
		});


		const context = new AudioContext();
		const buffer = await context.decodeAudioData(audioFile.arrayBuffer);
		this.source = context.createBufferSource();
		this.source.buffer = buffer;
		this.source.connect(context.destination);
		this.source.start();
	}

	stop(): void {
		this.source.stop();
	}

}
