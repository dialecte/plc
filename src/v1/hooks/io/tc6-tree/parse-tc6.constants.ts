import type { SAXOptions } from 'sax'

/** The same options as core's XML reader: its strict parser defines what is well-formed for every dialecte. */
export const SAX_PARSER_OPTIONS: SAXOptions = {
	lowercase: false,
	trim: false,
	normalize: false,
	position: false,
	xmlns: true,
}

/** What starts the message of every refused file. */
export const PARSE_ERROR_PREFIX = 'TC6 v201 parse error: '

/** A quoted literal of a DOCTYPE: a bracket inside one opens nothing. */
export const DOCTYPE_QUOTED_LITERAL = /"[^"]*"|'[^']*'/g
