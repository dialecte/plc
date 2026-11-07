import { createIecElement, XSI_TYPE_ATTRIBUTE } from '../iec-tree'
import { findDescendants, findFirstDescendant, getChildElements } from '../tc6-tree'
import {
	appendPosition,
	buildConnectionPointIn,
	buildConnectionPointOut,
	extractPlainText,
	getOutputIdKey,
} from './shared'

import type { IecElement } from '../iec-tree'
import type { Tc6Element } from '../tc6-tree'

/** The formal parameter of each output pin an FBD element produces, in document order. */
function getOutputPins(element: Tc6Element): string[] {
	switch (element.localName) {
		case 'block':
			return findDescendants({
				root: element,
				localName: 'variable',
				parentLocalName: 'outputVariables',
			}).map(function getFormalParameter(variable) {
				return variable.attributes.get('formalParameter') ?? ''
			})
		case 'inVariable':
		case 'continuation':
			return ['']
		default:
			return []
	}
}

/**
 * A unique `connectionPointOutId` for every output pin of the network, as monotonic integers, keyed by local id and
 * formal parameter. Each producer's first output also registers as its default, so that a connection that omits the
 * formal parameter still resolves.
 */
function allocateFbdOutputIds(fbd: Tc6Element): Map<string, string> {
	const outputIds = new Map<string, string>()
	let allocated = 0
	for (const element of getChildElements(fbd)) {
		const localId = element.attributes.get('localId') ?? ''
		const defaultKey = getOutputIdKey({ localId })
		for (const formalParameter of getOutputPins(element)) {
			allocated += 1
			const id = String(allocated)
			outputIds.set(getOutputIdKey({ localId, formalParameter }), id)
			if (!outputIds.has(defaultKey)) outputIds.set(defaultKey, id)
		}
	}
	return outputIds
}

function convertInputVariable(params: {
	variable: Tc6Element
	outputIds: ReadonlyMap<string, string>
}): IecElement {
	const { variable, outputIds } = params
	const inputVariable = createIecElement({
		tagName: 'InputVariable',
		attributes: { parameterName: variable.attributes.get('formalParameter') ?? '' },
	})
	if (variable.attributes.get('negated') === 'true') inputVariable.attributes.set('negated', 'true')
	const edge = variable.attributes.get('edge')
	if (edge && edge !== 'none') inputVariable.attributes.set('edge', edge)

	const connectionPointIn = findFirstDescendant({ root: variable, localName: 'connectionPointIn' })
	inputVariable.children.push(buildConnectionPointIn({ connectionPointIn, outputIds }))
	return inputVariable
}

function convertOutputVariable(params: {
	parameterName: string
	connectionPointOutId: string | undefined
}): IecElement {
	const { parameterName, connectionPointOutId } = params
	const connectionPointOut = createIecElement({ tagName: 'ConnectionPointOut' })
	if (connectionPointOutId) {
		connectionPointOut.attributes.set('connectionPointOutId', connectionPointOutId)
	}
	return createIecElement({
		tagName: 'OutputVariable',
		attributes: { parameterName },
		children: [connectionPointOut],
	})
}

function convertBlock(params: {
	element: Tc6Element
	outputIds: ReadonlyMap<string, string>
}): IecElement {
	const { element, outputIds } = params
	const fbdObject = createIecElement({
		tagName: 'FbdObject',
		attributes: {
			[XSI_TYPE_ATTRIBUTE]: 'Block',
			typeName: element.attributes.get('typeName') ?? '',
		},
	})
	const instanceName = element.attributes.get('instanceName')
	if (instanceName) fbdObject.attributes.set('instanceName', instanceName)

	appendPosition({ parent: fbdObject, element })

	const inputs = findDescendants({
		root: element,
		localName: 'variable',
		parentLocalName: 'inputVariables',
	})
	if (inputs.length > 0) {
		fbdObject.children.push(
			createIecElement({
				tagName: 'InputVariables',
				children: inputs.map(function convertInput(variable) {
					return convertInputVariable({ variable, outputIds })
				}),
			}),
		)
	}

	const localId = element.attributes.get('localId') ?? ''
	const outputs = findDescendants({
		root: element,
		localName: 'variable',
		parentLocalName: 'outputVariables',
	})
	if (outputs.length > 0) {
		fbdObject.children.push(
			createIecElement({
				tagName: 'OutputVariables',
				children: outputs.map(function convertOutput(variable) {
					const parameterName = variable.attributes.get('formalParameter') ?? ''
					return convertOutputVariable({
						parameterName,
						connectionPointOutId: outputIds.get(
							getOutputIdKey({ localId, formalParameter: parameterName }),
						),
					})
				}),
			}),
		)
	}

	return fbdObject
}

