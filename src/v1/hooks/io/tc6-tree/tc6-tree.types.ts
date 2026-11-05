/** A node of a parsed file: an element, or a run of text (character data and CDATA alike). */
export type Tc6Node = Tc6Element | string

/** An element of a parsed file. Comments and processing instructions are not kept: no selector reads them. */
export type Tc6Element = {
	/** The name without its prefix: what every selector matches on, in any namespace. */
	localName: string
	/** The value of each attribute by its qualified name, in file order: `a:name` is not `name`. */
	attributes: Map<string, string>
	parent: Tc6Element | null
	children: Tc6Node[]
}

/** The state a parse fills, event after event. */
export type Tc6TreeBuild = {
	/** The first element of the file. */
	root: Tc6Element | null
	/** The innermost element still open. */
	open: Tc6Element | null
}
