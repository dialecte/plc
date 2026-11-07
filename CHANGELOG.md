# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## UNRELEASED

### Added

- **`PLC_DIALECTE`**, the PLC dialecte's declaration, from `@dialecte/plc/v1`: its id, the package's version, its config, its extensions and the import hook, declared once. `createPlcProject` and the test helpers are built from it.
- The project `createPlcProject` returns now carries `project.dialecteId` (`plc/v1`). `PlcTest.Helpers` and `PlcTest.TestProjectParams` in `@dialecte/plc/v1/test`.

### Changed

- **`createPlcTestProject` and `runPlcTestCases` now run plc's import hook**: a PLCopen TC6 v2.01 fixture is normalised to IEC 61131-10 form when the project imports it, as with `createPlcProject`. A fixture already in IEC form is unchanged. The schema check still reads a fixture as written, so it does not validate a TC6 fixture; export the document and pass it to `assertValidPlcXml` to check the normalised result.
- **The PLCopen TC6 v2.01 import normalisation no longer needs a browser**: it runs in node and in a worker as it does in a page, with the same output. Consumers install nothing new.
- **What counts as malformed follows the strict XML parser the import itself uses**: a refused file's message after `TC6 v201 parse error: ` is that parser's own, and the prefix stays. Some malformed input a browser's parser refused is now accepted, and some it accepted is now refused: a name holding a character at or above U+10000 (in an element or attribute a vendor adds) is refused with `TC6 v201 parse error: `. A `<parsererror>` element in a file no longer makes the file refused: it is read like any other element.
- **A file is normalised only when its root element is a TC6 v2.01 `project`**, as a deliberate behaviour change: a TC6 `project` under another root is left as it is (it was converted). The detection reads the root's start tag only, so its cost no longer grows with the file: on a 50 MB IEC 61131-10 file, from seconds to under a millisecond per import. A text whose root is not a TC6 `project` is left to the import, whose parser reports what is malformed in it.
- **A file whose DOCTYPE holds an internal subset is now refused** with `TC6 v201 parse error: `, even an empty subset, as a deliberate behaviour change: it was expanded before. A bare `<!DOCTYPE project>` is still ignored.

### Fixed

- **A PLC document holding a TC6 v2.01 `project` as data** (for example in an `AddData` block) is no longer replaced by an empty project on import. When a processing instruction closing with `??>` comes before its root, the import now refuses the file instead: the XML parser the import uses misreads such an instruction.
- An LD element named like a built-in object key (`constructor`, `toString`, `__proto__`) is skipped like any other unmapped LD element; it used to come out as an `LdObject`.

## [0.3.2] - 2026-11-05

### Changed

- Requires `@dialecte/core` 0.8.1 (pinned exactly, was 0.8.0). Nothing changes in the engine; the core skills an agent syncs from this package's dependencies are 0.8.1's.

## [0.3.1] - 2026-11-04

### Changed

- **The repository's tooling runs on `@dialecte/cli` 0.3.1** (nothing changes for a consumer): the package declares the contributor profile, so the docs build and the type bench run in `dialecte contrib` instead of the gate; the tests run with the runner's defaults; the commit hook checks types, lint and format (`npm run check`, no longer `format:fix`), runs the tests through `dialecte gate --hook` (answered by a green `gate --full` of the committed tree), then builds.

## [0.3.0] - 2026-11-02

### Changed

