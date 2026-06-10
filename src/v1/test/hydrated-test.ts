import {
	CUSTOM_RECORD_ID_ATTRIBUTE,
	CUSTOM_RECORD_ID_ATTRIBUTE_NAME,
	XMLNS_XSI_NAMESPACE,
} from '@dialecte/core/helpers'
import {
	createTestProject,
	createTestRecordFactory,
	createXmlAssertions,
	createTestRunner,
	XMLNS_DEV_NAMESPACE,
} from '@dialecte/core/test'

import { PLC_DIALECTE_CONFIG } from '@/v1/config'
import { PLC_EXTENSION_MODULES } from '@/v1/extensions'

import type { Config } from '@/v1/config/dialecte.config'

type PlcModules = typeof PLC_EXTENSION_MODULES

export const XMLNS_PLC_NAMESPACE = `xmlns=${PLC_DIALECTE_CONFIG.namespaces.default.uri}`
export const ALL_XMLNS_NAMESPACES = `${XMLNS_PLC_NAMESPACE} ${XMLNS_DEV_NAMESPACE} ${XMLNS_XSI_NAMESPACE}`
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
