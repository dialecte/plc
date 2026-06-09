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
import { createPlcProject } from '@dialecte/plc'

const project = await createPlcProject({ storage: { type: 'local' } }).open('my-project')
```

## Step 2 - Import a PLCopen XML file

`project.import` parses one or more PLCopen XML files and stores each one as a document in the project.

Supports `.xml`.

```ts
// Browser File object - e.g. from an <input type="file">
const [{ documentId }] = await project.import([plcFile])
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

Export back to PLCopen XML:

```ts
const [blob] = await project.export([documentId])
```
