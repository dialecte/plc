import type { IecElement } from './iec-tree.types'

/** A new output element; `attributes` keep the order they are written in. */
export function createIecElement(params: {
	tagName: string
	attributes?: Readonly<Record<string, string>>
	children?: IecElement[]
	text?: string
}): IecElement {
	const { tagName, attributes = {}, children = [], text = '' } = params
	return { tagName, attributes: new Map(Object.entries(attributes)), children, text }
}
