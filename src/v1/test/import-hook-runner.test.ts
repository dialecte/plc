import { describe } from 'vitest'

import { runPlcTestCases } from '@/v1/test'

import type { PlcTest } from '@/v1/test'

/** Every fixture file of the hook folder, by path; the file name is written in full where it is used. */
const FIXTURES = import.meta.glob<string>('../hooks/io/fixtures/tc6/*.xml', {
	query: '?raw',
	import: 'default',
	eager: true,
})

describe('runPlcTestCases.withExport on a TC6 v2.01 fixture', () => {
	const testCases: PlcTest.TestCases = {
		'a TC6 file -> normalised by the import hook: the IEC Project, its block and its wire, no TC6 element left':
			{
				sourceXml: FIXTURES['../hooks/io/fixtures/tc6/fbd-wiring.tc6.xml'],
				expectedQueries: [
					'/default:Project',
					'//default:FbdObject[@xsi:type="Block"][@typeName="AND"]',
					'//default:FbdObject[@xsi:type="Block"]/default:InputVariables/default:InputVariable[@parameterName="IN1"]/default:ConnectionPointIn/default:Connection[@refConnectionPointOutId="1"]',
					'//default:FbdObject[@identifier="A"]/default:ConnectionPointOut[@connectionPointOutId="1"]',
				],
				unexpectedQueries: ['//*[local-name()="project"]', '//*[local-name()="block"]'],
			},
	}

	runPlcTestCases.withExport({
		testCases,
		act: async () => {},
	})
})
