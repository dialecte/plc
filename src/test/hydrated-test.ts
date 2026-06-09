import { CUSTOM_RECORD_ID_ATTRIBUTE, CUSTOM_RECORD_ID_ATTRIBUTE_NAME } from '@dialecte/core/helpers'
import {
	createTestProject,
	createTestRecordFactory,
	createXmlAssertions,
	createTestRunner,
	XMLNS_DEV_NAMESPACE,
} from '@dialecte/core/test'

import { PLC_DIALECTE_CONFIG } from '@/config'
import { PLC_EXTENSION_MODULES } from '@/extensions'

import type { Config } from '@/config/dialecte.config'

type PlcModules = typeof PLC_EXTENSION_MODULES

export const XMLNS_SCL_NAMESPACE = `xmlns="http://www.iec.ch/61850/2003/SCL"`
export const XMLNS_SCL_6_100_NAMESPACE = `xmlns:eIEC61850-6-100="http://www.iec.ch/61850/2019/SCL/6-100"`
export const ALL_XMLNS_NAMESPACES = `${XMLNS_SCL_NAMESPACE} ${XMLNS_SCL_6_100_NAMESPACE} ${XMLNS_DEV_NAMESPACE}`
export { CUSTOM_RECORD_ID_ATTRIBUTE, CUSTOM_RECORD_ID_ATTRIBUTE_NAME }

const PLC_EXTENSIONS = { base: PLC_EXTENSION_MODULES }

export const runPlcTestCases = createTestRunner<Config, PlcModules>({
	dialecteConfig: PLC_DIALECTE_CONFIG,
	extensions: PLC_EXTENSIONS,
})

export async function createPlcTestProject(params: { sourceXml: string; targetXml?: string }) {
	const { sourceXml, targetXml } = params

	return createTestProject<Config, PlcModules>({
		sourceXml,
		targetXml,
		dialecteConfig: PLC_DIALECTE_CONFIG,
		extensions: PLC_EXTENSIONS,
	})
}

export const createPlcTestRecord: ReturnType<typeof createTestRecordFactory<Config>> =
	createTestRecordFactory<Config>(PLC_DIALECTE_CONFIG)
export const { assertExpectedElementQueries, assertUnexpectedElementQueries } = createXmlAssertions(
	{
		namespaces: PLC_DIALECTE_CONFIG.namespaces,
	},
)
