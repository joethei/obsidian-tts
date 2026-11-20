import {StateEffect, StateField} from "@codemirror/state";
import {Decoration, DecorationSet, EditorView} from "@codemirror/view";

/**
 * Links a word in the spoken text to the same word in the note.
 */
export interface WordMapping {
	from: number;
	to: number;
	sourceFrom: number;
	sourceTo: number;
}

interface Token {
	text: string;
	from: number;
	to: number;
}

function tokenize(text: string): Token[] {
	const tokens: Token[] = [];
	const regex = new RegExp("[\\p{L}\\p{N}]+", "gu");
	let match: RegExpExecArray | null;
	while ((match = regex.exec(text)) !== null) {
		tokens.push({text: match[0].toLowerCase(), from: match.index, to: match.index + match[0].length});
	}
	return tokens;
}

/**
 * Find the source tokens that make up a spoken word.
 * Removing syntax can glue words together ("well-known" is spoken as "wellknown"), so up to four tokens are joined.
 */
function findMatch(word: string, source: Token[], start: number): { start: number, end: number } | null {
	//short words are common, only look a few words ahead so they do not pull the alignment away.
	const limit = Math.min(source.length, start + (word.length <= 3 ? 5 : 30));
	for (let k = start; k < limit; k++) {
		let joined = "";
		for (let m = k; m < Math.min(source.length, k + 4); m++) {
			joined += source[m].text;
			if (joined === word) return {start: k, end: m};
			if (!word.startsWith(joined)) break;
		}
	}
	return null;
}

/**
 * Align the words of the text handed to the speech engine with the note it came from.
 * The spoken text has markdown syntax, links, comments and so on removed, but keeps the order of the words.
 * Words that cannot be found are left out.
 */
export function alignWords(spoken: string, source: string): WordMapping[] {
	const spokenTokens = tokenize(spoken);
	const sourceTokens = tokenize(source);
	const result: WordMapping[] = [];
	let position = 0;
	for (const token of spokenTokens) {
		const match = findMatch(token.text, sourceTokens, position);
		if (!match) continue;
		result.push({
			from: token.from,
			to: token.to,
			sourceFrom: sourceTokens[match.start].from,
			sourceTo: sourceTokens[match.end].to,
		});
		position = match.end + 1;
	}
	return result;
}

const setSpokenWord = StateEffect.define<{ from: number, to: number } | null>();
const spokenWordMark = Decoration.mark({class: "tts-spoken-word"});

/**
 * Where the spoken word is shown, offsets are positions in the note.
 */
export interface HighlightTarget {
	/**
	 * @returns false if the word could not be shown yet, it is tried again shortly.
	 */
	show(from: number, to: number): boolean;

	clear(): void;

	/**
	 * @returns false once the offsets no longer match the note, for example after it was edited.
	 */
	isValid(): boolean;
}

/**
 * Highlights a word in source mode and live preview.
 */
export class EditorTarget implements HighlightTarget {
	private readonly docLength: number;

	constructor(private readonly view: EditorView) {
		this.docLength = view.state.doc.length;
	}

	show(from: number, to: number): boolean {
		this.dispatch([setSpokenWord.of({from, to}), EditorView.scrollIntoView(from, {y: "nearest"})]);
		return true;
	}

	clear(): void {
		this.dispatch([setSpokenWord.of(null)]);
	}

	isValid(): boolean {
		return this.view.state.doc.length === this.docLength;
	}

	private dispatch(effects: StateEffect<unknown>[]): void {
		try {
			this.view.dispatch({effects});
		} catch (e) {
			//the editor was closed in the meantime.
		}
	}
}

export const spokenWordField = StateField.define<DecorationSet>({
	create: () => Decoration.none,
	update(value, transaction) {
		value = value.map(transaction.changes);
		for (const effect of transaction.effects) {
			if (effect.is(setSpokenWord)) {
				value = effect.value ? Decoration.set([spokenWordMark.range(effect.value.from, effect.value.to)]) : Decoration.none;
			}
		}
		return value;
	},
	provide: field => EditorView.decorations.from(field),
});

/**
 * Speaking time of a text in characters, pauses after punctuation count as extra characters.
 * @returns for each position in the text the time needed to reach it
 */
function speakingTime(text: string): Float64Array {
	const time = new Float64Array(text.length + 1);
	for (let i = 0; i < text.length; i++) {
		const char = text.charAt(i);
		let weight = 1;
		if (/[.!?]/.test(char)) weight += 8;
		else if (/[,;:\n]/.test(char)) weight += 4;
		time[i + 1] = time[i] + weight;
	}
	return time;
}

