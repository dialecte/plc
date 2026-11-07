import { createIecElement } from '../iec-tree'
import { findChildren, findFirstDescendant, getFirstChildElement } from '../tc6-tree'

import type { IecElement } from '../iec-tree'
import type { Tc6Element } from '../tc6-tree'

/** The name of the first `derived` under a `type`, at any depth, else the local name of its first child element. */
function resolveTypeName(type: Tc6Element | undefined): string {
	if (!type) return ''
	const derived = findFirstDescendant({ root: type, localName: 'derived' })
	if (derived) return derived.attributes.get('name') ?? ''
	return getFirstChildElement(type)?.localName ?? ''
}

/**
 * A `variable` declaration as a `Variable` with a resolved `Type > TypeName` (an elementary type's tag name or
 * `derived/@name`) and an optional `InitialValue > SimpleValue`.
 */
function convertVariableDeclaration(tc6Variable: Tc6Element): IecElement {
	const typeName = resolveTypeName(findFirstDescendant({ root: tc6Variable, localName: 'type' }))
	const variable = createIecElement({
		tagName: 'Variable',
		attributes: { name: tc6Variable.attributes.get('name') ?? '' },
		children: [
			createIecElement({
				tagName: 'Type',
				children: [createIecElement({ tagName: 'TypeName', text: typeName })],
			}),
		],
	})

	const simpleValue = findFirstDescendant({
		root: tc6Variable,
		localName: 'simpleValue',
		parentLocalName: 'initialValue',
	})
	if (simpleValue) {
		variable.children.push(
			createIecElement({
				tagName: 'InitialValue',
				children: [
					createIecElement({
						tagName: 'SimpleValue',
						attributes: { value: simpleValue.attributes.get('value') ?? '' },
					}),
				],
			}),
		)
	}
	return variable
}

/** The variables of every direct `sectionName` block under the interface, converted, in document order. */
function collectVariableDeclarations(params: {
	tc6Interface: Tc6Element
	sectionName: string
}): IecElement[] {
	const { tc6Interface, sectionName } = params
	const variables: IecElement[] = []
	for (const section of findChildren({ parent: tc6Interface, localName: sectionName })) {
		for (const tc6Variable of findChildren({ parent: section, localName: 'variable' })) {
			variables.push(convertVariableDeclaration(tc6Variable))
		}
	}
	return variables
}

/**
 * Adds a `Parameters` sub-section, stamping each `Variable`'s required `orderWithinParamSet`, which numbers parameters
 * across the whole set. Returns the next order index.
 */
function appendParameterSection(params: {
	parameters: IecElement
	tagName: string
	variables: IecElement[]
	startOrder: number
}): number {
	const { parameters, tagName, variables, startOrder } = params
	if (variables.length === 0) return startOrder
	let order = startOrder
	for (const variable of variables) {
		variable.attributes.set('orderWithinParamSet', String(order))
		order += 1
	}
	parameters.children.push(createIecElement({ tagName, children: variables }))
	return order
}

/** Adds a variable section when it holds a variable. `Vars` requires `accessSpecifier`: locals default to `protected`. */
function appendVariableSection(params: {
	iecPou: IecElement
	tagName: string
	variables: IecElement[]
}): void {
	const { iecPou, tagName, variables } = params
	if (variables.length === 0) return
	iecPou.children.push(
		createIecElement({
			tagName,
			attributes: tagName === 'Vars' ? { accessSpecifier: 'protected' } : {},
			children: variables,
		}),
	)
}

/**
 * Maps the `interface` variable sections onto the POU. Input, output and in-out variables nest under one `Parameters`;
 * locals map to `Vars`, external and temp variables directly. Sections come in the output's child order (`Parameters`,
 * `ExternalVars`, `Vars`, `TempVars`), so they precede `MainBody`.
 */
export function convertInterface(params: { iecPou: IecElement; tc6Interface: Tc6Element }): void {
	const { iecPou, tc6Interface } = params
	const inputVariables = collectVariableDeclarations({ tc6Interface, sectionName: 'inputVars' })
	const outputVariables = collectVariableDeclarations({ tc6Interface, sectionName: 'outputVars' })
	const inOutVariables = collectVariableDeclarations({ tc6Interface, sectionName: 'inOutVars' })

	if (inputVariables.length > 0 || outputVariables.length > 0 || inOutVariables.length > 0) {
		const parameters = createIecElement({ tagName: 'Parameters' })
		const afterInOut = appendParameterSection({
			parameters,
			tagName: 'InoutVars',
			variables: inOutVariables,
			startOrder: 0,
		})
		const afterInput = appendParameterSection({
			parameters,
			tagName: 'InputVars',
			variables: inputVariables,
			startOrder: afterInOut,
		})
		appendParameterSection({
			parameters,
			tagName: 'OutputVars',
			variables: outputVariables,
			startOrder: afterInput,
		})
		iecPou.children.push(parameters)
	}

	appendVariableSection({
		iecPou,
		tagName: 'ExternalVars',
		variables: collectVariableDeclarations({ tc6Interface, sectionName: 'externalVars' }),
	})
	appendVariableSection({
		iecPou,
		tagName: 'Vars',
		variables: collectVariableDeclarations({ tc6Interface, sectionName: 'localVars' }),
	})
	appendVariableSection({
		iecPou,
		tagName: 'TempVars',
		variables: collectVariableDeclarations({ tc6Interface, sectionName: 'tempVars' }),
	})
}
