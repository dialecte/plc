import { createIecElement, XSI_TYPE_ATTRIBUTE } from '../iec-tree'
import { findFirstChild, findFirstDescendant, getChildElements } from '../tc6-tree'
import { LD_XSI_TYPES } from './converters.constants'
import {
	appendPosition,
	buildConnectionPointIn,
	buildConnectionPointOut,
	extractPlainText,
	getOutputIdKey,
} from './shared'

import type { IecElement } from '../iec-tree'
import type { Tc6Element } from '../tc6-tree'

/** An id for every child with a direct `connectionPointOut`, whether that child is mapped or not. */
function allocateLdOutputIds(ld: Tc6Element): Map<string, string> {
	const outputIds = new Map<string, string>()
	let allocated = 0
	for (const element of getChildElements(ld)) {
		if (!findFirstChild({ parent: element, localName: 'connectionPointOut' })) continue
		allocated += 1
		const localId = element.attributes.get('localId') ?? ''
		outputIds.set(getOutputIdKey({ localId }), String(allocated))
	}
	return outputIds
}

function convertLdElement(params: {
	element: Tc6Element
	outputIds: ReadonlyMap<string, string>
}): IecElement | null {
	const { element, outputIds } = params
	const xsiType = LD_XSI_TYPES.get(element.localName)
	if (!xsiType) return null

	const ldObject = createIecElement({
		tagName: 'LdObject',
		attributes: { [XSI_TYPE_ATTRIBUTE]: xsiType },
	})
	if (element.attributes.get('negated') === 'true') ldObject.attributes.set('negated', 'true')
	const operand = findFirstDescendant({ root: element, localName: 'variable' })
	if (operand) ldObject.attributes.set('operand', extractPlainText(operand))

	appendPosition({ parent: ldObject, element })

	const connectionPointIn = findFirstChild({ parent: element, localName: 'connectionPointIn' })
	if (connectionPointIn) {
		ldObject.children.push(buildConnectionPointIn({ connectionPointIn, outputIds }))
	}
	if (findFirstChild({ parent: element, localName: 'connectionPointOut' })) {
		ldObject.children.push(buildConnectionPointOut({ element, outputIds }))
	}
	return ldObject
}

/** An LD body: `MainBody > BodyContent xsi:type="LD" > Rung`, one `LdObject` per mapped child. */
export function convertLdBody(ld: Tc6Element): IecElement {
	const outputIds = allocateLdOutputIds(ld)
	const rung = createIecElement({ tagName: 'Rung', attributes: { evaluationOrder: '0' } })
	for (const element of getChildElements(ld)) {
		const converted = convertLdElement({ element, outputIds })
		if (converted) rung.children.push(converted)
	}
	return createIecElement({
		tagName: 'MainBody',
		children: [
			createIecElement({
				tagName: 'BodyContent',
				attributes: { [XSI_TYPE_ATTRIBUTE]: 'LD' },
				children: [rung],
			}),
		],
	})
}
