import {MarkdownPostProcessorContext, MarkdownView} from "obsidian";
import {EditorView} from "@codemirror/view";
import {alignWords, EditorTarget, HighlightTarget, WordMapping} from "./highlight";

/**
 * CSS Custom Highlight API, not yet part of the TypeScript DOM types this project uses.
 */
interface HighlightWindow {
	Highlight: new (...ranges: Range[]) => unknown;
	CSS: { highlights?: Map<string, unknown> };
}

const HIGHLIGHT_NAME = "tts-spoken-word";

/**
 * Text of a rendered section, aligned with the markdown it was rendered from.
 */
interface RenderedSection {
	/** text the alignment was made for, the section can be rendered again later */
	text: string;
	nodes: { node: Text, start: number }[];
	/** from and to are offsets in text, sourceFrom and sourceTo offsets in the note */
	mappings: WordMapping[];
}

/**
 * Highlights the spoken word in a markdown view, in reading view as well as in the editor.
 * The mode is checked for every word, so switching modes during playback keeps the highlight.
 */
export class MarkdownViewTarget implements HighlightTarget {
	private readonly editor: EditorTarget | null;
	private readonly path: string | undefined;
	private readonly sections = new WeakMap<HTMLElement, RenderedSection>();
	private shownIn: "source" | "preview" | null = null;

	/**
	 * @param sectionContexts post processor contexts of rendered sections, to find the lines they were rendered from.
	 */
	constructor(private readonly view: MarkdownView, private readonly sectionContexts: WeakMap<HTMLElement, MarkdownPostProcessorContext>) {
		const cm = (view.editor as unknown as { cm?: EditorView }).cm;
		this.editor = cm instanceof EditorView ? new EditorTarget(cm) : null;
		this.path = view.file?.path;
	}

	show(from: number, to: number): boolean {
		if (this.view.getMode() === "preview") {
			if (this.shownIn === "source") this.editor?.clear();
			this.shownIn = "preview";
			return this.showInReadingView(from, to);
		}
		if (this.shownIn === "preview") this.clearReadingView();
		this.shownIn = "source";
		return this.editor?.show(from, to) ?? false;
	}

	clear(): void {
		this.editor?.clear();
		this.clearReadingView();
		this.shownIn = null;
	}

	isValid(): boolean {
		//another note may have been opened in the same tab.
		return this.view.file?.path === this.path && (this.editor?.isValid() ?? true);
	}

	private showInReadingView(from: number, to: number): boolean {
		const editor = this.view.editor;
		const line = editor.offsetToPos(from).line;
		const element = this.findSection(line);
		if (!element) {
			//sections far from the visible part are not rendered, scroll there so it is.
			this.view.previewMode.applyScroll(line);
			return false;
		}
		const section = this.getRenderedSection(element);
		//a spoken word can be several rendered words, "well-known" is spoken as one word.
		const words = section?.mappings.filter(mapping => mapping.sourceFrom < to && mapping.sourceTo > from) ?? [];
		if (!section || words.length === 0) {
			//rendered differently, like a table of embedded content, keep the previous word.
			return true;
		}
		const range = this.createRange(section, words[0].from, words[words.length - 1].to);
		if (!range) return true;
		const win = element.win as unknown as HighlightWindow;
		if (!win.CSS.highlights || typeof win.Highlight !== "function") return true;
		win.CSS.highlights.set(HIGHLIGHT_NAME, new win.Highlight(range));
		this.scrollIntoView(range);
		return true;
	}

	private clearReadingView(): void {
		const win = this.view.containerEl.win as unknown as HighlightWindow;
		win.CSS.highlights?.delete(HIGHLIGHT_NAME);
	}

	/**
	 * @returns the rendered section that contains line, null if it is not rendered.
	 */
	private findSection(line: number): HTMLElement | null {
		const elements = this.view.previewMode.containerEl.querySelectorAll<HTMLElement>(".markdown-preview-section > div");
		for (const element of Array.from(elements)) {
			const context = this.sectionContexts.get(element);
			//sections of embedded notes have their own line numbers.
			if (!context || context.sourcePath !== this.path) continue;
			const info = context.getSectionInfo(element);
			if (info && info.lineStart <= line && line <= info.lineEnd) {
				return element.hasChildNodes() ? element : null;
			}
		}
		return null;
	}

	private getRenderedSection(element: HTMLElement): RenderedSection | null {
		const nodes: { node: Text, start: number }[] = [];
		let text = "";
		const walker = element.doc.createTreeWalker(element, NodeFilter.SHOW_TEXT);
		while (walker.nextNode()) {
			const node = walker.currentNode as Text;
			nodes.push({node, start: text.length});
			text += node.data;
		}
		const cached = this.sections.get(element);
		if (cached && cached.text === text) return cached;

		const info = this.sectionContexts.get(element)?.getSectionInfo(element);
		if (!info) return null;
		const editor = this.view.editor;
		const start = editor.posToOffset({line: info.lineStart, ch: 0});
		const end = editor.posToOffset({line: info.lineEnd, ch: editor.getLine(info.lineEnd).length});
		const source = editor.getValue().substring(start, end);
		const mappings = alignWords(text, source).map(mapping => ({
			...mapping,
			sourceFrom: mapping.sourceFrom + start,
			sourceTo: mapping.sourceTo + start,
		}));
		const section = {text, nodes, mappings};
		this.sections.set(element, section);
		return section;
	}

	private createRange(section: RenderedSection, from: number, to: number): Range | null {
		const start = this.locate(section, from, false);
		const end = this.locate(section, to, true);
		if (!start || !end) return null;
		const range = start.node.doc.createRange();
		range.setStart(start.node, start.offset);
		range.setEnd(end.node, end.offset);
		return range;
	}

	/**
	 * @param end true for the end of a range, which belongs to the node before at a node boundary.
	 */
	private locate(section: RenderedSection, position: number, end: boolean): { node: Text, offset: number } | null {
		for (const {node, start} of section.nodes) {
			const offset = position - start;
			if (offset >= 0 && (end ? offset <= node.data.length : offset < node.data.length)) {
				return {node, offset};
			}
		}
		return null;
	}

	private scrollIntoView(range: Range): void {
		const scroller = this.view.previewMode.containerEl;
		const word = range.getBoundingClientRect();
		const visible = scroller.getBoundingClientRect();
		if (word.top >= visible.top && word.bottom <= visible.bottom) return;
		scroller.scrollTop += word.top - visible.top - visible.height / 3;
	}
}
