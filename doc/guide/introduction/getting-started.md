# Getting Started

## Installation

::: code-group

```sh [npm]
$ npm i @dialecte/plc
```

```sh [pnpm]
$ pnpm add @dialecte/plc
```

:::

## Step 1 - Create a project

`createPlcProject` returns a [`Project`](https://dialecte.github.io/core/api/project) pre-configured with the PLC config and extensions. Call `.open(name)` to initialize storage and hydrate state.

```ts
import { createPlcProject } from '@dialecte/plc/v1'

const project = await createPlcProject({ storage: { type: 'local' } }).open('my-project')
```

`createPlcProject` is `@dialecte/core`'s project factory for the PLC declaration: `createPlcProject.destroyProject({ name, storage })` deletes a PLC project of that name without opening it, and `createPlcProject.dialecte` is `PLC_DIALECTE`.

### On SQLite storage

A project on `{ type: 'sqlite' }` runs in the app's engine worker, which the app assembles from `@dialecte/core/sqlite`: one worker file serving every dialecte the app uses, and one call in the page, before the first project, that tells where it is. This package ships no worker.

```ts
// the app's engine worker file, e.g. src/engine.worker.ts
import { serveSqliteEngine } from '@dialecte/core/sqlite'
import { PLC_DIALECTE } from '@dialecte/plc/v1'

serveSqliteEngine({ dialectes: [PLC_DIALECTE] })
```

```ts
import engineUrl from './engine.worker?worker&url'

// the page
import { registerSqliteEngine } from '@dialecte/core/sqlite'
import { createPlcProject, PLC_DIALECTE } from '@dialecte/plc/v1'

registerSqliteEngine({ url: engineUrl, dialectes: [PLC_DIALECTE] })
const project = await createPlcProject({ storage: { type: 'sqlite' } }).open('my-project')
```

## Step 2 - Import a PLCopen XML file

`project.importFile` parses a PLCopen XML file and stores it as a document in the project; its result carries the new document's `documentId`.

Supports `.xml`. A PLCopen TC6 v201 file is normalised to IEC 61131-10 on import, the same in a page, a worker and node.

```ts
// Browser File object - e.g. from an <input type="file">
const { documentId } = await project.importFile(plcFile)
```

## Step 3 - Open a document

Once a file is imported, get a per-file `Document` for queries and mutations:

```ts
const doc = project.openDocument(documentId)
```

## Step 4 - Query the tree

Use `doc.query` to read records:

```ts
const root = await doc.query.getRoot()

// Find all FunctionBlock elements
const { FunctionBlock: fbs } = await doc.query.findDescendants(root)

for (const fb of fbs) {
	const { name } = await doc.query.getAttributes(fb)
	console.log(fb.id, name)
}
```

## Step 5 - Mutate the tree

Mutations happen inside a `transaction`. All operations are staged and committed atomically:

```ts
await doc.transaction(async (tx) => {
	await tx.update(ref, { attributes: { name: 'MyUpdatedFB' } })
})
```

## Step 6 - Export

`project.export` writes a document back to a PLCopen XML file: `file` is the XML as a `Blob` (`await file.text()` reads it), `filename` its name. Pass `download: true` to save it as well (the save dialog where the browser has one, a download otherwise).

```ts
const { file, filename } = await project.export({ documentId })
```
