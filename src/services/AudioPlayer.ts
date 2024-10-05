// @ts-ignore
import registerSoundtouchWorklet from "audio-worklet:../soundtouch-worklet";
import createSoundTouchNode from '@soundtouchjs/audio-worklet';
import TTSPlugin from "src/main";
import { resetStatusbar } from "../utils";

interface PlayEventDetail {
    timePlayed: number, // float representing the current 'playHead' position in seconds
    formattedTimePlayed: string, // the 'timePlayed' in 'mm:ss' format
    percentagePlayed: number // int representing the percentage of what's been played based on the 'timePlayed' and audio duration
}

interface Soundtouch {
	rate: number;
	tempo: number;
	pitch: number;
	percentagePlayed: number;
	playing: boolean;
	ready: boolean;
	connectToBuffer(): AudioBufferSourceNode;
	disconnectFromBuffer(): void;
	connect(node: AudioNode): void;
	disconnect(): void;
	play(): void;
	stop(): Promise<void>;
	pause(): void;
	off(): void;
	on(event: string, callback: (detail?: PlayEventDetail) => void): void;
}

export default class AudioPlayer {
	plugin: TTSPlugin;
	audioCtx: AudioContext;
	gainNode: GainNode;
	soundtouch: Soundtouch;
	bufferNode: AudioBufferSourceNode;
	paused = false;

	constructor(plugin: TTSPlugin) {
		this.plugin = plugin;
		this.createContext();
	}

	private async createContext() {
		this.audioCtx = new AudioContext();
		await registerSoundtouchWorklet(this.audioCtx);
	}

	private onEnd = () => {
		this.stop();
	}

	private onInitialized() {
		this.soundtouch.on('end', () => this.onEnd);
		this.soundtouch.tempo = this.plugin.settings.rate;
		this.soundtouch.pitch = this.plugin.settings.pitch;
		this.play();
	}

	protected async setupSoundtouch(buffer: ArrayBuffer): Promise<void> {
		if (this.soundtouch) {
			await this.stop();
		}
		this.soundtouch = createSoundTouchNode(this.audioCtx, AudioWorkletNode, buffer);
		this.soundtouch.on('initialized', () => this.onInitialized());
	}

	protected play(): void {
		if (!this.soundtouch.ready) return;
		this.bufferNode = this.soundtouch.connectToBuffer(); // AudioBuffer goes to SoundTouchNode
		this.gainNode = this.audioCtx.createGain();
		this.soundtouch.connect(this.gainNode); // SoundTouch goes to the GainNode
		this.gainNode.connect(this.audioCtx.destination); // GainNode goes to the AudioDestinationNode

		this.soundtouch.play();
	}

	private disconnect(): boolean {
		if (!this.bufferNode) return false;
		this.gainNode.disconnect(); // disconnect the DestinationNode
		this.soundtouch.disconnect(); // disconnect the AudioGainNode
		this.soundtouch.disconnectFromBuffer(); // disconnect the SoundTouchNode
		return true;
	}

	protected async stop(): Promise<void> {
		if (!this.disconnect()) return;
		this.soundtouch.off();
		await this.soundtouch.stop();
		resetStatusbar(this.plugin.statusbar);
	}

	protected pause(): void {
		if (!this.disconnect()) return;
		this.soundtouch.pause();
		this.paused = true;
	}

}
