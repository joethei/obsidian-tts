import {
	addIcon, Editor, EventRef, getFrontMatterInfo, getLinkpath, MarkdownFileInfo,
	MarkdownPostProcessorContext, MarkdownView, Menu, Notice, Platform,
	Plugin, setIcon, TAbstractFile, TFile
} from 'obsidian';
import {EditorView} from "@codemirror/view";
import {DEFAULT_SETTINGS, LanguageVoiceMap, TTSSettings, TTSSettingsTab} from "./settings";
import {registerAPI} from "@vanakat/plugin-api";
import {detect} from "tinyld";
import {ServiceManager} from "./ServiceManager";
import {prepareText} from "./textPreparation";
import {SpeakOptions, TTSService} from "./services/TTSService";
import {alignWords, EditorTarget, HighlightTarget, spokenWordField, SpokenWordHighlighter} from "./highlight";
import {MarkdownViewTarget} from "./readingViewHighlight";

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
	/** the view showing source, to highlight the spoken word */
	view?: MarkdownFileInfo;
}

/**
 * Not part of the public API, triggered by the core search plugin.
 */
interface SearchResultsMenuWorkspace {
	on(name: 'search:results-menu', callback: (menu: Menu, view: { dom?: { getFiles?(): TAbstractFile[] } }) => void): EventRef;
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
	//rendered sections of reading view, to find the line the user clicked on.
	private sectionContexts = new WeakMap<HTMLElement, MarkdownPostProcessorContext>();

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
			id: 'read-from-cursor',
			name: 'Read from cursor',
			icon: 'text-cursor-input',
			editorCheckCallback: (checking, editor, info) => {
				if (!checking)
					this.readFromCursor(editor, info);
				return !!info.file;
			}
		});

		this.addCommand({
			id: 'add-note-to-tts-queue',
			name: 'Add note to playback queue',
			icon: 'list-plus',
			checkCallback: (checking: boolean) => {
				const info = this.app.workspace.activeEditor;
				if (!checking)
					this.play(info);
				return !!info?.file;
			}
		});

		this.addCommand({
			id: 'add-linked-notes-to-tts-queue',
			name: 'Add linked notes to playback queue',
			icon: 'links-going-out',
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!checking)
					this.readLinkedNotes(file);
				return !!file;
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

		//keep the playback controls in sync, speech engines do not report every state change.
		this.registerInterval(window.setInterval(() => this.updateStatusbar(), 500));

		this.registerEditorExtension(spokenWordField);

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
			//macOS selects the word under the pointer on right click, so offer this with a selection as well.
			menu.addItem((item) => {
				item
					.setTitle("Read from here")
					.setIcon("text-cursor-input")
					.onClick(() => {
						this.readFromCursor(editor, info);
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
		this.registerEvent(this.app.workspace.on('files-menu', ((menu, files) => {
			const notes = files.filter(isMarkdownFile);
			if (notes.length === 0) return;
			menu.addItem((item) => {
				item
					.setTitle("Read the notes")
					.setIcon("audio-file")
					.onClick(async () => {
						await this.readFiles(notes);
					});
			});
		})));
		const workspace = this.app.workspace as unknown as SearchResultsMenuWorkspace;
		this.registerEvent(workspace.on('search:results-menu', (menu, view) => {
			const getFiles = view?.dom?.getFiles;
			if (typeof getFiles !== "function") return;
			menu.addItem((item) => {
				item
					.setSection("action")
					.setTitle("Read search results")
					.setIcon("audio-file")
					.onClick(async () => {
						const notes = getFiles.call(view.dom).filter(isMarkdownFile);
						if (notes.length === 0) {
							new Notice("TTS: the search has no notes to read");
							return;
						}
						await this.readFiles(notes);
					});
			});
		}));

		this.registerMarkdownPostProcessor((element, context) => {
			this.sectionContexts.set(element, context);
		});
		this.registerDomEvent(document, 'contextmenu', this.onReadingViewContextMenu);
		this.registerEvent(this.app.workspace.on('window-open', (_, win) => {
			this.registerDomEvent(win.document, 'contextmenu', this.onReadingViewContextMenu);
		}));

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

	/**
	 * Reading view has no context menu for text, so offer one for reading the note from there.
	 */
	private onReadingViewContextMenu = (event: MouseEvent): void => {
		if (event.defaultPrevented || !this.settings.readingViewMenu) return;
		const target = event.target as HTMLElement;
		if (typeof target?.closest !== "function") return;
		const container = target.closest(".markdown-reading-view");
		if (!container) return;
		const view = this.findMarkdownView(container);
		const file = view?.file;
		if (!file) return;

		const selection = container.win.getSelection();
		const selected = selection && !selection.isCollapsed && container.contains(selection.anchorNode) ? selection.toString() : "";

		const menu = new Menu();
		if (selected.length > 0) {
			menu.addItem((item) => {
				item
					.setTitle("Copy")
					.setIcon("lucide-copy")
					.onClick(() => navigator.clipboard.writeText(selected));
			});
			menu.addItem((item) => {
				item
					.setTitle("Read selected text")
					.setIcon("audio-file")
					.onClick(() => this.speak({file, source: selected, from: 0, to: selected.length, title: "", stripFrontmatter: false}));
			});
		} else {
			const line = this.getSectionLine(target, file);
			if (line !== null) {
				menu.addItem((item) => {
					item
						.setTitle("Read from here")
						.setIcon("text-cursor-input")
						.onClick(() => {
							const source = view.editor.getValue();
							const from = view.editor.posToOffset({line, ch: 0});
							this.speak({file, source, from, to: source.length, title: "", stripFrontmatter: !this.settings.speakFrontmatter, view});
						});
				});
			}
			menu.addItem((item) => {
				item
					.setTitle("Read the note")
					.setIcon("audio-file")
					.onClick(() => this.play(view));
			});
		}
		menu.showAtMouseEvent(event);
		event.preventDefault();
	};

	private findMarkdownView(element: Element): MarkdownView | null {
		let result: MarkdownView | null = null;
		this.app.workspace.iterateAllLeaves(leaf => {
			if (!result && leaf.view instanceof MarkdownView && leaf.view.containerEl.contains(element)) {
				result = leaf.view;
			}
		});
		return result;
	}

	/**
	 * @returns the first line of the rendered section that contains element, null if it cannot be found.
	 */
	private getSectionLine(element: HTMLElement, file: TFile): number | null {
		let current: HTMLElement | null = element;
		while (current && !current.hasClass("markdown-reading-view")) {
			const context = this.sectionContexts.get(current);
			//sections of embedded notes have their own line numbers.
			if (context && context.sourcePath === file.path) {
				const info = context.getSectionInfo(current);
				if (info) return info.lineStart;
			}
			current = current.parentElement;
		}
		return null;
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
	async say(text: string, languageCode?: string, explicitLanguage = true, options?: SpeakOptions): Promise<void> {
		const resolved = this.resolveVoice(languageCode, explicitLanguage);
		if (!resolved) {
			await this.serviceManager.sayWithVoice(text, this.settings.defaultVoice, options);
			return;
		}
		await resolved.service.sayWithVoice(text, resolved.voice, options);
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
		await this.say(spoken, language, !!frontmatterLanguage, this.createHighlighter(request, text, from, spoken));
	}

	private createHighlighter(request: SpeakRequest, text: string, from: number, spoken: string): SpeakOptions | undefined {
		if (!this.settings.highlightSpokenWord || !request.view) return undefined;
		const target = this.createHighlightTarget(request.view);
		if (!target) return undefined;
		//the title is only added in front, so align the rest and shift it by the length of the title.
		const body = prepareText({...this.settings, speakTitle: false}, "", text);
		const offset = spoken.length - body.length;
		const mappings = alignWords(body, text).map(mapping => ({...mapping, from: mapping.from + offset, to: mapping.to + offset}));
		const highlighter = new SpokenWordHighlighter(target, mappings, from, spoken, this.settings.rate);
		return {
			onBoundary: (charIndex) => highlighter.onBoundary(charIndex),
			onEnd: () => highlighter.clear(),
			onPause: () => highlighter.onPause(),
			onResume: () => highlighter.onResume(),
		};
	}

	private createHighlightTarget(view: MarkdownFileInfo): HighlightTarget | null {
		if (view instanceof MarkdownView) {
			return new MarkdownViewTarget(view, this.sectionContexts);
		}
		const cm = (view.editor as unknown as { cm?: EditorView } | undefined)?.cm;
		return cm instanceof EditorView ? new EditorTarget(cm) : null;
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
				view: info,
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
			view: info,
		});
	}

	async readFromCursor(editor: Editor, info: MarkdownFileInfo): Promise<void> {
		const source = editor.getValue();
		let from = editor.posToOffset(editor.getCursor("from"));
		//start at the beginning of the word the cursor is in.
		while (from > 0 && /\S/.test(source.charAt(from - 1))) {
			from--;
		}
		await this.speak({
			file: info.file,
			source,
			from,
			to: source.length,
			title: "",
			stripFrontmatter: !this.settings.speakFrontmatter,
			view: info,
		});
	}

	async readFile(file: TFile): Promise<void> {
		const source = await this.app.vault.cachedRead(file);
		await this.speak({file, source, from: 0, to: source.length, title: file.basename, stripFrontmatter: !this.settings.speakFrontmatter});
	}

	/**
	 * Read notes one after another, they are added to the playback queue.
	 */
	async readFiles(files: TFile[]): Promise<void> {
		new Notice(`TTS: reading ${files.length} ${files.length === 1 ? "note" : "notes"}`);
		for (const file of files) {
			await this.readFile(file);
		}
	}

	async readLinkedNotes(file: TFile | null): Promise<void> {
		if (!file) return;
		const links = this.app.metadataCache.getFileCache(file)?.links ?? [];
		const notes: TFile[] = [];
		for (const link of links) {
			const target = this.app.metadataCache.getFirstLinkpathDest(getLinkpath(link.link), file.path);
			if (target && isMarkdownFile(target) && target !== file && !notes.includes(target)) {
				notes.push(target);
			}
		}
		if (notes.length === 0) {
			new Notice("TTS: this note does not link to other notes");
			return;
		}
		await this.readFiles(notes);
	}

	getLanguageFromFrontmatter(file: TFile): string | undefined {
		return this.app.metadataCache.getFileCache(file)?.frontmatter?.lang;
	}

}
