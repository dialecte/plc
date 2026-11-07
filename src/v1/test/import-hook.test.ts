import { describe, expect, it } from 'vitest'

import {
	assertExpectedElementQueries,
	assertUnexpectedElementQueries,
	createPlcTestProject,
} from '@/v1/test'

/**
 * Every fixture file of the hook folder, by path. Every file name is written in full where it is used (the test-code
 * freeze finds a file by its name in this text).
 */
const FIXTURES = import.meta.glob<string>('../hooks/io/fixtures/tc6/*.xml', {
	query: '?raw',
	import: 'default',
	eager: true,
})

/** The text of a fixture file; a name no file carries is a mistake of this test, not an empty input. */
function readFixture(params: { file: string }): string {
	const text = FIXTURES[`../hooks/io/fixtures/tc6/${params.file}`]
	if (text === undefined) throw new Error(`no fixture file ${params.file} in hooks/io/fixtures/tc6`)
	return text
}

/** A PLCopen TC6 v2.01 file: an FBD with a variable wired to a block wired to a variable. */
const TC6_FBD_WIRING = readFixture({ file: 'fbd-wiring.tc6.xml' })

/** The block's input pin IN1 holds a connection to pin id 1. */
const WIRED_INPUT_QUERY =
	'//default:FbdObject[@xsi:type="Block"]/default:InputVariables/default:InputVariable[@parameterName="IN1"]/default:ConnectionPointIn/default:Connection[@refConnectionPointOutId="1"]'
/** The variable A produces pin id 1. */
const PRODUCING_PIN_QUERY =
	'//default:FbdObject[@identifier="A"]/default:ConnectionPointOut[@connectionPointOutId="1"]'
/** What a normalised TC6 file holds: the IEC root, the block, the wire and the pin it points at. */
const IEC_QUERIES = [
	'/default:Project',
	'//default:FbdObject[@xsi:type="Block"][@typeName="AND"]',
	WIRED_INPUT_QUERY,
	PRODUCING_PIN_QUERY,
]
/** What a normalised TC6 file no longer holds: the TC6 elements, found by local name in any namespace. */
const TC6_LEFTOVER_QUERIES = ['//*[local-name()="project"]', '//*[local-name()="block"]']

describe('a TC6 v2.01 fixture through createPlcTestProject -> normalised by the import hook', () => {
	/** The XML a test project exports for its source document. */
	async function exportedSourceXml(params: { sourceXml: string }): Promise<string> {
		const { project, source } = await createPlcTestProject({ sourceXml: params.sourceXml })
		const { file } = await project.export({ documentId: source.documentId })
		return file.text()
	}

	/** Runs plc's XPath assertions on the XML; throws their message when one fails. */
	function holdsIecQueries(params: { xml: string }): true {
		const { xml } = params
		assertExpectedElementQueries({ xml, queries: IEC_QUERIES })
		assertUnexpectedElementQueries({ xml, queries: TC6_LEFTOVER_QUERIES })
		return true
	}

	it('a TC6 project with an FBD -> the exported source document is the IEC Project, holding the block, its wire and the pin it points at', async () => {
		await expect(
			exportedSourceXml({ sourceXml: TC6_FBD_WIRING }).then((xml) => holdsIecQueries({ xml })),
		).resolves.toBe(true)
	})
})
