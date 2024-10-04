import {TTSService} from "./TTSService";
import TTSPlugin from "../main";
import {requestUrl} from "obsidian";
// @ts-ignore
import registerSoundtouchWorklet from "audio-worklet:../soundtouch/soundtouch-worklet";
import createSoundTouchNode from '@soundtouchjs/audio-worklet';

export class OpenAI implements TTSService {
	plugin: TTSPlugin;
	id = "openai";
	name = "OpenAI";

	source: AudioBufferSourceNode | null = null;
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
		if(!this.source) return true;
		return this.source.context.state === "suspended";
	}

	isSpeaking(): boolean {
		if(!this.source) return false;
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
		// const buffer = await context.decodeAudioData(audioFile.arrayBuffer);

		await registerSoundtouchWorklet(context);
		
		// const soundtouchWorkletNode = new AudioWorkletNode(context, 'soundtouch-worklet');

		const soundtouch = createSoundTouchNode(context, AudioWorkletNode, audioFile.arrayBuffer);

		soundtouch.on('initialized', () => {
			console.log('SoundTouch initialized');
			soundtouch.tempo = this.plugin.settings.rate;
			soundtouch.pitch = this.plugin.settings.pitch;

			const bufferNode = soundtouch.connectToBuffer(); // AudioBuffer goes to SoundTouchNode
			const gainNode = context.createGain();
			soundtouch.connect(gainNode); // SoundTouch goes to the GainNode
			gainNode.connect(context.destination); // GainNode goes to the AudioDestinationNode

			soundtouch.play();
		});
	}

	stop(): void {
		this.source.stop();
	}

}