/**
 * Highlights the word that is currently spoken in an editor.
 *
 * Speech engines do not report every word, some voices only report a few words per sentence.
 * Between two reports the highlight moves on with the measured speaking speed,
 * each report puts it back to the word that is actually spoken.
 */
export class SpokenWordHighlighter {
	private static active: SpokenWordHighlighter | null = null;
	private readonly time: Float64Array;
	/** speaking time units per millisecond, measured once enough words were reported */
	private speed: number;
	/** first and last reported word, in speaking time units and playing time */
	private first: { time: number, at: number } | null = null;
	private last: { time: number, at: number } | null = null;
	private highlighted: WordMapping | null = null;
	/** reported words and the index of the first one in mappings, to find out whether the voice skips words */
	private reported = 0;
	private firstIndex = 0;
	private timer: number | null = null;
	private pausedAt: number | null = null;
	private pausedFor = 0;

	/**
	 * @param target shows the word in the note the text was taken from
	 * @param mappings created with {@link alignWords}
	 * @param base offset of the aligned source text in the note
	 * @param spoken text passed to the speech engine
	 * @param rate speech rate, used until the speed has been measured
	 */
	constructor(private readonly target: HighlightTarget, private readonly mappings: WordMapping[], private readonly base: number,
				spoken: string, private readonly rate: number) {
		this.time = speakingTime(spoken);
		//about 18 characters per second at normal rate, measured with Samantha and Rocko on macOS.
		this.speed = 0.018 * rate;
	}

	onBoundary(charIndex: number): void {
		if (!this.target.isValid()) {
			this.clear();
			return;
		}
		const now = this.now();
		const time = this.time[Math.min(charIndex, this.time.length - 1)];
		if (!this.first || time < this.first.time) {
			this.first = {time, at: now};
			this.reported = 0;
			this.firstIndex = this.findSpoken(time);
		} else if (now - this.first.at > 3000 && time > this.first.time) {
			//reports at the start can come in a burst, so only measure over a longer time.
			this.speed = (time - this.first.time) / (now - this.first.at);
		}
		this.last = {time, at: now};
		this.reported++;
		this.timer ??= window.setInterval(() => this.update(), 50);
		this.update();
	}

	onPause(): void {
		this.pausedAt ??= performance.now();
	}

	onResume(): void {
		if (this.pausedAt === null) return;
		this.pausedFor += performance.now() - this.pausedAt;
		this.pausedAt = null;
	}

	clear(): void {
		if (this.timer !== null) {
			window.clearInterval(this.timer);
			this.timer = null;
		}
		this.first = null;
		this.last = null;
		this.reported = 0;
		this.highlighted = null;
		this.pausedAt = null;
		if (SpokenWordHighlighter.active === this) {
			SpokenWordHighlighter.active = null;
		}
		this.target.clear();
	}

	/**
	 * @returns milliseconds spent playing, pauses are left out.
	 */
	private now(): number {
		return (this.pausedAt ?? performance.now()) - this.pausedFor;
	}

	private update(): void {
		if (!this.last) return;
		if (!this.target.isValid()) {
			this.clear();
			return;
		}
		//voices that report every word are followed exactly, the estimate only fills in words a voice does not report.
		//some voices stop reporting for a while, longer than a pause between paragraphs.
		const elapsed = this.now() - this.last.at;
		const estimate = this.skipsWords() || elapsed > 1500 / this.rate;
		const estimated = estimate ? this.last.time + elapsed * this.speed : this.last.time;
		const mapping = this.mappings[this.findSpoken(estimated)];
		if (!mapping || mapping === this.highlighted) return;
		if (SpokenWordHighlighter.active && SpokenWordHighlighter.active !== this) {
			SpokenWordHighlighter.active.clear();
		}
		SpokenWordHighlighter.active = this;
		if (this.target.show(this.base + mapping.sourceFrom, this.base + mapping.sourceTo)) {
			this.highlighted = mapping;
		}
	}

	private skipsWords(): boolean {
		if (!this.last || this.reported < 2) return false;
		const passed = this.findSpoken(this.last.time) - this.firstIndex + 1;
		return this.reported < passed * 0.7;
	}

	/**
	 * @returns index of the last word that starts before the given speaking time, -1 if there is none.
	 */
	private findSpoken(time: number): number {
		let low = 0;
		let high = this.mappings.length - 1;
		let result = -1;
		while (low <= high) {
			const middle = (low + high) >> 1;
			if (this.time[this.mappings[middle].from] <= time) {
				result = middle;
				low = middle + 1;
			} else {
				high = middle - 1;
			}
		}
		return result;
	}
}
