import {
	ATTRIBUTE_LITERAL_WHITESPACE,
	EMPTY_PROCESSING_INSTRUCTION,
	OPAQUE_MARKUP,
	PROCESSING_INSTRUCTION,
	RAW_LINE_END,
} from './normalize-xml-input.constants'

import type { InputRange } from './normalize-xml-input.types'

/**
 * Every quoted value of every tag and every processing instruction, in one pass over the text. Comments and CDATA are
 * stepped over; a construct left open ends the walk, the parser reports it.
 */
function* walkInputRanges(xml: string): Generator<InputRange> {
	let position = xml.indexOf('<')
	while (position !== -1) {
		const markupStart = position
		if (xml.startsWith(PROCESSING_INSTRUCTION.open, markupStart)) {
			const closing = xml.indexOf(
				PROCESSING_INSTRUCTION.close,
				markupStart + PROCESSING_INSTRUCTION.open.length,
			)
			if (closing === -1) return
			const end = closing + PROCESSING_INSTRUCTION.close.length
			yield { kind: 'processing-instruction', start: markupStart, end }
			position = xml.indexOf('<', end)
			continue
		}
		const opaque = OPAQUE_MARKUP.find(function opensHere(markup) {
			return xml.startsWith(markup.open, markupStart)
		})
		if (opaque) {
			const closing = xml.indexOf(opaque.close, markupStart + opaque.open.length)
			if (closing === -1) return
			position = xml.indexOf('<', closing + opaque.close.length)
			continue
		}

		let cursor = markupStart + 1
		while (cursor < xml.length && xml[cursor] !== '>') {
			const character = xml[cursor]
			if (character !== '"' && character !== "'") {
				cursor += 1
				continue
			}
			const closingQuote = xml.indexOf(character, cursor + 1)
			if (closingQuote === -1) return
			yield { kind: 'attribute-value', start: cursor + 1, end: closingQuote }
			cursor = closingQuote + 1
		}
		position = xml.indexOf('<', cursor)
	}
}

/**
 * A literal tab or line end in an attribute value reads as a space, as an XML parser does; one written as a character
 * reference stays, and the parser decodes references before handing a value over, hence this step before it. A
 * processing instruction becomes an empty one: nothing reads it, and the parser misses the end of one closing with
 * `??>`. It stays there, so the text on its two sides does not join into what was not written (`&am<?p?>p;`).
 */
function rewriteInputRanges(xml: string): string {
	const pieces: string[] = []
	let copiedUpTo = 0
	for (const { kind, start, end } of walkInputRanges(xml)) {
		const text = xml.slice(start, end)
		const rewritten =
			kind === 'processing-instruction'
				? EMPTY_PROCESSING_INSTRUCTION
				: text.replace(ATTRIBUTE_LITERAL_WHITESPACE, ' ')
		if (rewritten === text) continue
		pieces.push(xml.slice(copiedUpTo, start), rewritten)
		copiedUpTo = end
	}
	if (copiedUpTo === 0) return xml
	pieces.push(xml.slice(copiedUpTo))
	return pieces.join('')
}

/**
 * What an XML parser does to its input and the sax parser does not: a raw CR LF or CR reads as one line feed (a CR
 * written `&#13;` stays), then the attribute values and processing instructions are rewritten.
 */
export function normalizeXmlInput(xml: string): string {
	return rewriteInputRanges(xml.replace(RAW_LINE_END, '\n'))
}
