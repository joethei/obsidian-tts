import {TTSService} from "./TTSService";
import TTSPlugin from "../main";
import {requestUrl} from "obsidian";
import AudioPlayer from "./AudioPlayer";

export class OpenAI extends AudioPlayer implements TTSService {
	plugin: TTSPlugin;
	id = "openai";
	name = "OpenAI";

	constructor(plugin: TTSPlugin) {
		super(plugin);
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
		return this.paused;
	}

	isSpeaking(): boolean {
		return this.isPlaying;
	}

	isValid(): boolean {
		return this.plugin.settings.services.openai.key.startsWith('sk-');
	}

	pause(): void {
		this.pause();
	}

	resume(): void {
		this.play();
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

		this.setupSoundtouch(audioFile.arrayBuffer);
	}

	stop(): void {
		this.stop();
	}

	get progress(): number {
		return this.soundtouch.percentagePlayed;
	}

}
