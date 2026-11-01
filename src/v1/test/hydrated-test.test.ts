import { describe, expect, it } from 'vitest'

import { ALL_XMLNS_NAMESPACES, createPlcTestProject } from '@/v1/test'

/** Valid structure, but `schemaVersion` (required on `Project`) is left out. */
const PROJECT_WITHOUT_SCHEMA_VERSION = `<Project ${ALL_XMLNS_NAMESPACES}/>`
/** `Range` belongs under `UserDefinedTypeSpec`, never directly under `Project`. */
const PROJECT_WITH_MISPLACED_CHILD = `<Project ${ALL_XMLNS_NAMESPACES} schemaVersion="2.01"><Range lower="0" upper="1"/></Project>`

describe('createPlcTestProject', () => {
	it('a valid fixture that leaves out a required attribute -> resolves with the project and the opened source document', async () => {
		await expect(
			createPlcTestProject({ sourceXml: PROJECT_WITHOUT_SCHEMA_VERSION }),
		).resolves.toMatchObject({
			project: expect.anything(),
			source: { documentId: expect.any(String), document: expect.anything() },
		})
	})

	it('a valid fixture that leaves out a required attribute -> its root is readable through the source document query', async () => {
		await expect(
			createPlcTestProject({ sourceXml: PROJECT_WITHOUT_SCHEMA_VERSION }).then(({ source }) =>
				source.document.query.getRoot(),
			),
		).resolves.toMatchObject({ tagName: 'Project' })
	})

	it('a valid source and target that both leave out a required attribute -> resolves with the opened source and target documents', async () => {
		await expect(
			createPlcTestProject({
				sourceXml: PROJECT_WITHOUT_SCHEMA_VERSION,
				targetXml: PROJECT_WITHOUT_SCHEMA_VERSION,
			}),
		).resolves.toMatchObject({
			source: { documentId: expect.any(String), document: expect.anything() },
			target: { documentId: expect.any(String), document: expect.anything() },
		})
	})

	type InvalidFixtureCase = { sourceXml: string; targetXml?: string; label: string }
	const invalidFixtureCases: Record<string, InvalidFixtureCase> = {
		'a sourceXml with a child its parent does not allow -> rejects naming sourceXml': {
			sourceXml: PROJECT_WITH_MISPLACED_CHILD,
			label: 'sourceXml',
		},
		'a targetXml with a child its parent does not allow -> rejects naming targetXml': {
			sourceXml: PROJECT_WITHOUT_SCHEMA_VERSION,
			targetXml: PROJECT_WITH_MISPLACED_CHILD,
			label: 'targetXml',
		},
	}

	for (const [name, { sourceXml, targetXml, label }] of Object.entries(invalidFixtureCases)) {
		it(name, async () => {
			await expect(createPlcTestProject({ sourceXml, targetXml })).rejects.toThrow(
				new RegExp(`${label}: not valid Plc:[\\s\\S]*<Range> is not a valid child of <Project>`),
			)
		})
	}
})
