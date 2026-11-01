import { describe, expect, it } from 'vitest'

import { ALL_XMLNS_NAMESPACES, assertValidPlcXml } from '@/v1/test'

/** Valid structure, but `schemaVersion` (required on `Project`) is left out. */
const PROJECT_WITHOUT_SCHEMA_VERSION = `<Project ${ALL_XMLNS_NAMESPACES}/>`
/** `Types` is never closed. */
const MALFORMED_PROJECT = `<Project ${ALL_XMLNS_NAMESPACES} schemaVersion="2.01"><Types></Project>`

describe('assertValidPlcXml', () => {
	it('a fixture missing a required attribute, requireComplete: false -> passes', () => {
		expect(() =>
			assertValidPlcXml({
				xml: PROJECT_WITHOUT_SCHEMA_VERSION,
				label: 'fixture',
				requireComplete: false,
			}),
		).not.toThrow()
	})

	type ThrowingCase = { xml: string; expected: RegExp }
	const throwingCases: Record<string, ThrowingCase> = {
		'a fixture missing a required attribute, requireComplete left out -> throws naming the label and the attribute':
			{
				xml: PROJECT_WITHOUT_SCHEMA_VERSION,
				expected:
					/^fixture: not valid Plc:[\s\S]*<Project> is missing required attribute 'schemaVersion'/,
			},
		'malformed text -> throws "<label>: malformed XML - "': {
			xml: MALFORMED_PROJECT,
			expected: /^fixture: malformed XML - \d+:\d+ \S/,
		},
	}

	for (const [name, { xml, expected }] of Object.entries(throwingCases)) {
		it(name, () => {
			expect(() => assertValidPlcXml({ xml, label: 'fixture' })).toThrow(expected)
		})
	}
})
