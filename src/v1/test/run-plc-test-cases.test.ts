import { describe } from 'vitest'

import { ALL_XMLNS_NAMESPACES, runPlcTestCases } from '@/v1/test'

import type { PlcTest } from '@/v1/test'

describe('runPlcTestCases.withExport', () => {
	const testCases: PlcTest.TestCases = {
		'an act that adds FileHeader -> asserted on the exported XML': {
			sourceXml: `<Project ${ALL_XMLNS_NAMESPACES} schemaVersion="2.01"/>`,
			expectedQueries: ['//default:Project/default:FileHeader[@companyName="Acme"]'],
		},
	}

	runPlcTestCases.withExport({
		testCases,
		act: async ({ source }) => {
			const root = await source.query.getRoot()
			await source.transaction(async (tx) => {
				await tx.addChild(root, {
					tagName: 'FileHeader',
					attributes: { companyName: 'Acme', productName: 'Plant', productVersion: '1.0' },
				})
			})
		},
	})
})
