---
description: Test helpers for @dialecte/plc v1 — createPlcTestProject, runPlcTestCases, fixture validation, XML assertions, and namespace constants.
---

# Test Helpers

`@dialecte/plc` ships a test entry point with PLC-specific utilities. Import from `@dialecte/plc/v1/test`:

```ts
import {
	runPlcTestCases,
	createPlcTestProject,
	createPlcTestRecord,
	assertValidPlcXml,
	assertExpectedElementQueries,
	assertUnexpectedElementQueries,
	XMLNS_PLC_NAMESPACE,
	ALL_XMLNS_NAMESPACES,
	CUSTOM_RECORD_ID_ATTRIBUTE,
	CUSTOM_RECORD_ID_ATTRIBUTE_NAME,
} from '@dialecte/plc/v1/test'
```

All helpers are wired to the PLC config internally — no config argument needed.

Fixtures are IEC 61131-10 XML: the root is `Project`, POUs sit under `Types > GlobalNamespace` (`FunctionBlock`, `Program`, `Function`, ...). Every fixture is checked against the schema before it runs — see [Fixture validation](#fixture-validation).

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

type TestCase = PlcTest.BaseXmlTestCase & {
	expectedCount: number
}

const testCases: PlcTest.TestCases<TestCase> = {
	'no FunctionBlock → empty array': {
		sourceXml: `<Project schemaVersion="1.0" ${ALL_XMLNS_NAMESPACES} ${CUSTOM_RECORD_ID_ATTRIBUTE}="project-1"/>`,
		expectedCount: 0,
	},
	'two FunctionBlock → count 2': {
		sourceXml: `
			<Project schemaVersion="1.0" ${ALL_XMLNS_NAMESPACES}>
				<Types>
					<GlobalNamespace ${CUSTOM_RECORD_ID_ATTRIBUTE}="ns-1">
						<FunctionBlock name="FB1" ${CUSTOM_RECORD_ID_ATTRIBUTE}="fb-1"/>
						<FunctionBlock name="FB2" ${CUSTOM_RECORD_ID_ATTRIBUTE}="fb-2"/>
					</GlobalNamespace>
				</Types>
			</Project>
		`,
		expectedCount: 2,
	},
}

async function act({ source, testCase }: PlcTest.ActParams<TestCase>): Promise<void> {
	const root = await source.document.query.getRoot()
	const { FunctionBlock: functionBlocks } = await source.document.query.findDescendants(root)
	expect(functionBlocks).toHaveLength(testCase.expectedCount)
}

describe('getFunctionBlocks', () => {
	runPlcTestCases.withoutExport({ testCases, act })
})
```

### Scenario 2 - XML export assertions (act returns ActResult)

Use when `act` performs transactions and assertions must run on the exported XML via XPath. `act` returns an optional `ActResult` to choose which document to assert on (defaults to `source`) and toggle `withDatabaseIds`.

```ts
import { describe } from 'vitest'
import {
	runPlcTestCases,
	ALL_XMLNS_NAMESPACES,
	CUSTOM_RECORD_ID_ATTRIBUTE,
} from '@dialecte/plc/v1/test'
import type { PlcTest } from '@dialecte/plc/v1/test'

type TestCase = PlcTest.BaseXmlTestCase & {
	functionBlockName: string
}

const testCases: PlcTest.TestCases<TestCase> = {
	'adds FunctionBlock under GlobalNamespace → FunctionBlock present in export': {
		sourceXml: `
			<Project schemaVersion="1.0" ${ALL_XMLNS_NAMESPACES}>
				<Types>
					<GlobalNamespace ${CUSTOM_RECORD_ID_ATTRIBUTE}="ns-1"/>
				</Types>
			</Project>
		`,
		functionBlockName: 'MyFB',
		expectedQueries: ['//default:GlobalNamespace/default:FunctionBlock[@name="MyFB"]'],
	},
}

async function act({ source, testCase }: PlcTest.ActParams<TestCase>): Promise<PlcTest.ActResult> {
	await source.document.transaction(async (tx) => {
		await tx.addChild(
			{ tagName: 'GlobalNamespace', id: 'ns-1' },
			{ tagName: 'FunctionBlock', attributes: { name: testCase.functionBlockName } },
		)
	})
	return { assertOn: 'source' }
}

describe('addFunctionBlock', () => {
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
		<Project schemaVersion="1.0" ${ALL_XMLNS_NAMESPACES}>
			<Types>
				<GlobalNamespace>
					<FunctionBlock name="FB1" ${CUSTOM_RECORD_ID_ATTRIBUTE}="fb-1"/>
				</GlobalNamespace>
			</Types>
		</Project>
	`,
})

try {
	const root = await source.document.query.getRoot()
	const { FunctionBlock: functionBlocks } = await source.document.query.findDescendants(root)
	expect(functionBlocks).toHaveLength(1)
} finally {
	await project.destroy()
}
```

Use `runPlcTestCases` when the test fits the standard source → act → assert shape. Use `createPlcTestProject` directly when:

- Asserting intermediate states between transactions
- Multiple exports at different stages

---

## Fixture validation

`runPlcTestCases.withExport`, `runPlcTestCases.withoutExport` and `createPlcTestProject` check every fixture (`sourceXml`, `targetXml`) against the PLC schema before anything runs. A mistyped tag, a wrong namespace or an unknown attribute fails loudly — the runners report every invalid case at once — instead of the suite quietly testing something else.

The check is structural:

- every element's namespace matches its parent context
- every element is an allowed child of its parent
- every attribute is one its element declares, in whatever namespace the package declares, or one the element's attribute wildcard allows

`xmlns` declarations, `xsi:*` attributes and `dev:db-id` are always allowed. Elements unknown to the schema, and elements in a namespace the package does not declare, are skipped.

Required attributes are not required there: the runners and `createPlcTestProject` pass `requireComplete: false`, so a minimal fixture may leave them out (`<Project>` without `schemaVersion`).

### assertValidPlcXml

The same check, for your own fixtures. Throws when the XML is not valid PLC.

```ts
import { assertValidPlcXml } from '@dialecte/plc/v1/test'

assertValidPlcXml(xml)
assertValidPlcXml(xml, 'targetXml', { requireComplete: false })
```

| Parameter                 | Description                                                                 |
| ------------------------- | --------------------------------------------------------------------------- |
| `xml`                     | The document to check                                                       |
| `label`                   | Names the document in the error message. Optional.                          |
| `options.requireComplete` | Also require every schema-required attribute to be present. Default `true`. |

---

## createPlcTestRecord

Factory for typed in-memory records without a database. Useful for unit-testing pure functions that operate on `RawRecord` or `TrackedRecord`.

```ts
const record = createPlcTestRecord({
	record: { tagName: 'FunctionBlock', attributes: { name: 'FB1' } },
})
```

---

## XML assertions

`assertExpectedElementQueries` and `assertUnexpectedElementQueries` run XPath assertions against an `XMLDocument`. Both use the PLC namespace map.

Use directly when calling `createPlcTestProject` and exporting manually via `project.export(documentId)`.

```ts
assertExpectedElementQueries({
	xmlDocument,
	queries: ['//default:GlobalNamespace/default:FunctionBlock[@name="FB1"]'],
})
assertUnexpectedElementQueries({
	xmlDocument,
	queries: ['//default:FunctionBlock[@name="deleted"]'],
})
```

---

## Stable record IDs with dev:db-id

`createPlcTestProject` always imports with `useCustomRecordsIds: true`. Any `dev:db-id` attribute in the XML becomes the actual database record ID — no lookups needed in `act`.

```xml
<Types dev:db-id="types-1">
	<GlobalNamespace dev:db-id="ns-1">
		<FunctionBlock name="FB1" dev:db-id="fb-1"/>
	</GlobalNamespace>
</Types>
```

```ts
// Reference by stable ID directly
await tx.addChild(
	{ tagName: 'GlobalNamespace', id: 'ns-1' },
	{ tagName: 'FunctionBlock', attributes: { name: 'NewFB' } },
)
```

Because `runPlcTestCases` exports with `withDatabaseIds: true`, XPath can assert by ID:

```ts
expectedQueries: [
	'//default:GlobalNamespace[@dev:db-id="ns-1"]/default:FunctionBlock[@name="NewFB"]',
]
```

### Deterministic UUIDs for new elements

During `act`, `crypto.randomUUID` is replaced with a counter mock — IDs for newly created elements are `"0"`, `"1"`, `"2"`, ... in creation order. Setup always uses real UUIDs to avoid collisions between parallel tests.

---

## Namespace constants

| Constant                          | Value                                                        |
| --------------------------------- | ------------------------------------------------------------ |
| `XMLNS_PLC_NAMESPACE`             | `xmlns="www.iec.ch/public/TC65SC65BWG7TF10"`                 |
| `ALL_XMLNS_NAMESPACES`            | PLC namespace + dev namespace + xsi namespace combined       |
| `CUSTOM_RECORD_ID_ATTRIBUTE`      | `dev:db-id="..."` — attribute string for use in XML fixtures |
| `CUSTOM_RECORD_ID_ATTRIBUTE_NAME` | `db-id` — the attribute's local name                         |

```ts
const xml = `<Project schemaVersion="1.0" ${ALL_XMLNS_NAMESPACES}><Types ${CUSTOM_RECORD_ID_ATTRIBUTE}="types-1"/></Project>`
```

XPath queries against PLC documents must use the `default:` prefix for all element names (PLC uses a default namespace). Attributes don't need a prefix unless qualified (e.g. `dev:db-id`).

```ts
// ✗ fails silently — no prefix
expectedQueries: ['//FunctionBlock[@name="FB1"]']

// ✓ correct
expectedQueries: ['//default:FunctionBlock[@name="FB1"]']
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
type MyXmlCase = PlcTest.BaseXmlTestCase & { functionBlockName: string }
const cases: PlcTest.TestCases<MyXmlCase> = { ... }
runPlcTestCases.withExport({ testCases: cases, act })
```
