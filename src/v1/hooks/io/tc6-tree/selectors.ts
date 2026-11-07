import type { Tc6Element, Tc6Node } from './tc6-tree.types'

function isElement(node: Tc6Node): node is Tc6Element {
	return typeof node !== 'string'
}

/**
 * Every node under `root`, in document order: an element comes before what it contains. Walks with its own stack: how
 * deep a file nests must not reach the call stack.
 */
function* walkNodes(root: Tc6Element): Generator<Tc6Node> {
	const pending: Tc6Node[] = [root]
	let node = pending.pop()
	while (node !== undefined) {
		if (node !== root) yield node
		if (isElement(node)) {
			for (let index = node.children.length - 1; index >= 0; index -= 1) {
				pending.push(node.children[index])
			}
		}
		node = pending.pop()
	}
}

/** Whether an element carries the wanted local name and, when one is asked, a parent of the wanted local name. */
function matches(params: {
	element: Tc6Element
	localName: string
	parentLocalName?: string
}): boolean {
	const { element, localName, parentLocalName } = params
	if (element.localName !== localName) return false
	return parentLocalName === undefined || element.parent?.localName === parentLocalName
}

/**
 * The first element under `root`, in document order, with this local name, in any namespace and at any depth.
 * `parentLocalName` narrows it to an element whose parent has that local name.
 */
export function findFirstDescendant(params: {
	root: Tc6Element
	localName: string
	parentLocalName?: string
}): Tc6Element | undefined {
	const { root, localName, parentLocalName } = params
	for (const node of walkNodes(root)) {
		if (isElement(node) && matches({ element: node, localName, parentLocalName })) return node
	}
	return undefined
}

/**
 * Every element under `root`, in document order, with this local name, in any namespace and at any depth: an element
 * of that name inside another one is listed too. `parentLocalName` narrows them to elements whose parent has that
 * local name.
 */
export function findDescendants(params: {
	root: Tc6Element
	localName: string
	parentLocalName?: string
}): Tc6Element[] {
	const { root, localName, parentLocalName } = params
	const found: Tc6Element[] = []
	for (const node of walkNodes(root)) {
		if (isElement(node) && matches({ element: node, localName, parentLocalName })) found.push(node)
	}
	return found
}

/** The elements directly under `parent`, in document order. */
export function getChildElements(parent: Tc6Element): Tc6Element[] {
	return parent.children.filter(isElement)
}

/** The first element directly under `parent`, whatever its name. */
export function getFirstChildElement(parent: Tc6Element): Tc6Element | undefined {
	return parent.children.find(isElement)
}

/** The elements directly under `parent` with this local name, in any namespace. */
export function findChildren(params: { parent: Tc6Element; localName: string }): Tc6Element[] {
	const { parent, localName } = params
	return getChildElements(parent).filter(function hasLocalName(child) {
		return child.localName === localName
	})
}

/** The first element directly under `parent` with this local name, in any namespace. */
export function findFirstChild(params: {
	parent: Tc6Element
	localName: string
}): Tc6Element | undefined {
	const { parent, localName } = params
	return parent.children.find(function isNamedChild(child): child is Tc6Element {
		return isElement(child) && child.localName === localName
	})
}

/** The text under an element at any depth, CDATA included, in document order. */
export function getTextContent(element: Tc6Element): string {
	const pieces: string[] = []
	for (const node of walkNodes(element)) {
		if (!isElement(node)) pieces.push(node)
	}
	return pieces.join('')
}
