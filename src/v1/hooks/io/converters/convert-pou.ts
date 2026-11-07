import { createIecElement } from '../iec-tree'
import { findFirstDescendant } from '../tc6-tree'
import { convertFbdBody } from './convert-fbd-body'
import { convertInterface } from './convert-interface'
import { convertLdBody } from './convert-ld-body'
import { convertTextBody } from './convert-text-body'

import type { IecElement } from '../iec-tree'
import type { Tc6Element } from '../tc6-tree'

/** The first body kind found, in this priority, at any depth: FBD, LD, ST, IL. */
function convertBody(body: Tc6Element): IecElement | null {
	const fbd = findFirstDescendant({ root: body, localName: 'FBD' })
	if (fbd) return convertFbdBody(fbd)
	const ld = findFirstDescendant({ root: body, localName: 'LD' })
	if (ld) return convertLdBody(ld)
	const st = findFirstDescendant({ root: body, localName: 'ST' })
	if (st) return convertTextBody({ kind: 'ST', source: st })
	const il = findFirstDescendant({ root: body, localName: 'IL' })
	if (il) return convertTextBody({ kind: 'IL', source: il })
	return null
}

/** A `pou` as a `Program` (`pouType="program"`) or a `FunctionBlock` (any other type, or none). */
export function convertPou(pou: Tc6Element): IecElement {
	const iecPou = createIecElement({
		tagName: pou.attributes.get('pouType') === 'program' ? 'Program' : 'FunctionBlock',
		attributes: { name: pou.attributes.get('name') ?? '' },
	})

	const tc6Interface = findFirstDescendant({ root: pou, localName: 'interface' })
	if (tc6Interface) convertInterface({ iecPou, tc6Interface })

	const body = findFirstDescendant({ root: pou, localName: 'body' })
	const mainBody = body ? convertBody(body) : null
	if (mainBody) iecPou.children.push(mainBody)

	return iecPou
}
