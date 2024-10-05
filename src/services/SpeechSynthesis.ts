import {Platform} from "obsidian";
import TTSPlugin from "../main";
import {TTSService} from "./TTSService";

export class SpeechSynthesis implements TTSService {
	plugin: TTSPlugin;
	id = 'speechSynthesis';
	name = 'Speech Synthesis';
	words: string[] = [];
	wordCounter = 0;
	voice = '';
	text = '';

	constructor(plugin: TTSPlugin) {
		this.plugin = plugin;
	}

	get progress(): number {
		return this.wordCounter / this.words.length * 100;
	}

	seek(percent: number): void {
		const wordIndex = Math.floor(this.words.length * percent / 100);
		const fragment = this.words.slice(wordIndex).join(' ');
		this.wordCounter = wordIndex;
		this.speak(fragment);
	}

	stop(): void {
		if (!this.isSpeaking()) return;
		window.speechSynthesis.cancel();
	}

	pause(): void {
		if (!this.isSpeaking()) return;
		window.speechSynthesis.pause();
	}

	resume(): void {
		if (!this.isSpeaking()) return;
		window.speechSynthesis.resume();
	}

	isSpeaking(): boolean {
		return window.speechSynthesis.speaking;
	}

	isPaused(): boolean {
		return window.speechSynthesis.paused;
	}

	isConfigured(): boolean {
		return true;
	}

	isValid(): boolean {
		return !Platform.isAndroidApp;
	}

	async getVoices(): Promise<{id: string, name: string, languages: string[]}[]> {
		const voices = window.speechSynthesis.getVoices();
		return voices.map(voice => {
			return {
				id: voice.voiceURI,
				name: voice.name,
				languages: [voice.lang]
			};
		})
	}

	private speak(text: string): void {
		const msg = new SpeechSynthesisUtterance();
		msg.text = text;
		msg.volume = this.plugin.settings.volume;
		msg.rate = this.plugin.settings.rate;
		msg.pitch = this.plugin.settings.pitch;
		msg.voice = window.speechSynthesis.getVoices().filter(otherVoice => otherVoice.name === this.voice)[0];
		msg.onboundary = (event) => {
			if (event.name === "word") {
				this.wordCounter++;
			}
		};
		window.speechSynthesis.cancel();
		window.speechSynthesis.speak(msg);
	}

	async sayWithVoice(text: string, voice: string): Promise<void> {
		this.text = text;
		this.words = text.split(' ');
		this.voice = voice;
		this.speak(text);
		this.plugin.statusbar.createSpan({text: 'Speaking'});
	}

}
