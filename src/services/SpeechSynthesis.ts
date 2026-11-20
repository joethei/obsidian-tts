import {Platform} from "obsidian";
import TTSPlugin from "../main";
import {SpeakOptions, TTSService} from "./TTSService";

export class SpeechSynthesis implements TTSService {
	plugin: TTSPlugin;
	id = 'speechSynthesis';
	name = 'Speech Synthesis';

	private current: {utterance: SpeechSynthesisUtterance, text: string, position: number, options: SpeakOptions} | null = null;
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
		this.current?.options.onPause?.();
	}

	resume(): void {
		if (!this.isSpeaking()) return;
		window.speechSynthesis.resume();
		this.current?.options.onResume?.();
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

	private speak(text: string, voice: SpeechSynthesisVoice | null, options: SpeakOptions, offset = 0): SpeechSynthesisUtterance {
		const msg = new SpeechSynthesisUtterance();
		msg.text = text.substring(offset);
		msg.volume = this.plugin.settings.volume;
		msg.rate = this.plugin.settings.rate;
		msg.pitch = this.plugin.settings.pitch;
		msg.voice = voice;
		msg.onstart = () => {
			this.current = {utterance: msg, text, position: offset, options};
			this.plugin.updateStatusbar();
		};
		msg.onboundary = (event) => {
			if (this.current?.utterance === msg) {
				this.current.position = offset + event.charIndex;
			}
			if (event.name === "word") {
				options.onBoundary?.(offset + event.charIndex);
			}
		};
		const finished = () => {
			this.utterances.delete(msg);
			if (this.current?.utterance === msg) {
				this.current = null;
			}
			options.onEnd?.();
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
		const {text, utterance, options} = this.current;
		let index = Math.floor(text.length * Math.min(Math.max(percent, 0), 100) / 100);
		while (index > 0 && !/\s/.test(text.charAt(index - 1))) {
			index--;
		}
		window.speechSynthesis.cancel();
		const msg = this.speak(text, utterance.voice, options, index);
		//set it right away so the cancelled utterance finishing does not hide the controls.
		this.current = {utterance: msg, text, position: index, options};
		if (window.speechSynthesis.paused) {
			window.speechSynthesis.resume();
		}
	}

	async sayWithVoice(text: string, voice: string, options: SpeakOptions = {}): Promise<void> {
		this.speak(text, window.speechSynthesis.getVoices().filter(otherVoice => otherVoice.name === voice)[0] ?? null, options);
	}

}
