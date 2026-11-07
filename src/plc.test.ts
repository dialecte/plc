import { describe, it, expect, onTestFinished } from 'vitest'

import { createPlcProject } from '@/v1'

/**
 * Every fixture file of the hook folder, by path. Every file name is written in full where it is used (the test-code
 * freeze finds a file by its name in this text).
 */
const FIXTURES = import.meta.glob<string>('./v1/hooks/io/fixtures/tc6/*.xml', {
	query: '?raw',
	import: 'default',
	eager: true,
})

/** The text of a fixture file; a name no file carries is a mistake of this test, not an empty input. */
function readFixture(params: { file: string }): string {
	const text = FIXTURES[`./v1/hooks/io/fixtures/tc6/${params.file}`]
	if (text === undefined)
		throw new Error(`no fixture file ${params.file} in v1/hooks/io/fixtures/tc6`)
	return text
}

/** The tag of the root a file reads back as, once imported into a project on the in-memory store. */
async function rootTagNameAfterImport(params: { xml: string; name: string }): Promise<string> {
	const { xml, name } = params
	const project = await createPlcProject({ storage: { type: 'inMemory' } }).open(
		`plc-${crypto.randomUUID()}`,
	)
	onTestFinished(() => project.destroy())
	const { documentId } = await project.importFile(new File([xml], name, { type: 'text/xml' }))
	const root = await project.openDocument(documentId).query.getRoot()
	return root.tagName
}

describe('createPlcProject', () => {
	it('returns a project instance', () => {
		const project = createPlcProject()
		expect(project).toBeDefined()
	})

	it('a project -> carries the id of the declaration it is wired from', () => {
		expect(createPlcProject().dialecteId).toBe('plc/v1')
	})

	it('a TC6 v2.01 file imported into its project on the in-memory store -> normalised: the root reads back as the IEC Project', async () => {
		await expect(
			rootTagNameAfterImport({ xml: readFixture({ file: 'fbd-wiring.tc6.xml' }), name: 'tc6.xml' }),
		).resolves.toBe('Project')
	})

	it('custom extensions given to createPlcProject -> their methods are on an opened document query', async () => {
		const project = await createPlcProject({
			storage: { type: 'inMemory' },
			extensions: { greeting: { query: { hello: () => 'hello' } } },
		}).open(`plc-${crypto.randomUUID()}`)
		onTestFinished(() => project.destroy())
		const { documentId } = await project.importFile(
			new File([readFixture({ file: 'fbd-wiring.iec.xml' })], 'iec.xml', { type: 'text/xml' }),
		)
		expect(project.openDocument(documentId).query.greeting.hello()).toBe('hello')
	})
})
