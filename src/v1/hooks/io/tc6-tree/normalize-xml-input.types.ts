/**
 * What the input scan finds to rewrite: `start` included, `end` excluded. An attribute value, its quotes left out, or a
 * processing instruction, whole.
 */
export type InputRange = {
	kind: 'attribute-value' | 'processing-instruction'
	start: number
	end: number
}
