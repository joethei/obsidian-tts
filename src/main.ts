import {
	MarkdownView, Menu, Notice, Platform,
	Plugin
} from 'obsidian';
import { DEFAULT_SETTINGS, TTSSettings, TTSSettingsTab } from "./settings";
import { TTSServiceImplementation } from "./TTSServiceImplementation";
import { registerAPI } from "@vanakat/plugin-api";
import { TTSService } from "./TTSService";
import { TTSPluginUpdateInfo } from './updateInfo';


export default class TTSPlugin extends Plugin {
	ttsService: TTSService;
	settings: TTSSettings;
	statusbar: HTMLElement;
	paused: boolean = false;

	async onload(): Promise<void> {
		this.ttsService = new TTSServiceImplementation(this);

		console.debug("loading tts plugin");

		//https://bugs.chromium.org/p/chromium/issues/detail?id=487255
		if (Platform.isAndroidApp) {
			new Notice("TTS: due to a bug in android this plugin does not work on this platform");
			this.unload();
		}

		await this.loadSettings();
		if (
			this.settings.savedVersion !== "0.0.0" && // never installed
			this.settings.savedVersion !== this.manifest.version // new version
		) {
			new TTSPluginUpdateInfo(this.app, this).open();
		}

		this.addCommand({
			id: 'start-tts-playback',
			name: 'Start playback',
			checkCallback: (checking: boolean) => {
				if (!checking) {
					const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (markdownView) {
						if (this.ttsService.isSpeaking() && !this.paused) {
							console.debug("pausing")
							this.ttsService.pause()
							this.paused = true
						}
						else if (this.paused) {
							console.debug("resuming")
							this.ttsService.resume(); this.paused = false
						}
						else {
							console.debug("playing")
							this.ttsService.play(markdownView)
						}
					}
					return !!markdownView
				}
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
						.onClick((async () => {
							await this.ttsService.play(markdownView);
						}));
				});
			} else {
				await this.ttsService.play(markdownView);
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
		console.debug("unloading tts plugin");
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
