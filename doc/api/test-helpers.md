---
description: Test helpers for @dialecte/plc v1 — createPlcTestProject, runPlcTestCases, XML assertions, and namespace constants.
---

# Test Helpers

`@dialecte/plc` ships a test entry point with PLC-specific utilities. Import from `@dialecte/plc/v1/test`:

```ts
import {
	runPlcTestCases,
	createPlcTestProject,
	createPlcTestRecord,
	assertExpectedElementQueries,
	assertUnexpectedElementQueries,
	ALL_XMLNS_NAMESPACES,
	CUSTOM_RECORD_ID_ATTRIBUTE,
} from '@dialecte/plc/v1/test'
```

All helpers are wired to the PLC config internally — no config argument needed.

## runPlcTestCases

Table-driven async runner backed by a real in-memory database. Pre-bound to the PLC dialecte config.

Two methods enforce the right contract at call-site.

| Method                          | Use when                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `runPlcTestCases.withExport`    | `act` performs transactions, assertions on exported XML (`Promise<PlcTest.ActResult>`) |
| `runPlcTestCases.withoutExport` | `act` asserts directly on query results (`Promise<void>`)                              |
| `runPlcTestCases.generic`       | Sync pure-function tests — no XML, no DB                                               |

### Scenario 1 - query assertions only (act returns void)

Use when `act` asserts directly on query results via `expect`. No XML export needed.

```ts
import { describe, expect } from 'vitest'
import {
	runPlcTestCases,
	ALL_XMLNS_NAMESPACES,
	CUSTOM_RECORD_ID_ATTRIBUTE,
} from '@dialecte/plc/v1/test'
import type { PlcTest } from '@dialecte/plc/v1/test'

type TestCase = PlcTest.BaseTestCase & {
	expectedCount: number
}

const testCases: PlcTest.TestCases<TestCase> = {
	'no FunctionBlock elements → empty array': {
		sourceXml: `<project ${ALL_XMLNS_NAMESPACES} ${CUSTOM_RECORD_ID_ATTRIBUTE}="project-1"/>`,
		expectedCount: 0,
	},
	'two FunctionBlock elements → count 2': {
		sourceXml: `
			<project ${ALL_XMLNS_NAMESPACES}>
				<types ${CUSTOM_RECORD_ID_ATTRIBUTE}="types-1">
					<pous ${CUSTOM_RECORD_ID_ATTRIBUTE}="pous-1">
						<pou name="FB1" pouType="functionBlock" ${CUSTOM_RECORD_ID_ATTRIBUTE}="pou-1"/>
						<pou name="FB2" pouType="functionBlock" ${CUSTOM_RECORD_ID_ATTRIBUTE}="pou-2"/>
					</pous>
				</types>
			</project>
		`,
		expectedCount: 2,
	},
}

async function act({ source, testCase }: PlcTest.ActParams<TestCase>): Promise<void> {
	const root = await source.document.query.getRoot()
	const { pou: pous } = await source.document.query.findDescendants(root)
	const fbs = pous.filter(async (p) => {
		const attrs = await source.document.query.getAttributes(p)
		return attrs.find((a) => a.name === 'pouType')?.value === 'functionBlock'
	})
	expect(fbs).toHaveLength(testCase.expectedCount)
}

describe('getFunctionBlocks', () => {
	runPlcTestCases.withoutExport({ testCases, act })
})
```

### Scenario 2 - XML export assertions (act returns ActResult)

Use when `act` performs transactions and assertions must run on the exported XML via XPath. `act` returns an optional `ActResult` to choose which document to assert on (defaults to `source`) and toggle `withDatabaseIds`.

```ts
import { describe } from 'vitest'
import { runPlcTestCases, ALL_XMLNS_NAMESPACES } from '@dialecte/plc/v1/test'
import type { PlcTest } from '@dialecte/plc/v1/test'

type TestCase = PlcTest.BaseXmlTestCase & {
	pouName: string
}

const testCases: PlcTest.TestCases<TestCase> = {
	'adds pou under pous → pou present in export': {
		sourceXml: `
			<project ${ALL_XMLNS_NAMESPACES}>
				<types>
					<pous/>
				</types>
			</project>
		`,
		pouName: 'MyFB',
		expectedQueries: ['//default:pous/default:pou[@name="MyFB"]'],
	},
}

async function act({ source, testCase }: PlcTest.ActParams<TestCase>): Promise<PlcTest.ActResult> {
	await source.document.transaction(async (tx) => {
		// perform mutations
	})
	return { assertOn: 'source' }
}

describe('addPou', () => {
	runPlcTestCases.withExport({ testCases, act })
})
```

After `act` returns, `runPlcTestCases.withExport` exports the chosen document and runs XPath assertions from `expectedQueries` / `unexpectedQueries`.

Use `runPlcTestCases.withoutExport` when no export is needed — `act` returns `Promise<void>`, XPath assertions are skipped.

---

## createPlcTestProject

Lower-level helper for tests that need manual control over intermediate assertions, multi-step verification, or transactions outside `runPlcTestCases`. Spins up a real in-memory `Project` with the source (and optionally target) file imported, and returns pre-opened documents.

```ts
async function createPlcTestProject(params: {
	sourceXml: string
	targetXml?: string
}): Promise<PlcTest.TestProjectResult>
```

The returned `TestProjectResult` shape:

```ts
{
	project: Plc.Project
	source: { documentId: string; document: Plc.Document }
	target?: { documentId: string; document: Plc.Document }
}
```

