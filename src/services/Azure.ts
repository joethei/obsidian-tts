import {TTSService} from "./TTSService";
import TTSPlugin from "../main";
import {
	SpeakerAudioDestination,
	SpeechConfig,
	AudioConfig,
	SpeechSynthesizer,
	ResultReason
} from "microsoft-cognitiveservices-speech-sdk";

export class Azure implements TTSService {
	plugin: TTSPlugin;
	id = "azure";
	name = "Azure";
	_isPlaying = false;
	_duration = 0;

	source: SpeakerAudioDestination | null = null;

	constructor(plugin: TTSPlugin) {
		this.plugin = plugin;
	}

	languages: [];

	async getVoices(): Promise<{ id: string; name: string; languages: string[] }[]> {
		return [
			{
				id: "alloy",
				name: "Alloy",
				languages: this.languages,
			},
			{
				id: "en-CA-ClaraNeural",
				name: "ClaraNeural",
				languages: this.languages,
			},
			{
				id: "en-CA-LiamNeural",
				name: "LiamNeural",
				languages: this.languages,
			},
			{
				id: "en-US-AvaNeural",
				name: "AvaNeural",
				languages: this.languages,
			},
			{
				id: "en-US-AndrewNeural",
				name: "AndrewNeural",
				languages: this.languages,
			},
			{
				id: "en-US-EmmaNeural",
				name: "EmmaNeural",
				languages: this.languages,
			},
			{
				id: "en-US-BrianNeural",
				name: "BrianNeural",
				languages: this.languages,
			},
			{
				id: "en-US-JennyNeural",
				name: "JennyNeural",
				languages: this.languages,
			},
			{
				id: "en-US-GuyNeural",
				name: "GuyNeural",
				languages: this.languages,
			},
			{
				id: "en-US-AriaNeural",
				name: "AriaNeural",
				languages: this.languages,
			},
			{
				id: "en-US-DavisNeural",
				name: "DavisNeural",
				languages: this.languages,
			},
			{
				id: "en-US-JaneNeural",
				name: "JaneNeural",
				languages: this.languages,
			},
			{
				id: "en-US-JasonNeural",
				name: "JasonNeural",
				languages: this.languages,
			},
			{
				id: "en-US-SaraNeural",
				name: "SaraNeural",
				languages: this.languages,
			},
			{
				id: "en-US-TonyNeural",
				name: "TonyNeural",
				languages: this.languages,
			},
			{
				id: "en-US-NancyNeural",
				name: "NancyNeural",
				languages: this.languages,
			},
			{
				id: "en-US-AmberNeural",
				name: "AmberNeural",
				languages: this.languages,
			},
			{
				id: "en-US-AnaNeural",
				name: "AnaNeural",
				languages: this.languages,
			},
			{
				id: "en-US-AshleyNeural",
				name: "AshleyNeural",
				languages: this.languages,
			},
			{
				id: "en-US-BrandonNeural",
				name: "BrandonNeural",
				languages: this.languages,
			},
			{
				id: "en-US-ChristopherNeural",
				name: "ChristopherNeural",
				languages: this.languages,
			},
			{
				id: "en-US-CoraNeural",
				name: "CoraNeural",
				languages: this.languages,
			},
			{
				id: "en-US-ElizabethNeural",
				name: "ElizabethNeural",
				languages: this.languages,
			},
			{
				id: "en-US-EricNeural",
				name: "EricNeural",
				languages: this.languages,
			},
			{
				id: "en-US-JacobNeural",
				name: "JacobNeural",
				languages: this.languages,
			},
		];
	}

	isConfigured(): boolean {
		return this.plugin.settings.services.azure.key.length > 0 &&
			this.plugin.settings.services.azure.region.length > 0;
	}

	isPaused(): boolean {
		return this.source && !this._isPlaying;
	}

	isSpeaking(): boolean {
		return this.source ? true : false;
	}

	isValid(): boolean {
		return this.plugin.settings.services.azure.key.length > 0 &&
			this.plugin.settings.services.azure.region.length > 0;
	}

	pause(): void {
		this._isPlaying = false;
		this.source.pause();
	}

	resume(): void {
		this._isPlaying = true;
		this.source.resume();
	}

	async sayWithVoice(text: string, voice: string) : Promise<void> {
		const speechConfig = SpeechConfig.fromSubscription(
			this.plugin.settings.services.azure.key,
			this.plugin.settings.services.azure.region
		);
		speechConfig.speechSynthesisVoiceName = voice;
		this.source = new SpeakerAudioDestination();
		// this.source = new AzurePlayer();
		const audioConfig = AudioConfig.fromSpeakerOutput(this.source);
		const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

		const regionCode = voice.split('-').slice(0, 2).join('-');
		const {role, style, intensity} = this.plugin.settings.services.azure;

		// SSML content
		const ssmlContent = text
			? `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${regionCode}">
			<voice name="${voice}">
				<mstts:express-as role="${role}" style="${style}" styledegree="${intensity / 100}">
					<prosody rate="${this.plugin.settings.rate}" volume="${this.plugin.settings.volume * 100}">
						${text || ""}
					</prosody>
				</mstts:express-as>
			</voice>
		</speak>`
			: "";

		// Start the synthesizer and wait for a result.
		ssmlContent &&
			synthesizer.speakSsmlAsync(
				ssmlContent,
				result => {
					if (
						result.reason ===
						ResultReason.SynthesizingAudioCompleted
					) {
						synthesizer.close();
						this._duration = result.audioDuration / 10000000;
						this._isPlaying = true;
						this.source.onAudioEnd = () => {
							this._isPlaying = false;
						};
						this.plugin.statusbar.createSpan({text: 'Speaking'});
					}
				},
				function (e) {
					console.log(e);
					synthesizer.close();
				}
			);
	}

	stop(): void {
		this._isPlaying = false;
		this.source.pause();
		this.source.close();
		this.source = null;
	}

	get progress(): number {
		if (!this.source) return 0;
		const currentTime = this.source.internalAudio.currentTime;
		const progress = currentTime / this._duration;
		return Math.max(0, Math.min(100, progress * 100));
	}

	seek(progress: number): void {
		if (!this.source) return;
		const currentTime = this._duration * (progress / 100);
		this.source.internalAudio.currentTime = currentTime;
	}
}
