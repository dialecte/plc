import { PLC_NAMESPACES } from '@/v1/config/namespaces'

/** The qualified name of the attribute that needs the xsi prefix declared. */
export const XSI_TYPE_ATTRIBUTE = `${PLC_NAMESPACES.xsi.prefix}:type`

/** The declaration of the xsi prefix, written once on a path through the tree, right before its first use. */
export const XSI_DECLARATION = `xmlns:${PLC_NAMESPACES.xsi.prefix}="${PLC_NAMESPACES.xsi.uri}"`

/** What is escaped in text. A quote and a carriage return stay literal there. */
export const TEXT_ESCAPED_CHARACTER = /[&<>]/g

/** What is escaped in an attribute value. An apostrophe stays literal: values are double-quoted. */
export const ATTRIBUTE_ESCAPED_CHARACTER = /[&<>"\t\n\r]/g

/** How each escaped character is written. */
export const ESCAPES: Readonly<Record<string, string>> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	'\t': '&#9;',
	'\n': '&#10;',
	'\r': '&#13;',
}
