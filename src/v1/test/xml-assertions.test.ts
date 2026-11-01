import { describe, expect, it } from 'vitest'

import {
	ALL_XMLNS_NAMESPACES,
	assertExpectedElementQueries,
	assertUnexpectedElementQueries,
} from '@/v1/test'

const PROJECT_WITH_FILE_HEADER = `<Project ${ALL_XMLNS_NAMESPACES} schemaVersion="2.01"><FileHeader companyName="Acme" productName="Plant" productVersion="1.0"/></Project>`

describe('the query assertions on XML text', () => {
	const fileHeaderQuery = '//default:Project/default:FileHeader[@companyName="Acme"]'

	it('assertExpectedElementQueries, a PLC default-namespace XPath on XML holding the element -> passes', () => {
		expect(() =>
			assertExpectedElementQueries({ xml: PROJECT_WITH_FILE_HEADER, queries: [fileHeaderQuery] }),
		).not.toThrow()
	})

	it('assertUnexpectedElementQueries, a PLC default-namespace XPath on XML holding the element -> throws', () => {
		expect(() =>
			assertUnexpectedElementQueries({ xml: PROJECT_WITH_FILE_HEADER, queries: [fileHeaderQuery] }),
		).toThrow(/Unexpected element found/)
	})
})
