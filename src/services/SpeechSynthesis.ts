import {Platform} from "obsidian";
import TTSPlugin from "../main";
import {TTSService} from "./TTSService";

export class SpeechSynthesis implements TTSService {
	plugin: TTSPlugin;
	id = 'speechSynthesis';
	name = 'Speech Synthesis';

	private current: {utterance: SpeechSynthesisUtterance, text: string, position: number} | null = null;
	//keep references until playback ends, otherwise Chromium may garbage collect them and never fire their events.
	private utterances = new Set<SpeechSynthesisUtterance>();

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
		//voiceschanged never fires when the platform has no voices at all, so do not wait forever.
		return new Promise(resolve => {
			const done = () => {
				window.clearTimeout(timeout);
				window.speechSynthesis.removeEventListener('voiceschanged', done);
				resolve(window.speechSynthesis.getVoices());
			};
			const timeout = window.setTimeout(done, 2000);
			window.speechSynthesis.addEventListener('voiceschanged', done);
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

	private speak(text: string, voice: SpeechSynthesisVoice | null, offset = 0): SpeechSynthesisUtterance {
		const msg = new SpeechSynthesisUtterance();
		msg.text = text.substring(offset);
		msg.volume = this.plugin.settings.volume;
		msg.rate = this.plugin.settings.rate;
		msg.pitch = this.plugin.settings.pitch;
		msg.voice = voice;
		msg.onstart = () => {
			this.current = {utterance: msg, text, position: offset};
			this.plugin.updateStatusbar();
		};
		msg.onboundary = (event) => {
			if (this.current?.utterance === msg) {
				this.current.position = offset + event.charIndex;
			}
		};
		const finished = () => {
			this.utterances.delete(msg);
			if (this.current?.utterance === msg) {
				this.current = null;
			}
			this.plugin.updateStatusbar();
		};
		msg.onend = finished;
		msg.onerror = finished;
		this.utterances.add(msg);
		window.speechSynthesis.speak(msg);
		return msg;
	}

	getProgress(): number | undefined {
		if (!this.current || this.current.text.length === 0) return undefined;
		return this.current.position / this.current.text.length * 100;
	}

	/**
	 * The Web Speech API cannot seek, so this cancels playback and starts a new utterance at the closest word.
	 * Queued utterances are dropped by the cancel.
	 */
	seek(percent: number): void {
		if (!this.current) return;
		const {text, utterance} = this.current;
		let index = Math.floor(text.length * Math.min(Math.max(percent, 0), 100) / 100);
		while (index > 0 && !/\s/.test(text.charAt(index - 1))) {
			index--;
		}
		window.speechSynthesis.cancel();
		const msg = this.speak(text, utterance.voice, index);
		//set it right away so the cancelled utterance finishing does not hide the controls.
		this.current = {utterance: msg, text, position: index};
		if (window.speechSynthesis.paused) {
			window.speechSynthesis.resume();
		}
	}

	async sayWithVoice(text: string, voice: string): Promise<void> {
		this.speak(text, window.speechSynthesis.getVoices().filter(otherVoice => otherVoice.name === voice)[0] ?? null);
	}

}
