import {
	addIcon,
	MarkdownView, Menu, Notice, Platform,
	Plugin, setIcon, TFile
} from 'obsidian';
import {DEFAULT_SETTINGS, LanguageVoiceMap, TTSSettings, TTSSettingsTab} from "./settings";
import {SpeechSynthesis} from "./services/SpeechSynthesis";
import {registerAPI} from "@vanakat/plugin-api";
import {TTSService} from "./services/TTSService";
import {detect} from "tinyld";


export default class TTSPlugin extends Plugin {
	ttsService: TTSService;
	settings: TTSSettings;
	statusbar: HTMLElement;

	services: TTSService[] = [];

	async onload(): Promise<void> {
		// from https://github.com/phosphor-icons/core
		addIcon('tts-play-pause', '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect x="0" y="0" width="256" height="256" fill="none" stroke="none" /><path fill="currentColor" d="M184 64v128a8 8 0 0 1-16 0V64a8 8 0 0 1 16 0Zm40-8a8 8 0 0 0-8 8v128a8 8 0 0 0 16 0V64a8 8 0 0 0-8-8Zm-80 72a15.76 15.76 0 0 1-7.33 13.34l-88.19 56.15A15.91 15.91 0 0 1 24 184.15V71.85a15.91 15.91 0 0 1 24.48-13.34l88.19 56.15A15.76 15.76 0 0 1 144 128Zm-16.18 0L40 72.08v111.85Z"/></svg>');

		this.services.push(new SpeechSynthesis(this));
		//this.services.push(new OpenAI(this));
		this.ttsService = this.services[0];

		console.log("loading tts plugin");

		//https://bugs.chromium.org/p/chromium/issues/detail?id=487255
		if (Platform.isAndroidApp) {
			new Notice("TTS: due to a bug in android this plugin does not work on this platform");
			this.unload();
		}

		await this.loadSettings();

		this.addCommand({
			id: 'start-tts-playback',
			name: 'Start playback',
			icon: 'play',
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!checking && markdownView)
					this.play(markdownView);
				return !!markdownView;
			}
		});

		this.addCommand({
			id: 'cancel-tts-playback',
			name: 'Stop playback',
			icon: 'stop',
			checkCallback: (checking: boolean) => {
				if (!checking)
					this.ttsService.stop();
				return this.ttsService.isSpeaking();

			}
		});

		this.addCommand({
			id: 'pause-tts-playback',
			name: 'pause playback',
			icon: 'pause',
			checkCallback: (checking: boolean) => {
				if (!checking)
					this.ttsService.pause();
				return this.ttsService.isSpeaking();
			}
		});

		this.addCommand({
			id: 'resume-tts-playback',
			name: 'Resume playback',
			icon: 'play-audio-glyph',
			checkCallback: (checking: boolean) => {
				if (!checking)
					this.ttsService.resume();
				return this.ttsService.isPaused();
			}
		});

		this.addCommand({
			id: 'start-pause-resume-tts-playback',
			name: 'Play/Pause',
			icon: 'tts-play-pause',
			checkCallback: (checking) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!checking && markdownView) {
					if (this.ttsService.isPaused()) {
						this.ttsService.resume();
					} else if (this.ttsService.isSpeaking()) {
						this.ttsService.pause();
					} else {
						this.play(markdownView);
					}
				}
				return !!markdownView;

			}
		});

		this.addCommand({
			id: 'cursor',
			name: 'after cursor',
			editorCallback: (editor, _) => {
				console.log(editor.getRange(editor.getCursor("from"), {line: editor.lastLine(), ch: editor.getLine(editor.lastLine()).length}));
			}
		})

		//clear statusbar text if not speaking
		this.registerInterval(window.setInterval(() => {
			if (!this.ttsService.isSpeaking()) {
				this.statusbar.empty();
				setIcon(this.statusbar, 'audio-file');
			}
		}, 1000 * 10));

		this.addRibbonIcon("audio-file", "Text to Speech", async (event) => {
			await this.createMenu(event);
		});

		this.registerEvent(this.app.workspace.on('editor-menu', ((menu, _, markdownView) => {
			menu.addItem((item) => {
				item
					.setTitle(activeWindow.getSelection().toString().length > 0 ? "Read selected text" : "Read the note")
					.setIcon("audio-file")
					.onClick(() => {
						this.play(markdownView);
					});
			});
		})));
		this.registerEvent(this.app.workspace.on('file-menu', ((menu, file) => {
			if(file instanceof TFile) {
				menu.addItem((item) => {
					item
						.setTitle("Read the note")
						.setIcon("audio-file")
						.onClick(async () => {
							const content = await this.app.vault.cachedRead(file);
							await this.say(file.name, content);
						});
				});
			}

		})));

		this.registerEvent(this.app.workspace.on('layout-change', (() => {
			if (this.settings.stopPlaybackWhenNoteChanges) {
				this.ttsService.stop();
			}
		})));

		this.addSettingTab(new TTSSettingsTab(this));
		this.statusbar = this.addStatusBarItem();
		setIcon(this.statusbar, 'audio-file');
		this.statusbar.classList.add("mod-clickable");
		this.statusbar.setAttribute("aria-label", "Text to Speech");
		this.statusbar.setAttribute("aria-label-position", "bottom");
		this.statusbar.onClickEvent(async (event) => {
			await this.createMenu(event);
		});

		registerAPI("tts", this.ttsService, this);
	}

	async createMenu(event: MouseEvent): Promise<void> {
		const menu = new Menu(this.app);

		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (markdownView) {
			if (window.speechSynthesis.speaking) {
				menu.addItem((item) => {
					item
						.setIcon("play-audio-glyph")
						.setTitle("Add to playback queue")
						.onClick((async () => {
							await this.play(markdownView);
						}));
				});
			} else {
				await this.play(markdownView);
				return;
			}
		}

		if (window.speechSynthesis.speaking) {
			menu.addItem((item) => {
				item
					.setIcon("stop-audio-glyph")
					.setTitle("Stop")
					.onClick(async () => {
						this.ttsService.stop();
					});
			});


			if (window.speechSynthesis.paused) {
				menu.addItem((item) => {
					item
						.setIcon("play-audio-glyph")
						.setTitle("Resume")
						.onClick(async () => {
							this.ttsService.resume();
						});
				});
			} else {
				menu.addItem((item) => {
					item
						.setIcon("paused")
						.setTitle("Pause")
						.onClick(async () => {
							this.ttsService.pause();
						});
				});
			}
		}


		menu.showAtPosition({x: event.x, y: event.y});
	}

	async onunload(): Promise<void> {
		console.log("unloading tts plugin");
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		//migration
		let migrate = false;
		if (!this.settings.defaultVoice.includes('-')) {
			this.settings.defaultVoice = 'speechSynthesis-' + this.settings.defaultVoice;
			migrate = true;
		}
		for (const languageVoice of this.settings.languageVoices) {
			if (!languageVoice.voice.includes('-')) {
				languageVoice.voice = 'speechSynthesis-' + languageVoice.voice;
				migrate = true;
			}
		}
		if (migrate) {
			await this.saveSettings();
		}
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async onExternalSettingsChange() {
		await this.loadSettings();
	}

	getVoice(languageCode: string): string {
		const filtered = this.settings.languageVoices.filter((lang: LanguageVoiceMap) => lang.language === languageCode);
		if (filtered.length === 0) return null;
		return filtered[0].voice;
	}

	async say(text: string, languageCode?: string): Promise<void> {
		let usedVoice = this.settings.defaultVoice;
		if (languageCode && languageCode.length !== 0) {
			const voice = this.getVoice(languageCode);
			if (voice) {
				usedVoice = voice;
			} else {
				new Notice("TTS: could not find voice for language " + languageCode + ". Using default voice.");
			}
		}
		const split = usedVoice.split(/-(.*)/s);
		const service = this.services.filter(service => service.id === split[0] && service.isConfigured() && service.isValid()).first();
		if (service === undefined) {
			new Notice("TTS: Could not use configured language, please check your settings.\nUsing default voice");
			return;
		}

		await service.sayWithVoice(text, split[1]);
	}

	prepareText(title: string, text: string) {
		let content = text;
		if (!this.settings.speakSyntax) {
			content = content.replace(/#/g, "");
			content = content.replace(/-/g, "");
			content = content.replace(/_/g, "");
			content = content.replace(/\*/g, "");
			content = content.replace(/\^/g, "");
			content = content.replace(/==/g, "");

			//block references
			content = content.replace(/^\S{6}/g, "");
		}
		if (!this.settings.speakLinks) {
			//regex from https://stackoverflow.com/a/37462442/5589264
			content = content.replace(/(?:__|[*#])|\[(.*?)]\(.*?\)/gm, '$1');
			content = content.replace(/http[s]:\/\/[^\s]*/gm, '');
			console.log(content);
		}
		if (!this.settings.speakCodeblocks) {
			content = content.replace(/```[\s\S]*?```/g, '');
		}

		if (!this.settings.speakComments) {
			content = content.replace(/%[\s\S]*?%/g, '');
			content = content.replace(/<!--[\s\S]*?-->/g, '');
		}

		if (!this.settings.speakEmoji) {
			//regex from https://ihateregex.io/expr/emoji/
			content = content.replace(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g, '');
		}

		//add pauses, taken from https://stackoverflow.com/a/50944593/5589264
		content = content.replace(/\n/g, " ! ");

		//only speak link aliases.
		content = content.replace(/\[\[(.*\|)(.*)]]/gm, '$2');

		if (this.settings.speakTitle && title?.length > 0) {
			content = title + " ! ! " + content;
		}

		return content;
	}

	async play(view: MarkdownView): Promise<void> {
		const isPreview = view.getMode() === "preview";

		const previewText = view.previewMode.containerEl.innerText;


		const selectedText = view.editor.getSelection().length > 0 ? view.editor.getSelection() : window.getSelection().toString();
		let content = selectedText.length > 0 ? selectedText : view.getViewData();
		if (isPreview) {
			content = previewText;
		}
		let language = this.getLanguageFromFrontmatter(view);
		if (language === "") {
			language = detect(content);
		}

		if (!this.settings.speakFrontmatter) {
			if (!isPreview) {
				content = content.replace("---", "");
				content = content.substring(content.indexOf("---") + 1);
			}
		}
		await this.say(content, language);

	}

	getLanguageFromFrontmatter(view: MarkdownView): string {
		if(view.file) {
			return this.app.metadataCache.getFileCache(view.file).frontmatter?.lang;
		}
	}
}
