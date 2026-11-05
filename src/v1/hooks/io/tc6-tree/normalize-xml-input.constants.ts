/** A raw line end: CR LF, or a CR on its own. */
export const RAW_LINE_END = /\r\n?/g

/** The whitespace a literal attribute value reads as a space, once its line ends are normalised. */
export const ATTRIBUTE_LITERAL_WHITESPACE = /[\t\n]/g

/** The markup that holds no attribute, and whose content is left as written. */
export const OPAQUE_MARKUP = [
	{ open: '<!--', close: '-->' },
	{ open: '<![CDATA[', close: ']]>' },
] as const

/** Where a processing instruction opens and closes. */
export const PROCESSING_INSTRUCTION = { open: '<?', close: '?>' } as const

/** What a processing instruction is replaced by. */
export const EMPTY_PROCESSING_INSTRUCTION = '<?_?>'