function getExpressionText(element: Tc6Element): string {
	const expression = findFirstDescendant({ root: element, localName: 'expression' })
	return expression ? extractPlainText(expression) : ''
}

/** A `DataSource` carries its `ConnectionPointOut` directly: the `OutputVariables` wrapper is only valid on a `Block`. */
function convertDataSource(params: {
	element: Tc6Element
	outputIds: ReadonlyMap<string, string>
}): IecElement {
	const { element, outputIds } = params
	const fbdObject = createIecElement({
		tagName: 'FbdObject',
		attributes: { [XSI_TYPE_ATTRIBUTE]: 'DataSource', identifier: getExpressionText(element) },
	})
	appendPosition({ parent: fbdObject, element })
	fbdObject.children.push(buildConnectionPointOut({ element, outputIds }))
	return fbdObject
}

/** A `DataSink` carries its `ConnectionPointIn` directly: the `InputVariables` wrapper is only valid on a `Block`. */
function convertDataSink(params: {
	element: Tc6Element
	outputIds: ReadonlyMap<string, string>
}): IecElement {
	const { element, outputIds } = params
	const fbdObject = createIecElement({
		tagName: 'FbdObject',
		attributes: { [XSI_TYPE_ATTRIBUTE]: 'DataSink', identifier: getExpressionText(element) },
	})
	appendPosition({ parent: fbdObject, element })
	const connectionPointIn = findFirstDescendant({ root: element, localName: 'connectionPointIn' })
	fbdObject.children.push(buildConnectionPointIn({ connectionPointIn, outputIds }))
	return fbdObject
}

function convertComment(element: Tc6Element): IecElement {
	const commonObject = createIecElement({
		tagName: 'CommonObject',
		attributes: { [XSI_TYPE_ATTRIBUTE]: 'Comment' },
	})
	appendPosition({ parent: commonObject, element })

	const content = findFirstDescendant({ root: element, localName: 'content' })
	// SimpleText is mixed with no value attribute: the text is element content
	commonObject.children.push(
		createIecElement({
			tagName: 'Content',
			attributes: { [XSI_TYPE_ATTRIBUTE]: 'SimpleText' },
			text: content ? extractPlainText(content) : '',
		}),
	)
	return commonObject
}

function convertConnector(params: {
	element: Tc6Element
	outputIds: ReadonlyMap<string, string>
}): IecElement {
	const { element, outputIds } = params
	const commonObject = createIecElement({
		tagName: 'CommonObject',
		attributes: {
			[XSI_TYPE_ATTRIBUTE]: 'Connector',
			label: element.attributes.get('name') ?? '',
		},
	})
	appendPosition({ parent: commonObject, element })
	const connectionPointIn = findFirstDescendant({ root: element, localName: 'connectionPointIn' })
	commonObject.children.push(buildConnectionPointIn({ connectionPointIn, outputIds }))
	return commonObject
}

function convertContinuation(params: {
	element: Tc6Element
	outputIds: ReadonlyMap<string, string>
}): IecElement {
	const { element, outputIds } = params
	const commonObject = createIecElement({
		tagName: 'CommonObject',
		attributes: {
			[XSI_TYPE_ATTRIBUTE]: 'Continuation',
			label: element.attributes.get('name') ?? '',
		},
	})
	appendPosition({ parent: commonObject, element })
	commonObject.children.push(buildConnectionPointOut({ element, outputIds }))
	return commonObject
}

function convertFbdElement(params: {
	element: Tc6Element
	outputIds: ReadonlyMap<string, string>
}): IecElement | null {
	const { element, outputIds } = params
	switch (element.localName) {
		case 'block':
			return convertBlock({ element, outputIds })
		case 'inVariable':
			return convertDataSource({ element, outputIds })
		case 'outVariable':
			return convertDataSink({ element, outputIds })
		case 'comment':
			return convertComment(element)
		case 'connector':
			return convertConnector({ element, outputIds })
		case 'continuation':
			return convertContinuation({ element, outputIds })
		default:
			return null
	}
}

/** An FBD body: `MainBody > BodyContent xsi:type="FBD" > Network`, one graphic object per mapped child. */
export function convertFbdBody(fbd: Tc6Element): IecElement {
	const outputIds = allocateFbdOutputIds(fbd)
	const network = createIecElement({
		tagName: 'Network',
		attributes: { evaluationOrder: '0' },
	})
	for (const element of getChildElements(fbd)) {
		const converted = convertFbdElement({ element, outputIds })
		if (converted) network.children.push(converted)
	}
	return createIecElement({
		tagName: 'MainBody',
		children: [
			createIecElement({
				tagName: 'BodyContent',
				attributes: { [XSI_TYPE_ATTRIBUTE]: 'FBD' },
				children: [network],
			}),
		],
	})
}
