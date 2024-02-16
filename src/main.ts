import {
	addIcon,
	MarkdownView, Menu, Notice, Platform,
	Plugin, setIcon, TFile
} from 'obsidian';
import {DEFAULT_SETTINGS, TTSSettings, TTSSettingsTab} from "./settings";
import {TTSServiceImplementation} from "./TTSServiceImplementation";
import {registerAPI} from "@vanakat/plugin-api";
import {TTSService} from "./TTSService";


export default class TTSPlugin extends Plugin {
	ttsService: TTSService;
	settings: TTSSettings;
	statusbar: HTMLElement;

	async onload(): Promise<void> {
		// from https://github.com/phosphor-icons/core
		addIcon('tts-play-pause', '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect x="0" y="0" width="256" height="256" fill="none" stroke="none" /><path fill="currentColor" d="M184 64v128a8 8 0 0 1-16 0V64a8 8 0 0 1 16 0Zm40-8a8 8 0 0 0-8 8v128a8 8 0 0 0 16 0V64a8 8 0 0 0-8-8Zm-80 72a15.76 15.76 0 0 1-7.33 13.34l-88.19 56.15A15.91 15.91 0 0 1 24 184.15V71.85a15.91 15.91 0 0 1 24.48-13.34l88.19 56.15A15.76 15.76 0 0 1 144 128Zm-16.18 0L40 72.08v111.85Z"/></svg>');

		this.ttsService = new TTSServiceImplementation(this);

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
					this.ttsService.play(markdownView);
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
			id: 'play-pause',
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
						this.ttsService.play(markdownView);
					}
				}
				return !!markdownView;

			}
		});

		this.addCommand({
			id: 'cursor',
			name: 'after cursor',
			editorCallback: (editor, view) => {
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
						this.ttsService.play(markdownView);
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
							await this.ttsService.say(file.name, content);
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
							this.ttsService.play(markdownView);
						}));
				});
			} else {
				this.ttsService.play(markdownView);
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
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async onExternalSettingsChange() {
		await this.loadSettings();
	}
}
