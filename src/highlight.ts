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

/**
 * @returns the mapping for the word at charIndex in the spoken text, if that word could be aligned.
 */
export function findMapping(mappings: WordMapping[], charIndex: number): WordMapping | undefined {
	let low = 0;
	let high = mappings.length - 1;
	while (low <= high) {
		const middle = (low + high) >> 1;
		const mapping = mappings[middle];
		if (charIndex < mapping.from) {
			high = middle - 1;
		} else if (charIndex >= mapping.to) {
			low = middle + 1;
		} else {
			return mapping;
		}
	}
	return undefined;
}

const setSpokenWord = StateEffect.define<{ from: number, to: number } | null>();
const spokenWordMark = Decoration.mark({class: "tts-spoken-word"});

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
 * Highlights the word that is currently spoken in an editor.
 */
export class SpokenWordHighlighter {
	private static active: SpokenWordHighlighter | null = null;
	private readonly docLength: number;

	/**
	 * @param view editor the text was taken from
	 * @param mappings created with {@link alignWords}
	 * @param base offset of the aligned source text in the document
	 */
	constructor(private readonly view: EditorView, private readonly mappings: WordMapping[], private readonly base: number) {
		this.docLength = view.state.doc.length;
	}

	onBoundary(charIndex: number): void {
		const mapping = findMapping(this.mappings, charIndex);
		if (!mapping) return;
		//offsets are no longer valid after the note was edited.
		if (this.view.state.doc.length !== this.docLength) {
			this.clear();
			return;
		}
		if (SpokenWordHighlighter.active && SpokenWordHighlighter.active !== this) {
			SpokenWordHighlighter.active.clear();
		}
		SpokenWordHighlighter.active = this;
		const from = this.base + mapping.sourceFrom;
		const to = this.base + mapping.sourceTo;
		this.dispatch([setSpokenWord.of({from, to}), EditorView.scrollIntoView(from, {y: "nearest"})]);
	}

	clear(): void {
		if (SpokenWordHighlighter.active === this) {
			SpokenWordHighlighter.active = null;
		}
		this.dispatch([setSpokenWord.of(null)]);
	}

	private dispatch(effects: StateEffect<unknown>[]): void {
		try {
			this.view.dispatch({effects});
		} catch (e) {
			//the editor was closed in the meantime.
		}
	}
}
