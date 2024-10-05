import {
	addIcon, MarkdownFileInfo,
	MarkdownView, Notice, Platform,
	Plugin, setIcon, TFile
} from 'obsidian';
import {TTSSettingsTab} from "./settings";
import { DEFAULT_SETTINGS, LanguageVoiceMap, TTSSettings } from "./constants";
import {registerAPI} from "@vanakat/plugin-api";
import {detect} from "tinyld";
import {ServiceManager} from "./ServiceManager";
import { cleanText } from './utils';
import 'regenerator-runtime/runtime';


export default class TTSPlugin extends Plugin {
	settings: TTSSettings;
	statusbar: HTMLElement;
	menuVisible = false;
	statusbarIntervalId: number;
	seekbar: HTMLElement;
	playButton: HTMLElement;
	pauseButton: HTMLElement;
	stopButton: HTMLElement;


	serviceManager: ServiceManager;

	get isPaused(): boolean {
		return this.serviceManager.isPaused();
	}

	async onload(): Promise<void> {
		// from https://github.com/phosphor-icons/core
		addIcon('tts-play-pause', '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect x="0" y="0" width="256" height="256" fill="none" stroke="none" /><path fill="currentColor" d="M184 64v128a8 8 0 0 1-16 0V64a8 8 0 0 1 16 0Zm40-8a8 8 0 0 0-8 8v128a8 8 0 0 0 16 0V64a8 8 0 0 0-8-8Zm-80 72a15.76 15.76 0 0 1-7.33 13.34l-88.19 56.15A15.91 15.91 0 0 1 24 184.15V71.85a15.91 15.91 0 0 1 24.48-13.34l88.19 56.15A15.76 15.76 0 0 1 144 128Zm-16.18 0L40 72.08v111.85Z"/></svg>');



		console.log("loading tts plugin");

		//https://bugs.chromium.org/p/chromium/issues/detail?id=487255
		if (Platform.isAndroidApp) {
			new Notice("TTS: due to a bug in android this plugin does not work on this platform");
			this.unload();
		}

		await this.loadSettings();

		this.serviceManager = new ServiceManager(this);

		await this.migrateSettings();

		this.addCommand({
			id: 'start-tts-playback',
			name: 'Start playback',
			icon: 'play',
			checkCallback: (checking: boolean) => {
				const info = this.app.workspace.activeEditor;
				if (!checking)
					this.play(info);
				return !!info;
			}
		});

		this.addCommand({
			id: 'cancel-tts-playback',
			name: 'Stop playback',
			icon: 'stop',
			checkCallback: (checking: boolean) => {
				if (!checking) {
					this.serviceManager.stop();
				}
				return this.serviceManager.isSpeaking();

			}
		});

		this.addCommand({
			id: 'pause-tts-playback',
			name: 'pause playback',
			icon: 'pause',
			checkCallback: (checking: boolean) => {
				if (!checking) {
					this.serviceManager.pause();
				}
				return this.serviceManager.isSpeaking();
			}
		});

		this.addCommand({
			id: 'resume-tts-playback',
			name: 'Resume playback',
			icon: 'play-audio-glyph',
			checkCallback: (checking: boolean) => {
				if (!checking)
					this.serviceManager.resume();
				return this.serviceManager.isPaused();
			}
		});

		this.addCommand({
			id: 'start-pause-resume-tts-playback',
			name: 'Play/Pause',
			icon: 'tts-play-pause',
			checkCallback: (checking) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!checking && markdownView) {
					if (this.serviceManager.isPaused()) {
						this.serviceManager.resume();
					} else if (this.serviceManager.isSpeaking()) {
						this.serviceManager.pause();
					} else {
						this.play(markdownView);
					}
				}
				return !!markdownView;

			}
		});

		/*this.addCommand({
			id: 'cursor',
			name: 'after cursor',
			editorCallback: (editor, _) => {
				console.log(editor.getRange(editor.getCursor("from"), {line: editor.lastLine(), ch: editor.getLine(editor.lastLine()).length}));
			}
		})*/

		//clear statusbar text if not speaking
		this.registerInterval(window.setInterval(() => {
			if (!this.serviceManager.isSpeaking()) {
				this.statusbar.empty();
				setIcon(this.statusbar, 'audio-file');
			}
		}, 1000 * 10));

		this.addRibbonIcon("audio-file", "Text to Speech", async () => {
			await this.createMenu();
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
				this.serviceManager.stop();
			}
		})));

		this.addSettingTab(new TTSSettingsTab(this));
		this.statusbar = this.addStatusBarItem();
		setIcon(this.statusbar, 'audio-file');
		this.statusbar.classList.add("mod-clickable");
		this.statusbar.setAttribute("aria-label", "Text to Speech");
		this.statusbar.setAttribute("aria-label-position", "bottom");
		this.statusbar.onClickEvent(async () => {
			if (this.menuVisible) {
				this.removeMenu();
				return;
			}

			await this.createMenu();
		});

		registerAPI("tts", this.serviceManager, this);
	}

	removeMenu(): void {
		this.menuVisible = false;
		clearInterval(this.statusbarIntervalId);
		this.seekbar?.remove();
		this.playButton?.remove();
		this.pauseButton?.remove();
		this.stopButton?.remove();
	}

	async createMenu(): Promise<void> {
		const getSeekbarBackgroundStyle = (value: number): string => {
			return 'linear-gradient(to right, var(--interactive-accent) 0%, var(--interactive-accent) ' + value + '%, #fff ' + value + '%, white 100%)';
		}
		const updateSeekbar = () => {
			const value = this.serviceManager.progress;
			this.seekbar.querySelector('input').value = value.toString();
			this.seekbar.querySelector('input').style.background = getSeekbarBackgroundStyle(value);
		};
		const createPlayButton = () => {
			this.playButton = this.addStatusBarItem();
			setIcon(this.playButton, 'play-audio-glyph');
			this.playButton.onClickEvent(() => {
				this.serviceManager.resume();
				this.statusbarIntervalId = this.registerInterval(window.setInterval(updateSeekbar, 1000));
				this.playButton.remove();
				createPauseButton();
			});
		}
		const createPauseButton = () => {
			this.pauseButton = this.addStatusBarItem();
			setIcon(this.pauseButton, 'pause');
			this.pauseButton.onClickEvent(() => {
				clearInterval(this.statusbarIntervalId);
				this.serviceManager.pause();
				this.pauseButton.remove();
				createPlayButton();
			});
		}

		const markdownView = this.app.workspace.activeEditor;
		if (markdownView) {
			this.menuVisible = true;
			if (this.serviceManager.isSpeaking()) {
				this.playButton = this.addStatusBarItem()
				setIcon(this.playButton, 'play-audio-glyph');
				this.playButton.onClickEvent(async () => {
					await this.play(markdownView);
				});
			} else {
				await this.play(markdownView);
				return;
			}
		}

		if (this.serviceManager.isSpeaking()) {
			this.menuVisible = true;
			// Seekbar
			const curProgress = this.serviceManager.progress ? this.serviceManager.progress : 0;
			this.seekbar = this.addStatusBarItem();
			const slider = this.seekbar.createEl('input', {type: 'range', attr: {min: '0', max: '100', value: curProgress.toString(), step: '1'}});
			slider.style.background = getSeekbarBackgroundStyle(curProgress);
			slider.style.border = "solid 1px var(--interactive-accent)";
			slider.style.borderRadius = "8px";
			slider.style.height = "7px";
			slider.style.width = "200px";
			slider.style.outline = "none";
			slider.style.transition = "background 450ms ease-in";
			slider.oninput = function(this: HTMLInputElement) {
				const value = parseInt(this.value);
				this.style.background = getSeekbarBackgroundStyle(value);
			};

			this.statusbarIntervalId = this.registerInterval(window.setInterval(updateSeekbar, 1000));

			this.seekbar.querySelector('input').onmousedown = () => {
				if (!this.isPaused) {
					clearInterval(this.statusbarIntervalId);
				}
			};
			this.seekbar.querySelector('input').onchange = (e) => {
				this.serviceManager.seek(parseInt((e.target as HTMLInputElement).value));
				if (!this.isPaused) {
					this.statusbarIntervalId = this.registerInterval(window.setInterval(updateSeekbar, 1000));
				}
			};

			// Stop button
			this.stopButton = this.addStatusBarItem();
			setIcon(this.stopButton, 'stop-audio-glyph');
			this.stopButton.onClickEvent(() => {
				this.serviceManager.stop();
				this.removeMenu();
			});

			if (this.serviceManager.isPaused()) {
				createPlayButton();
			} else {
				createPauseButton();
			}
		}
	}

	async onunload(): Promise<void> {
		console.log("unloading tts plugin");
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

	}

	async migrateSettings(): Promise<void> {
		let migrate = false;
		if (!this.serviceManager.getServices().some(service => this.settings.defaultVoice.includes(service.id))) {
			this.settings.defaultVoice = 'speechSynthesis-' + this.settings.defaultVoice;
			migrate = true;
		}
		for (const languageVoice of this.settings.languageVoices) {
			if (!this.serviceManager.getServices().some(service => languageVoice.voice.includes(service.id))) {
				languageVoice.id = 'speechSynthesis-' + languageVoice.voice;
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

	async onExternalSettingsChange(): Promise<void> {
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
		const service = this.serviceManager.getServices().filter(service => service.id === split[0] && service.isConfigured() && service.isValid()).first();

		if (service === undefined) {
			new Notice("TTS: Could not use configured language, please check your settings.\nUsing default voice");
			await this.serviceManager.sayWithVoice(cleanText(text), this.settings.defaultVoice);
			return;
		}

		await service.sayWithVoice(cleanText(text), split[1]);
	}

	prepareText(title: string, text: string): string {
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

	async play(info: MarkdownFileInfo): Promise<void> {

		const selectedText = info.editor.getSelection().length > 0 ? info.editor.getSelection() : activeWindow.getSelection().toString();

		let content = selectedText.length > 0 ? selectedText : await this.app.vault.cachedRead(info.file);
		let language = this.getLanguageFromFrontmatter(info.file);
		if (language === "") {
			language = detect(content);
		}

		content = this.prepareText(selectedText.length > 0 ? '' : info.file.name, content);

		if (!this.settings.speakFrontmatter) {
			if (selectedText.length === 0) {
				content = content.replace("---", "");
				content = content.substring(content.indexOf("---") + 1);
			}
		}
		await this.say(content, language);

	}

	getLanguageFromFrontmatter(file: TFile): string {
		return this.app.metadataCache.getFileCache(file).frontmatter?.lang;
	}

}
