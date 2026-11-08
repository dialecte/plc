// the test-only engine worker, started from its `?worker&url` import as an app's page starts its own
import engineUrl from './__tests__/plc-engine.worker?worker&url'
import { PLC_DIALECTE } from './declaration.constants'
import { createPlcProject } from './dialecte'

// SQLite storage, as an app opts into it: the import registers the storage kind, the call tells where the engine is
import { registerSqliteEngine } from '@dialecte/core/sqlite'
import { describe, expect, it, onTestFinished } from 'vitest'

import type { Plc } from './config'

registerSqliteEngine({ url: engineUrl, dialectes: [PLC_DIALECTE] })

/**
 * Every fixture file of the hook folder, by path. Every file name is written in full where it is used (the test-code
 * freeze finds a file by its name in this text).
 */
const FIXTURES = import.meta.glob<string>('./hooks/io/fixtures/tc6/*.xml', {
	query: '?raw',
	import: 'default',
	eager: true,
})

/**
 * One case starts the engine worker, installs its sqlite file (wasm included), imports, closes and opens again: seconds,
 * many times over on a loaded machine. A wide bound, so what fails is the case with its message, not the runner's default.
 */
const ENGINE_CASE_TIMEOUT_MS = 60_000

/** What a document reads back once its project is opened again. */
type ReadBack = {
	configKey: string | undefined
	rootTagName: string
	fbdObjectCount: number
	wiredPinIds: string[]
}

/** The text of a fixture file; a name no file carries is a mistake of this test, not an empty input. */
function readFixture(params: { file: string }): string {
	const text = FIXTURES[`./hooks/io/fixtures/tc6/${params.file}`]
	if (text === undefined) throw new Error(`no fixture file ${params.file} in hooks/io/fixtures/tc6`)
	return text
}

function fileOf(params: { xml: string; name: string }): File {
	return new File([params.xml], params.name, { type: 'text/xml' })
}

/**
 * The file imported into a new PLC project on sqlite storage, the project closed and opened again, the
 * document read back from the engine; the project destroyed when the case ends, whichever step it reached.
 */
async function importAndReadBack(params: { file: File }): Promise<ReadBack> {
	const { file } = params
	const name = `plc-sqlite-${crypto.randomUUID()}`
	const first = await createPlcProject({ storage: { type: 'sqlite' } }).open(name)
	// the project the case holds open; none between the close and the reopen
	const held: { project: Plc.Project | undefined } = { project: first }
	onTestFinished(function destroyProject() {
		if (held.project) return held.project.destroy()
		return createPlcProject.destroyProject({ name, storage: { type: 'sqlite' } })
	})
	const { documentId } = await first.importFile(file)
	await first.close()
	held.project = undefined
	const again = await createPlcProject({ storage: { type: 'sqlite' } }).open(name)
	held.project = again
	const document = again.openDocument(documentId)
	const root = await document.query.getRoot()
	const fbdObjects = await document.query.getRecordsByTagName('FbdObject')
	const connections = await document.query.getRecordsByTagName('Connection')
	const wiredPins = await Promise.all(
		connections.map((connection) => document.query.getAttributes(connection)),
	)
	const record = await again.getDocument(documentId)
	return {
		configKey: record?.configKey,
		rootTagName: root.tagName,
		fbdObjectCount: fbdObjects.length,
		wiredPinIds: wiredPins.map((attributes) => attributes.refConnectionPointOutId).sort(),
	}
}

describe('createPlcProject on sqlite storage, served by an engine worker of PLC_DIALECTE', () => {
	type TestCase = { file: File; expected: ReadBack }
	const IEC_FBD_WIRING_READ_BACK: ReadBack = {
		configKey: 'plc',
		rootTagName: 'Project',
		fbdObjectCount: 3,
		wiredPinIds: ['1', '2'],
	}
	const testCases: Record<string, TestCase> = {
		'a TC6 v2.01 file -> normalised by the engine at import, read back as IEC (Project, three FBD objects, two wires) after reopening':
			{
				file: fileOf({ xml: readFixture({ file: 'fbd-wiring.tc6.xml' }), name: 'fixture.tc6.xml' }),
				expected: IEC_FBD_WIRING_READ_BACK,
			},
		'an IEC file -> imported unchanged, read back as IEC after reopening': {
			file: fileOf({ xml: readFixture({ file: 'fbd-wiring.iec.xml' }), name: 'fixture.iec.xml' }),
			expected: IEC_FBD_WIRING_READ_BACK,
		},
	}

	for (const [name, { file, expected }] of Object.entries(testCases)) {
		it(
			name,
			async () => {
				await expect(importAndReadBack({ file })).resolves.toEqual(expected)
			},
			ENGINE_CASE_TIMEOUT_MS,
		)
	}
})
