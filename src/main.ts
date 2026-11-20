import {
	addIcon, getFrontMatterInfo, MarkdownFileInfo,
	MarkdownView, Menu, Notice, Platform,
	Plugin, setIcon, TAbstractFile, TFile
} from 'obsidian';
import {DEFAULT_SETTINGS, LanguageVoiceMap, TTSSettings, TTSSettingsTab} from "./settings";
import {registerAPI} from "@vanakat/plugin-api";
import {detect} from "tinyld";
import {ServiceManager} from "./ServiceManager";
import {prepareText} from "./textPreparation";
import {TTSService} from "./services/TTSService";

/**
 * A part of a note that should be read.
 */
interface SpeakRequest {
	/** the note the text comes from, used for the language in the frontmatter */
	file: TFile | null;
	source: string;
	/** range in source that should be read */
	from: number;
	to: number;
	/** spoken first if the user enabled it, empty to skip */
	title: string;
	stripFrontmatter: boolean;
}

function isMarkdownFile(file: TAbstractFile): file is TFile {
	return file instanceof TFile && file.extension === "md";
}

export default class TTSPlugin extends Plugin {
	settings: TTSSettings;
	statusbar: HTMLElement;
	private controls: HTMLElement;
	private playPauseButton: HTMLElement;
	private seekbar: HTMLInputElement;
	//true while the user drags the seekbar, so the periodic update does not move it back.
	private seeking = false;

	serviceManager: ServiceManager;


