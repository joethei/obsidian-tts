import { SpeechSynthesisOutputFormat } from "microsoft-cognitiveservices-speech-sdk";

export interface LanguageVoiceMap {
	id: string;
    language: string;
    voice: string;
}

export interface TTSDefaultVoices {
	[service: string]: string;
}

export interface TTSSettings {
    defaultVoice: string,
	defaultVoices: TTSDefaultVoices;
	defaultService: string,
    pitch: number;
    rate: number;
    volume: number;
    speakLinks: boolean;
    speakFrontmatter: boolean;
    speakSyntax: boolean;
	speakCodeblocks: boolean;
    speakTitle: boolean;
	speakEmoji: boolean;
	speakComments: boolean;
    languageVoices: LanguageVoiceMap[];
	stopPlaybackWhenNoteChanges: boolean;
	services: {
		openai: {
			key: string;
		},
		azure: {
			key: string;
			region: string;
			role: string;
			style: string;
			intensity: number;
		}
	}
}

export const DEFAULT_SETTINGS: TTSSettings = {
    defaultVoice: "",
	defaultVoices: {},
	defaultService: "speechSynthesis",
    pitch: 1,
    rate: 1,
    volume: 1,
    speakLinks: false,
    speakFrontmatter: false,
    speakSyntax: false,
    speakTitle: true,
	speakCodeblocks: false,
	speakEmoji: false,
	speakComments: false,
    languageVoices: [],
	stopPlaybackWhenNoteChanges: false,
	services: {
		openai: {
			key: '',
		},
		azure: {
			key: '',
			region: '',
			role: 'OlderAdultFemale',
			style: 'chat',
			intensity: 1
		}
	}
}

export const VOICE_FORMAT_NAMES = [
	"raw-8khz-8bit-mono-mulaw(.wav)",
	"riff-16khz-16kbps-mono-siren(.wav)",
	"audio-16khz-16kbps-mono-siren(.wav)",
	"audio-16khz-32kbitrate-mono-mp3(.mp3)",
	"audio-16khz-128kbitrate-mono-mp3(.mp3)",
	"audio-16khz-64kbitrate-mono-mp3(.mp3)",
	"raw-16khz-16bit-mono-truesilk(.wav)",
	"riff-16khz-16bit-mono-pcm(.wav)",
	"riff-24khz-16bit-mono-pcm(.wav)",
	"riff-8khz-8bit-mono-mulaw(.wav)",
	"raw-16khz-16bit-mono-pcm(.wav)",
	"raw-24khz-16bit-mono-pcm(.wav)",
	"raw-8khz-16bit-mono-pcm(.wav)",
	"ogg-16khz-16bit-mono-opus(.wav)",
	"raw-48khz-16bit-mono-pcm(.wav)",
	"ogg-48khz-16bit-mono-opus(.wav)",
	"webm-16khz-16bit-mono-opus(.wav)",
	"webm-24khz-16bit-mono-opus(.wav)",
	"raw-24khz-16bit-mono-truesilk(.wav)",
	"raw-8khz-8bit-mono-alaw(.wav)",
	"riff-8khz-8bit-mono-alaw(.wav)",
	"webm-24khz-16bit-24kbps-mono-opus(.wav)",
	"audio-16khz-16bit-32kbps-mono-opus(.wav)",
	"audio-24khz-16bit-48kbps-mono-opus(.wav)",
	"audio-24khz-16bit-24kbps-mono-opus(.wav)",
	"raw-22050hz-16bit-mono-pcm(.wav)",
	"riff-22050hz-16bit-mono-pcm(.wav)",
	"raw-44100hz-16bit-mono-pcm(.wav)",
	"riff-44100hz-16bit-mono-pcm(.wav)",
];

const VOICE_FORMAT_VASL = Object.keys(SpeechSynthesisOutputFormat).filter(
	(val) => isNaN(Number(val))
);

export const SERVICE_OPTIONS = {
	"openai": "OpenAI",
	"azure": "Azure",
};

export const STYLE_OPTIONS = {
	advertisement_upbeat: "advertisement upbeat",
	affectionate: "affectionate",
	angry: "angry",
	assistant: "assistant",
	calm: "calm",
	chat: "chat",
	cheerful: "cheerful",
	customerservice: "customerservice",
	depressed: "depressed",
	disgruntled: "disgruntled",
	"documentary-narration": "documentary narration",
	embarrassed: "embarrassed",
	empathetic: "empathetic",
	envious: "envious",
	excited: "excited",
	fearful: "fearful",
	friendly: "friendly",
	gentle: "gentle",
	hopeful: "hopeful",
	lyrical: "lyrical",
	"narration-professional": "narration professional",
	"narration-relaxed": "narration relaxed",
	newscast: "newscast",
	"newscast-casual": "newscast casual",
	"newscast-formal": "newscast formal",
	"poetry-reading": "poetry reading",
	sad: "sad",
	serious: "serious",
	shouting: "shouting",
	sports_commentary: "sports commentary",
	sports_commentary_excited: "sports commentary excited",
	whispering: "whispering",
	terrified: "terrified",
	unfriendly: "unfriendly",
};

export const ROLE_OPTIONS = {
	Girl: "Girl",
	Boy: "Boy",
	YoungAdultFemale: "YoungAdultFemale",
	YoungAdultMale: "YoungAdultMale",
	OlderAdultFemale: "OlderAdultFemale",
	OlderAdultMale: "OlderAdultMale",
	SeniorFemale: "SeniorFemale",
	SeniorMale: "SeniorMale",
};

export const VOICE_FORMAT_MAP = VOICE_FORMAT_NAMES.reduce(
	(res, key, index) => ({
		...res,
		[key]: VOICE_FORMAT_VASL[index],
	}),
	{}
);
