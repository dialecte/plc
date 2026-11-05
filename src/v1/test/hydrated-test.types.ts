import { PLC_EXTENSION_MODULES } from '../extensions'

import type { Config } from '@/v1/config/dialecte.config'
import type * as CoreTest from '@dialecte/core/test'

export namespace PlcTest {
	/** The extensions every PLC test project is opened with. */
	export type Modules = typeof PLC_EXTENSION_MODULES
	export type BaseTestCase = CoreTest.BaseTestCase
	export type BaseXmlTestCase = CoreTest.BaseXmlTestCase
	export type TestCases<T extends BaseTestCase = BaseXmlTestCase> = Record<string, T>
	export type TestDocument = CoreTest.TestDocument<Config>
	/** The fixtures of a test project: the source, and a target when the test needs one. */
	export type TestProjectParams = { sourceXml: string; targetXml?: string }
	export type TestProjectResult = CoreTest.TestProjectResult<Config, Modules>
	export type TestRecord = CoreTest.TestRecord<Config>
	export type ActParams<T extends CoreTest.BaseXmlTestCase> = CoreTest.ActParams<Config, T, Modules>
	export type ActResult = CoreTest.ActResult
	export type TestRunner = CoreTest.TestRunner<Config, Modules>
	/** Every test helper of the PLC dialecte, as core derives them from its declaration. */
	export type Helpers = CoreTest.TestHelpers<Config, Modules>
}