- **Breaking:** requires `@dialecte/core` 0.8.0.
- **Breaking: the `Project` that `createPlcProject` returns follows `@dialecte/core` 0.7 and 0.8 on import and close** (this release moves from core 0.6.1). `project.import(files)` returns one entry per file, in the order given (`{ status: 'imported', fileName, documentId, recordCount, diagnostics }` or `{ status: 'failed', fileName, error }`), and no longer rejects for one file: the next file is still imported. `project.importFile(file)` is new: it imports one file and returns it, or throws what failed (`PARSE_ERROR` for a malformed file; plc's PLCopen TC6 v201 normalisation failing on a file comes out as `IMPORT_FAILED`, its `Error` as the `cause`). A caller that read `(await project.import([file]))[0].documentId` calls `project.importFile(file)`. `project.close()` returns a promise.
- **Breaking: the `Project` that `createPlcProject` returns exports with one object, as `@dialecte/core` 0.8.0 does.** `project.export({ documentId, indent?, withDatabaseIds?, xmlDocument?, download? })` returns `{ file, filename }`, `file` the XML as a `Blob` (`await file.text()` reads it), and `xmlDocument` too when asked - in a browser only, the DOM parsed in the page; it was `project.export(documentId, { withDatabaseIds, withDownload })` returning `{ xmlDocument, filename }`. `project.exportBlob({ blobId, download? })` returns `{ entry, data, filename }`, `data` the blob; it was `project.exportBlob(blobId, { withDownload })`.
- **Breaking (`@dialecte/plc/v1/test`): `assertValidPlcXml` takes one object**, `assertValidPlcXml({ xml, label?, requireComplete? })` (was `assertValidPlcXml(xml, label?, { requireComplete? })`). Text that is not well-formed fails as `<label>: malformed XML - <line>:<column> <reason>`.
- **Breaking (`@dialecte/plc/v1/test`): `assertExpectedElementQueries` and `assertUnexpectedElementQueries` take XML text only**, `{ xml, queries }` (was `{ xmlDocument, queries }`). A caller holding a project exports the document with `project.export({ documentId })` and passes `await file.text()`. All the XML assertions read XML with libxml2, the same in node and in a browser.
- **The test helpers need no browser; this package's tests run in node by default.** `createPlcTestProject` and `runPlcTestCases` open their projects on the store the test runner chose, without plc's import hook, and a project opened inside a running test is destroyed when that test ends. A consumer runs its PLC tests in node by giving its node test project a setup file that calls core's `useTestStorage({ type: 'inMemory' })`; a test that imports a file through plc's hook (the PLCopen TC6 v201 normalisation) still needs a browser. Here, `npm test` runs every unit test in node on the in-memory store (the `node` project), then the browser-only list in Chromium (`browser`: the import hook's test); `npm run test:browser:all` runs the whole suite in Chromium (`browser-all`), as a pull request does. The tiers are on the test helpers page (Test tiers of this package).

## [0.2.1] - 2026-10-14

### Changed

- Requires `@dialecte/core` 0.6.1: `assertValidPlcXml`, `runPlcTestCases` and `createPlcTestProject` check the attributes of every namespace and allow what an element's attribute wildcard allows - a fixture carrying an attribute its element does not declare now fails.

## [0.2.0] - 2026-10-14

### Changed

- **Breaking - built on `@dialecte/core` 0.6 and the definitions `@dialecte/create` 0.1 writes** (`v1` and `tc6-v201`). `DEFINITION` has the new shape: a tag declared several ways lists its declarations, a value's facets sit in its datatype, identity constraints sit on the declaration that declares them, and `TYPES` holds the types an element may take with `xsi:type`. `PLC_DIALECTE_CONFIG` (`v1`) carries `types`. Code that reads `DEFINITION` directly must follow; code that goes through `query.getDefinition` gets the declaration that applies.
- **Breaking (types): an element that may take another type with `xsi:type` is a union on `'xsi:type'`**, one named member per type (`AttributesFbdObject_Block`, ...). An attribute only one type declares is typed on that member: filter or write with the type, `findByAttributes({ tagName: 'FbdObject', attributes: { 'xsi:type': 'Block', instanceName } })`.

## [0.1.1] - 2026-09-29

### Added

- `runPlcTestCases` and `createPlcTestProject` check every fixture against the PLC schema before running; `assertValidPlcXml` is exported for your own checks.

## [0.1.0] - 2026-09-29

### Added

- The definitions describe types and structure: `type` on attributes and text, `contentModel`, `nillable`, `anyNamespace`, text `default` / `fixed`.
- The attributes of an element as declared under each parent: `Plc.AttributesOf<'Address', 'Member'>`.

### Changed

- Requires `@dialecte/core` 0.5.1.

### Removed

- `children.choices` from the definitions: read the `choice` nodes of `contentModel`.

### Fixed

- An element declared several times with different content (`variable`, a structure under `struct` and a bare text under `coil`) is no longer typed as its first declaration.

## [0.0.19] - 2026-07-27

- Bump `@dialecte/core` to `0.4.9`

## [0.0.18] - 2026-07-23

- Bump `@dialecte/core` to `0.4.7`

## [0.0.17] - 2026-07-22

- Bump `@dialecte/core` to `0.4.6` - ExtendedDocument

## [0.0.16] - 2026-07-21

### Changed

- Bump `@dialecte/core` to `0.4.5`

## [0.0.15] - 2026-07-09

### Changed

- Bump `@dialecte/core` to `0.4.2`
- Update to typescript 7

## [0.0.14] - 2026-07-07

### Changed

- Bump `@dialecte/core` to `0.4.0`

## [0.0.13] - 2026-07-06

### Changed

- Bump `@dialecte/core` to `0.3.0`. Hooks are now provided on the `Project` instance instead of the config: `createPlcProject` passes `hooks: IO_HOOKS` and `PLC_IO_CONFIG` no longer carries them. Consumer usage is unchanged. Importing a file now standardizes each record via core — canonical attribute order/names and filled required attributes.

## [0.0.12] - 2026-06-30

### Fixed

TC6 v201 import now produces XSD-valid IEC 61131-10 output for several cases caught by validating against the FDIS schema:

- `Project/@schemaVersion` is stamped with the IEC schema version (`1.0`) instead of being copied empty.
- `creationDateTime` is emitted on `ContentHeader` (where it is required) rather than `FileHeader` (where it is forbidden); `FileHeader`/`ContentHeader` are always present with their required attributes.
- Parameter-set variables (`InputVars`/`OutputVars`/`InoutVars`) carry the required `orderWithinParamSet`.
- `Vars` carries the required `accessSpecifier`.
- Comment text is emitted as `Content` element text rather than a non-schema `value` attribute.

## [0.0.11] - 2026-06-30

### Fixed

- TC6 v201 import now maps `inVariable`/`outVariable` to `DataSource`/`DataSink` with a `ConnectionPointOut`/`ConnectionPointIn` directly on the `FbdObject` instead of an `OutputVariables`/`InputVariables` wrapper, matching the IEC 61131-10 XSD (those wrappers are valid only on `xsi:type="Block"`).

## [0.0.10] - 2026-06-29

- Bump `@dialecte/core` to `0.2.22` - fix withAllExtensions

## [0.0.9] - 2026-06-29

- Bump `@dialecte/core` to `0.2.21` - add `snapshots`

## [0.0.8] - 2026-06-26

### Added

- Type-performance CI gates (`type-bench:check` + `type-narrowing`) via `@dialecte/cli`, scoped to the `v1` definition, with benchmarks under `benchmarks/types/v1/`.

### Changed

- Build now externalizes `dexie` alongside `@dialecte/core` (no longer bundled).

## [0.0.7] - 2026-06-11

### Fixed

- test utils namespace

## [0.0.6] - 2026-06-10

### Fixed

- extensions import path after introducing versioning

## [0.0.5] - 2026-06-10

### Added

- dialecte test utils
- io hooks : upgrade from TC6v201 to IEC61131-10

### Changed

- `io-hooks.ts`: `IEC_NS` and `XSI_NS` now derive from `PLC_NAMESPACES` instead of hardcoded strings
- `io-hooks.test.ts`: same - imports `PLC_NAMESPACES` from `@/v1/config/namespaces`
- `tsconfig.vitest.json`: `lib` fixed from `[]` to `["DOM", "DOM.Iterable", "ESNext"]` - restores browser globals (`DOMParser`, `XMLDocument`, etc.) for test files

## [0.0.4] - 2026-06-09

### Fixed

- Change namespace in test utils

## [0.0.3] - 2026-06-09

### Added

- Test utils

## [0.0.2] - 2026-06-09

### Fixed

- Added missing elements to the definition, after updating the generation script

## [0.0.1] - 2026-06-08

### Added

- Dialecte initialization
