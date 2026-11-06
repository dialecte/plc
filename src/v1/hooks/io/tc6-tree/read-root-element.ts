import { SAX_PARSER_OPTIONS } from './parse-tc6.constants'
import { ROOT_ELEMENT_FOUND } from './read-root-element.constants'

import * as sax from 'sax'

import type { RootElement } from './tc6-tree.types'

/**
 * The root element of a text: its local name and namespace, read from its start tag, and nothing after it. Whatever the
 * parser refuses before the root is passed over, as a whole parse would report it; a text in which no root can be
 * read has none.
 */
export function readRootElement(xml: string): RootElement | undefined {
	const parser = sax.parser(true, SAX_PARSER_OPTIONS)
	const found: { root: RootElement | undefined } = { root: undefined }

	parser.onopentag = function onOpenTag(tag) {
		// the xmlns option: every tag comes qualified
		const { local, uri } = tag as sax.QualifiedTag
		found.root = { localName: local, namespace: uri }
		throw ROOT_ELEMENT_FOUND
	}

	try {
		parser.write(xml).close()
	} catch (error) {
		if (error !== ROOT_ELEMENT_FOUND) return undefined
	}
	return found.root
}
