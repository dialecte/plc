/** An element of the output document. */
export type IecElement = {
	tagName: string
	/** The value of each attribute by its qualified name; setting one again keeps its place. */
	attributes: Map<string, string>
	children: IecElement[]
	/** The element's text; an element carries either text or children. */
	text: string
}

/** One step of the serializer's walk: the element, whether the xsi prefix is in scope there, the output so far. */
export type IecSerialization = {
	element: IecElement
	/** Whether an ancestor already declared the xsi prefix. */
	xsiDeclared: boolean
	pieces: string[]
}
