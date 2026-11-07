import { createIecElement, XSI_TYPE_ATTRIBUTE } from '../iec-tree'
import { extractPlainText } from './shared'

import type { IecElement } from '../iec-tree'
import type { Tc6Element } from '../tc6-tree'

/** An ST or IL body: `MainBody > BodyContent xsi:type > ST|IL`, the text trimmed. */
export function convertTextBody(params: { kind: 'ST' | 'IL'; source: Tc6Element }): IecElement {
	const { kind, source } = params
	return createIecElement({
		tagName: 'MainBody',
		children: [
			createIecElement({
				tagName: 'BodyContent',
				attributes: { [XSI_TYPE_ATTRIBUTE]: kind },
				children: [createIecElement({ tagName: kind, text: extractPlainText(source) })],
			}),
		],
	})
}
