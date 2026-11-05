import { createIecElement } from '../iec-tree'
import { findDescendants, findFirstChild, getTextContent } from '../tc6-tree'

import type { IecElement } from '../iec-tree'
import type { Tc6Element } from '../tc6-tree'

/** The key of a producer's output id; no formal parameter means the producer's default output. */
export function getOutputIdKey(params: { localId: string; formalParameter?: string }): string {
	const { localId, formalParameter = '' } = params
	return `${localId}|${formalParameter}`
}

/** The element's trimmed text, at any depth. */
export function extractPlainText(element: Tc6Element): string {
	return getTextContent(element).trim()
}

function resolveConnection(params: {
	connection: Tc6Element
	outputIds: ReadonlyMap<string, string>
}): string | undefined {
	const { connection, outputIds } = params
	const localId = connection.attributes.get('refLocalId') ?? ''
	const formalParameter = connection.attributes.get('formalParameter') ?? ''
	return (
		outputIds.get(getOutputIdKey({ localId, formalParameter })) ??
		outputIds.get(getOutputIdKey({ localId }))
	)
}

/** A `ConnectionPointIn` with one `Connection` per connection under the source that resolves to a producer. */
export function buildConnectionPointIn(params: {
	connectionPointIn: Tc6Element | undefined
	outputIds: ReadonlyMap<string, string>
}): IecElement {
	const { connectionPointIn, outputIds } = params
	const iecConnectionPointIn = createIecElement({ tagName: 'ConnectionPointIn' })
	if (!connectionPointIn) return iecConnectionPointIn

	const connections = findDescendants({ root: connectionPointIn, localName: 'connection' })
	for (const connection of connections) {
		const refConnectionPointOutId = resolveConnection({ connection, outputIds })
		if (!refConnectionPointOutId) continue
		iecConnectionPointIn.children.push(
			createIecElement({ tagName: 'Connection', attributes: { refConnectionPointOutId } }),
		)
	}
	return iecConnectionPointIn
}

/** A `ConnectionPointOut` carrying the producer's default output id, when it has one. */
export function buildConnectionPointOut(params: {
	element: Tc6Element
	outputIds: ReadonlyMap<string, string>
}): IecElement {
	const { element, outputIds } = params
	const localId = element.attributes.get('localId') ?? ''
	const connectionPointOut = createIecElement({ tagName: 'ConnectionPointOut' })
	const connectionPointOutId = outputIds.get(getOutputIdKey({ localId }))
	if (connectionPointOutId) {
		connectionPointOut.attributes.set('connectionPointOutId', connectionPointOutId)
	}
	return connectionPointOut
}

/** Adds a `RelPosition` when the source element has a direct `position`. */
export function appendPosition(params: { parent: IecElement; element: Tc6Element }): void {
	const { parent, element } = params
	const position = findFirstChild({ parent: element, localName: 'position' })
	if (!position) return
	parent.children.push(
		createIecElement({
			tagName: 'RelPosition',
			attributes: {
				x: position.attributes.get('x') ?? '0',
				y: position.attributes.get('y') ?? '0',
			},
		}),
	)
}