```ts
import {
	createPlcTestProject,
	ALL_XMLNS_NAMESPACES,
	CUSTOM_RECORD_ID_ATTRIBUTE,
} from '@dialecte/plc/v1/test'

const { project, source } = await createPlcTestProject({
	sourceXml: `
		<project ${ALL_XMLNS_NAMESPACES}>
			<types>
				<pous>
					<pou name="FB1" pouType="functionBlock" ${CUSTOM_RECORD_ID_ATTRIBUTE}="pou-1"/>
				</pous>
			</types>
		</project>
	`,
})

try {
	const root = await source.document.query.getRoot()
	const { pou: pous } = await source.document.query.findDescendants(root)
	expect(pous).toHaveLength(1)
} finally {
	await project.destroy()
}
```

Use `runPlcTestCases` when the test fits the standard source → act → assert shape. Use `createPlcTestProject` directly when:

- Asserting intermediate states between transactions
- Multiple exports at different stages

---

## createPlcTestRecord

Factory for typed in-memory records without a database. Useful for unit-testing pure functions that operate on `RawRecord` or `TrackedRecord`.

```ts
const record = createPlcTestRecord({
	record: { tagName: 'pou', attributes: { name: 'FB1', pouType: 'functionBlock' } },
})
```

---

## XML assertions

`assertExpectedElementQueries` and `assertUnexpectedElementQueries` run XPath assertions against an `XMLDocument`. Both use the PLC namespace map.

Use directly when calling `createPlcTestProject` and exporting manually via `project.export(documentId)`.

```ts
assertExpectedElementQueries({ xmlDocument, queries: ['//default:pous/default:pou[@name="FB1"]'] })
assertUnexpectedElementQueries({ xmlDocument, queries: ['//default:pou[@name="deleted"]'] })
```

---

## Stable record IDs with dev:db-id

`createPlcTestProject` always imports with `useCustomRecordsIds: true`. Any `dev:db-id` attribute in the XML becomes the actual database record ID — no lookups needed in `act`.

```xml
<types dev:db-id="types-1">
	<pous dev:db-id="pous-1">
		<pou name="FB1" pouType="functionBlock" dev:db-id="pou-1"/>
	</pous>
</types>
```

```ts
// Reference by stable ID directly
await tx.addChild(
	{ tagName: 'pous', id: 'pous-1' },
	{ tagName: 'pou', attributes: { name: 'NewFB', pouType: 'functionBlock' } },
)
```

Because `runPlcTestCases` exports with `withDatabaseIds: true`, XPath can assert by ID:

```ts
expectedQueries: ['//default:pous[@dev:db-id="pous-1"]/default:pou[@name="NewFB"]']
```

### Deterministic UUIDs for new elements

During `act`, `crypto.randomUUID` is replaced with a counter mock — IDs for newly created elements are `"0"`, `"1"`, `"2"`, ... in creation order. Setup always uses real UUIDs to avoid collisions between parallel tests.

---

## Namespace constants

| Constant                     | Value                                                        |
| ---------------------------- | ------------------------------------------------------------ |
| `XMLNS_PLC_NAMESPACE`        | `xmlns="www.iec.ch/public/TC65SC65BWG7TF10"`                 |
| `ALL_XMLNS_NAMESPACES`       | PLC namespace + dev namespace + xsi namespace combined       |
| `CUSTOM_RECORD_ID_ATTRIBUTE` | `dev:db-id="..."` — attribute string for use in XML fixtures |

```ts
const xml = `<project ${ALL_XMLNS_NAMESPACES}><types ${CUSTOM_RECORD_ID_ATTRIBUTE}="types-1"/></project>`
```

XPath queries against PLC documents must use the `default:` prefix for all element names (PLC uses a default namespace). Attributes don't need a prefix unless qualified (e.g. `dev:db-id`).

```ts
// ✗ fails silently — no prefix
expectedQueries: ['//pou[@name="FB1"]']

// ✓ correct
expectedQueries: ['//default:pou[@name="FB1"]']
```

---

## PlcTest type namespace

All types are bound to the PLC dialecte config via the `PlcTest` namespace:

| Type                        | Description                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `PlcTest.BaseTestCase`      | `{ only?: boolean }` - minimal base for non-XML tests (e.g. `runPlcTestCases.generic`)               |
| `PlcTest.BaseXmlTestCase`   | `BaseTestCase & { sourceXml, targetXml?, expectedQueries?, unexpectedQueries? }` - XML tests         |
| `PlcTest.TestCases<T>`      | `Record<string, T>` - key is the test description. Defaults to `BaseXmlTestCase`                     |
| `PlcTest.TestDocument`      | `{ documentId: string, document: Plc.Document }` - pre-opened document inside the test project       |
| `PlcTest.TestProjectResult` | `{ project, source: TestDocument, target?: TestDocument }` - returned by `createPlcTestProject`      |
| `PlcTest.TestRecord`        | Typed in-memory record shape — returned by `createPlcTestRecord`                                     |
| `PlcTest.ActParams<T>`      | `{ project, source, target?, testCase }` - passed to `act`                                           |
| `PlcTest.ActResult`         | `{ assertOn?: 'source' \| 'target', withDatabaseIds?: boolean }` - returned by `act` in `withExport` |
| `PlcTest.TestRunner`        | Runner type bound to PLC config                                                                      |

`TestCases<T>` accepts any type extending `BaseTestCase` - use `BaseTestCase` for non-XML generic tests, `BaseXmlTestCase` for XML round-trip tests:

```ts
// Non-XML test case (generic runner)
type MyCase = PlcTest.BaseTestCase & { input: number; expected: number }
const cases: PlcTest.TestCases<MyCase> = { ... }
runPlcTestCases.generic(cases, (testCase) => { ... })

// XML test case (withExport / withoutExport)
type MyXmlCase = PlcTest.BaseXmlTestCase & { pouName: string }
const cases: PlcTest.TestCases<MyXmlCase> = { ... }
runPlcTestCases.withExport({ testCases: cases, act })
```
