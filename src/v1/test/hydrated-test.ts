import { CUSTOM_RECORD_ID_ATTRIBUTE, CUSTOM_RECORD_ID_ATTRIBUTE_NAME } from '@dialecte/core/helpers'
import { createTestHelpers } from '@dialecte/core/test'

import { PLC_DIALECTE } from '@/v1/declaration.constants'

import type { PlcTest } from './hydrated-test.types'

export { ALL_XMLNS_NAMESPACES, XMLNS_PLC_NAMESPACE } from './plc-xmlns.constants'
export { CUSTOM_RECORD_ID_ATTRIBUTE, CUSTOM_RECORD_ID_ATTRIBUTE_NAME }

/**
 * Every test helper of the PLC dialecte, derived by core from its declaration: a project of the helpers is opened
 * with the dialecte's import hook, and every fixture is checked against the PLC schema before a suite or a project
 * uses it.
 */
const plcTestHelpers: PlcTest.Helpers = createTestHelpers({
	dialecte: PLC_DIALECTE,
	schemaName: 'Plc',
})

/**
 * The runner of table-driven cases on a real project, on the store the runner chose. The XML of every case is checked
 * against the schema before the suite runs: a mistyped tag, a wrong namespace or an unknown attribute fails loudly,
 * every invalid case reported at once, instead of the suite quietly testing something else. A fixture is imported
 * through plc's import hook, so a PLCopen TC6 v2.01 fixture is normalised to IEC 61131-10 form first. The check reads
 * a fixture as written and skips a namespace plc does not declare, so a TC6 fixture is not validated: a mistake in one
 * stays silent.
 *
 * @intent test a PLC extension or hook with table-driven cases, assert on exported PLC XML, test the import of a PLCopen file
 */
export const runPlcTestCases: PlcTest.TestRunner = plcTestHelpers.runTestCases

/**
 * Opens a real project with the source (and target) fixture imported through plc's import hook, and returns the
 * opened documents. Required attributes may be left out of a fixture; its structure must still be the schema's. A
 * PLCopen TC6 v2.01 fixture is not validated: the check reads it as written and skips a namespace plc does not declare.
 *
 * @intent open a PLC test project, test several steps on a PLC document, import a PLCopen fixture in a test
 */
export function createPlcTestProject(
	params: PlcTest.TestProjectParams,
): Promise<PlcTest.TestProjectResult> {
	const { sourceXml, targetXml } = params
	return plcTestHelpers.createTestProject({ sourceXml, targetXml })
}

/**
 * Makes a typed in-memory PLC record, without a store, bound to the default config.
 *
 * @intent make a PLC record in a unit test, test a pure function on PLC records
 */
export const createPlcTestRecord: PlcTest.Helpers['createTestRecord'] =
	plcTestHelpers.createTestRecord

/**
 * Asserts that XPath queries each find an element in XML text, with the PLC namespaces.
 *
 * @intent assert elements are present in PLC XML, check exported PLC XML with XPath
 */
export const assertExpectedElementQueries: PlcTest.Helpers['assertExpectedElementQueries'] =
	plcTestHelpers.assertExpectedElementQueries

/**
 * Asserts that XPath queries each find nothing in XML text, with the PLC namespaces.
 *
 * @intent assert elements are absent from PLC XML, check exported PLC XML with XPath
 */
export const assertUnexpectedElementQueries: PlcTest.Helpers['assertUnexpectedElementQueries'] =
	plcTestHelpers.assertUnexpectedElementQueries

/**
 * Checks XML against the PLC schema: namespaces, allowed children and known attributes. Throws what is invalid.
 *
 * @intent validate a PLC fixture against the schema, check PLC XML structure in a test
 */
export const assertValidPlcXml: PlcTest.Helpers['assertValidXml'] = plcTestHelpers.assertValidXml
