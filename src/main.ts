import {
	MarkdownView, Menu, Notice, Platform,
	Plugin
} from 'obsidian';
import { DEFAULT_SETTINGS, TTSSettings, TTSSettingsTab } from "./settings";
import { TTSServiceImplementation } from "./TTSServiceImplementation";
import { registerAPI } from "@vanakat/plugin-api";
import { TTSService } from "./TTSService";


export default class TTSPlugin extends Plugin {
	ttsService: TTSService;
	settings: TTSSettings;
	statusbar: HTMLElement;

	async onload(): Promise<void> {
		this.ttsService = new TTSServiceImplementation(this);

		console.debug("loading tts plugin");

		//https://bugs.chromium.org/p/chromium/issues/detail?id=487255
		if (Platform.isAndroidApp) {
			new Notice("TTS: due to a bug in android this plugin does not work on this platform");
			this.unload();
		}

		await this.loadSettings();

		this.addCommand({
			id: 'start-tts-playback',
			name: 'Start playback',
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
			checkCallback: (checking: boolean) => {
				if (!checking)
					this.ttsService.stop();
				return this.ttsService.isSpeaking();

			}
		});

		this.addCommand({
			id: 'pause-tts-playback',
			name: 'pause playback',
			checkCallback: (checking: boolean) => {
				if (!checking)
					this.ttsService.pause();
				return this.ttsService.isSpeaking();
			}
		});

		this.addCommand({
			id: 'resume-tts-playback',
			name: 'Resume playback',
			checkCallback: (checking: boolean) => {
				if (!checking)
					this.ttsService.resume();
				return this.ttsService.isPaused();
			}
		});

		this.addCommand({
			id: 'start-pause-resume-tts-toggle',
			name: 'Start pause resume toggle',
			checkCallback: (checking: boolean) => {
				if (!checking) {
					const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (markdownView) {
						if (this.ttsService.isSpeaking() && !this.ttsService.isPaused()) {
							this.ttsService.pause();
						}
						else if (this.ttsService.isPaused()) {
							this.ttsService.resume();
						}
						else {
							this.ttsService.play(markdownView);
						}
					}
					return !!markdownView
				}
			}
		});

		//clear statusbar text if not speaking
		this.registerInterval(window.setInterval(() => {
			if (!this.ttsService.isSpeaking()) {
				this.statusbar.setText("TTS");
			}
		}, 1000 * 10));

		this.addRibbonIcon("audio-file", "Text to Speech", async (event) => {
			await this.createMenu(event);
		});

		this.registerEvent(this.app.workspace.on('editor-menu', ((menu, _, markdownView) => {
			menu.addItem((item) => {
				item
					.setTitle(window.getSelection().toString().length > 0 ? "Read selected text" : "Read the note")
					.setIcon("audio-file")
					.onClick(() => {
						this.ttsService.play(markdownView);
					});
			});
		})));

		this.registerEvent(this.app.workspace.on('layout-change', (() => {
			if (this.settings.stopPlaybackWhenNoteChanges) {
				this.ttsService.stop();
			}
		})));

		this.addSettingTab(new TTSSettingsTab(this));
		this.statusbar = this.addStatusBarItem();
		this.statusbar.setText("TTS");
		this.statusbar.classList.add("mod-clickable");
		this.statusbar.setAttribute("aria-label", "Text to Speech");
		this.statusbar.setAttribute("aria-label-position", "top");
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
						.onClick((() => {
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


		menu.showAtPosition({ x: event.x, y: event.y });
	}

	async onunload(): Promise<void> {
		console.debug("unloading tts plugin");
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}