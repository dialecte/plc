import {
	ATTRIBUTE_ESCAPED_CHARACTER,
	ESCAPES,
	TEXT_ESCAPED_CHARACTER,
	XSI_DECLARATION,
	XSI_TYPE_ATTRIBUTE,
} from './serialize-iec-tree.constants'

import type { IecElement, IecSerialization } from './iec-tree.types'

function escapeCharacter(character: string): string {
	return ESCAPES[character]
}

function appendElement(params: IecSerialization): void {
	const { element, pieces } = params
	let { xsiDeclared } = params

	pieces.push('<', element.tagName)
	for (const [name, value] of element.attributes) {
		if (name === XSI_TYPE_ATTRIBUTE && !xsiDeclared) {
			pieces.push(' ', XSI_DECLARATION)
			xsiDeclared = true
		}
		pieces.push(' ', name, '="', value.replace(ATTRIBUTE_ESCAPED_CHARACTER, escapeCharacter), '"')
	}

	if (element.children.length === 0 && element.text === '') {
		pieces.push('/>')
		return
	}

	pieces.push('>', element.text.replace(TEXT_ESCAPED_CHARACTER, escapeCharacter))
	for (const child of element.children) {
		appendElement({ element: child, xsiDeclared, pieces })
	}
	pieces.push('</', element.tagName, '>')
}

/**
 * The XML text of an output tree, without declaration or indentation: every element empty of text and children
 * self-closes, attributes stay in their order, the xsi prefix is declared on the first element of a path that uses it.
 * The tree is as deep as the output format, whatever the input, so recursion is safe here.
 */
export function serializeIecTree(root: IecElement): string {
	const pieces: string[] = []
	appendElement({ element: root, xsiDeclared: false, pieces })
	return pieces.join('')
}