	async onload(): Promise<void> {
		// from https://github.com/phosphor-icons/core
		addIcon('tts-play-pause', '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect x="0" y="0" width="256" height="256" fill="none" stroke="none" /><path fill="currentColor" d="M184 64v128a8 8 0 0 1-16 0V64a8 8 0 0 1 16 0Zm40-8a8 8 0 0 0-8 8v128a8 8 0 0 0 16 0V64a8 8 0 0 0-8-8Zm-80 72a15.76 15.76 0 0 1-7.33 13.34l-88.19 56.15A15.91 15.91 0 0 1 24 184.15V71.85a15.91 15.91 0 0 1 24.48-13.34l88.19 56.15A15.76 15.76 0 0 1 144 128Zm-16.18 0L40 72.08v111.85Z"/></svg>');



		console.log("loading tts plugin");

		//https://bugs.chromium.org/p/chromium/issues/detail?id=487255
		if (Platform.isAndroidApp) {
			new Notice("TTS: due to a bug in Android this plugin does not work on this platform");
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
				return !!info?.file;
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

		//keep the playback controls in sync, speech engines do not report every state change.
		this.registerInterval(window.setInterval(() => this.updateStatusbar(), 500));

		this.addRibbonIcon("audio-file", "Text to Speech", async (event) => {
			await this.createMenu(event);
		});

		this.registerEvent(this.app.workspace.on('editor-menu', ((menu, editor, info) => {
			const selected = editor.getSelection().trim().length > 0;
			menu.addItem((item) => {
				item
					.setTitle(selected ? "Read selected text" : "Read the note")
					.setIcon("audio-file")
					.onClick(() => {
						this.play(info);
					});
			});
		})));
		this.registerEvent(this.app.workspace.on('file-menu', ((menu, file) => {
			if (isMarkdownFile(file)) {
				menu.addItem((item) => {
					item
						.setTitle("Read the note")
						.setIcon("audio-file")
						.onClick(async () => {
							await this.readFile(file);
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
		this.statusbar.onClickEvent(async (event) => {
			await this.createMenu(event);
		});

		this.createControls();

		registerAPI("tts", this.serviceManager, this);
	}

	private createControls(): void {
		this.controls = this.addStatusBarItem();
		this.controls.addClass("tts-controls");

		this.playPauseButton = this.controls.createSpan({cls: "tts-control"});
		this.playPauseButton.onClickEvent(() => {
			if (this.serviceManager.isPaused()) {
				this.serviceManager.resume();
			} else {
				this.serviceManager.pause();
			}
			this.updateStatusbar();
		});

		this.seekbar = this.controls.createEl("input", {
			type: "range",
			cls: "tts-seekbar",
			attr: {min: "0", max: "100", step: "1", value: "0", "aria-label": "Playback position"}
		});
		this.seekbar.addEventListener("input", () => {
			this.seeking = true;
		});
		this.seekbar.addEventListener("change", () => {
			this.seeking = false;
			this.serviceManager.seek(parseFloat(this.seekbar.value));
		});

		const stopButton = this.controls.createSpan({cls: "tts-control", attr: {"aria-label": "Stop"}});
		setIcon(stopButton, "square");
		stopButton.onClickEvent(() => {
			this.serviceManager.stop();
			this.updateStatusbar();
		});

		this.controls.hide();
	}

	updateStatusbar(): void {
		if (!this.controls) return;
		const speaking = this.serviceManager.isSpeaking();
		this.controls.toggle(speaking);
		if (!speaking) return;

		const icon = this.serviceManager.isPaused() ? "play" : "pause";
		if (this.playPauseButton.dataset.icon !== icon) {
			setIcon(this.playPauseButton, icon);
			this.playPauseButton.dataset.icon = icon;
			this.playPauseButton.setAttr("aria-label", icon === "play" ? "Resume" : "Pause");
		}

		const progress = this.serviceManager.getProgress();
		this.seekbar.toggle(progress !== undefined);
		if (progress !== undefined && !this.seeking) {
			this.seekbar.value = progress.toString();
		}
	}

	async createMenu(event: MouseEvent): Promise<void> {
		const menu = new Menu();
		const speaking = this.serviceManager.isSpeaking();

		const markdownView = this.app.workspace.activeEditor;
		if (markdownView?.file) {
			if (speaking) {
				menu.addItem((item) => {
					item
						.setIcon("list-plus")
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

		if (speaking) {
			menu.addItem((item) => {
				item
					.setIcon("stop-audio-glyph")
					.setTitle("Stop")
					.onClick(async () => {
						this.serviceManager.stop();
					});
			});


			if (this.serviceManager.isPaused()) {
				menu.addItem((item) => {
					item
						.setIcon("play-audio-glyph")
						.setTitle("Resume")
						.onClick(async () => {
							this.serviceManager.resume();
						});
				});
			} else {
				menu.addItem((item) => {
					item
						.setIcon("pause")
						.setTitle("Pause")
						.onClick(async () => {
							this.serviceManager.pause();
						});
				});
			}
		}


		menu.showAtPosition({x: event.x, y: event.y});
	}

	async onunload(): Promise<void> {
		console.log("unloading tts plugin");
		this.serviceManager?.stop();
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

	private findService(voice: string): { service: TTSService, voice: string } | null {
		const separator = voice.indexOf("-");
		const serviceId = separator === -1 ? voice : voice.substring(0, separator);
		const service = this.serviceManager.getServices().find(service => service.id === serviceId && service.isConfigured() && service.isValid());
		if (!service) return null;
		return {service, voice: separator === -1 ? "" : voice.substring(separator + 1)};
	}

	/**
	 * Find the voice for a language, falling back to the default voice.
	 * @param explicit the language was set by the user rather than detected, warn if there is no voice for it.
	 */
	private resolveVoice(languageCode?: string, explicit = true): { service: TTSService, voice: string } | null {
		let usedVoice = this.settings.defaultVoice;
		if (languageCode && languageCode.length !== 0) {
			const voice = this.getVoice(languageCode);
			if (voice) {
				usedVoice = voice;
			} else if (explicit) {
				new Notice("TTS: could not find voice for language " + languageCode + ". Using default voice.");
			}
		}
		const found = this.findService(usedVoice);
		if (found) return found;
		new Notice("TTS: Could not use configured language, please check your settings.\nUsing default voice");
		return this.findService(this.settings.defaultVoice);
	}

	/**
	 * @param explicitLanguage false if the language was detected, so a missing voice for it is not reported.
	 */
	async say(text: string, languageCode?: string, explicitLanguage = true): Promise<void> {
		const resolved = this.resolveVoice(languageCode, explicitLanguage);
		if (!resolved) {
			await this.serviceManager.sayWithVoice(text, this.settings.defaultVoice);
			return;
		}
		await resolved.service.sayWithVoice(text, resolved.voice);
	}

	prepareText(title: string, text: string): string {
		return prepareText(this.settings, title, text);
	}

	detectLanguage(text: string): string {
		return detect(text);
	}

	async speak(request: SpeakRequest): Promise<void> {
		let from = request.from;
		//strip frontmatter before anything else touches the --- fences.
		if (request.stripFrontmatter) {
			const frontmatter = getFrontMatterInfo(request.source);
			if (frontmatter.exists && from < frontmatter.contentStart) {
				from = frontmatter.contentStart;
			}
		}
		const text = request.source.substring(from, Math.max(from, request.to));
		const spoken = this.prepareText(request.title, text);
		if (spoken.trim().length === 0) {
			new Notice("TTS: there is no text to read");
			return;
		}
		//a missing voice is only reported for languages the user set, not for detected ones.
		const frontmatterLanguage = request.file ? this.getLanguageFromFrontmatter(request.file) : undefined;
		const language = frontmatterLanguage || this.detectLanguage(text);
		await this.say(spoken, language, !!frontmatterLanguage);
	}

	async play(info: MarkdownFileInfo): Promise<void> {
		const file = info?.file;
		if (!file) return;
		const preview = info instanceof MarkdownView && info.getMode() === "preview";
		//the editor keeps its selection while reading view is shown.
		const editor = preview ? undefined : info.editor;

		if (editor && editor.getSelection().trim().length > 0) {
			await this.speak({
				file,
				source: editor.getValue(),
				from: editor.posToOffset(editor.getCursor("from")),
				to: editor.posToOffset(editor.getCursor("to")),
				title: "",
				stripFrontmatter: false,
			});
			return;
		}

		//text selected in reading view, ignore selections elsewhere, like the search field.
		const selection = activeWindow.getSelection();
		const selectedText = preview && selection && info.containerEl.contains(selection.anchorNode) ? selection.toString() : "";
		if (selectedText.trim().length > 0) {
			await this.speak({file, source: selectedText, from: 0, to: selectedText.length, title: "", stripFrontmatter: false});
			return;
		}

		const source = info.editor ? info.editor.getValue() : await this.app.vault.cachedRead(file);
		await this.speak({
			file,
			source,
			from: 0,
			to: source.length,
			title: file.basename,
			stripFrontmatter: !this.settings.speakFrontmatter,
		});
	}

	async readFile(file: TFile): Promise<void> {
		const source = await this.app.vault.cachedRead(file);
		await this.speak({file, source, from: 0, to: source.length, title: file.basename, stripFrontmatter: !this.settings.speakFrontmatter});
	}

	getLanguageFromFrontmatter(file: TFile): string | undefined {
		return this.app.metadataCache.getFileCache(file)?.frontmatter?.lang;
	}

}
