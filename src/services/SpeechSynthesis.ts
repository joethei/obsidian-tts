import {Platform} from "obsidian";
import TTSPlugin from "../main";
import {TTSService} from "./TTSService";

export class SpeechSynthesis implements TTSService {
	plugin: TTSPlugin;
	id = 'speechSynthesis';
	name = 'Speech Synthesis';

	constructor(plugin: TTSPlugin) {
		this.plugin = plugin;
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

	private async loadVoices(): Promise<SpeechSynthesisVoice[]> {
		const voices = window.speechSynthesis.getVoices();
		if (voices.length > 0) return voices;
		return new Promise(resolve => {
			window.speechSynthesis.addEventListener('voiceschanged', () => {
				resolve(window.speechSynthesis.getVoices());
			}, {once: true});
		});
	}

	async getVoices(): Promise<{id: string, name: string, languages: string[]}[]> {
		const voices = await this.loadVoices();
		return voices.map(voice => {
			return {
				id: voice.voiceURI,
				name: voice.name,
				languages: [voice.lang]
			};
		});
	}

	async sayWithVoice(text: string, voice: string): Promise<void> {
		const msg = new SpeechSynthesisUtterance();
		msg.text = text;
		msg.volume = this.plugin.settings.volume;
		msg.rate = this.plugin.settings.rate;
		msg.pitch = this.plugin.settings.pitch;
		const voices = await this.loadVoices();
		msg.voice = voices.filter(otherVoice => otherVoice.voiceURI === voice)[0];
		window.speechSynthesis.speak(msg);
		this.plugin.statusbar.createSpan({text: 'Speaking'});
	}

}
