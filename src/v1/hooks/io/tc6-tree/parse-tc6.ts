import { normalizeXmlInput } from './normalize-xml-input'
import {
	DOCTYPE_QUOTED_LITERAL,
	PARSE_ERROR_PREFIX,
	SAX_PARSER_OPTIONS,
} from './parse-tc6.constants'

import * as sax from 'sax'

import type { Tc6Element, Tc6TreeBuild } from './tc6-tree.types'

function createParseError(message: string): Error {
	return new Error(`${PARSE_ERROR_PREFIX}${message}`)
}

function openElement(params: { build: Tc6TreeBuild; tag: sax.QualifiedTag }): void {
	const { build, tag } = params
	const attributes = new Map<string, string>()
	for (const attribute of Object.values(tag.attributes)) {
		attributes.set(attribute.name, attribute.value)
	}
	const element: Tc6Element = {
		localName: tag.local,
		attributes,
		parent: build.open,
		children: [],
	}
	build.open?.children.push(element)
	build.root ??= element
	build.open = element
}

function closeElement(build: Tc6TreeBuild): void {
	build.open = build.open?.parent ?? null
}

/** Text outside the root is whitespace the parser let through: no element holds it. */
function appendText(params: { build: Tc6TreeBuild; text: string }): void {
	const { build, text } = params
	build.open?.children.push(text)
}

/**
 * A bare DOCTYPE is ignored. One with an internal subset, even empty, is refused: there is no DTD processor here to
 * expand what it declares.
 */
function refuseInternalSubset(doctype: string): void {
	if (doctype.replace(DOCTYPE_QUOTED_LITERAL, '').includes('[')) {
		throw createParseError('a DOCTYPE with an internal subset is not supported')
	}
}

/**
 * Parses a TC6 file into an element tree, in any host. What the strict sax parser refuses throws, with the parser's
 * message; the first error wins, as the handler stops the parse.
 */
export function parseTc6(xml: string): Tc6Element {
	const build: Tc6TreeBuild = { root: null, open: null }
	const parser = sax.parser(true, SAX_PARSER_OPTIONS)

	parser.onerror = function onError(error) {
		throw createParseError(error.message)
	}
	parser.ondoctype = refuseInternalSubset
	parser.onopentag = function onOpenTag(tag) {
		// the xmlns option: every tag comes qualified
		openElement({ build, tag: tag as sax.QualifiedTag })
	}
	parser.onclosetag = function onCloseTag() {
		closeElement(build)
	}
	parser.ontext = function onText(text) {
		appendText({ build, text })
	}
	parser.oncdata = function onCdata(text) {
		appendText({ build, text })
	}

	parser.write(normalizeXmlInput(xml)).close()

	if (!build.root) throw createParseError('no root element')
	return build.root
}
