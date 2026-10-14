# What is PLC Dialecte?

`@dialecte/plc` is a **Dialecte implementation** for [IEC 61131-10](https://webstore.iec.ch/publication/4548) — the international standard for PLC programming software interoperability. It turns the PLCopen XML exchange format specification into a fully-typed DSL backed by IndexedDB, with a Document/Query/Transaction API.

If you haven't read it yet, [What is Dialecte?](https://dialecte.github.io/core/guide/introduction/what-is-dialecte) explains the general model. This page focuses on what `@dialecte/plc` adds on top.

## What PLCopen XML is

PLCopen XML is the XML format defined by IEC 61131-10 for exchanging PLC programs between engineering tools. A project file contains programs, function blocks, data types, and resource/task assignments. Files use the `.xml` extension and are governed by the IEC 61131-10 XSD schema.

PLCopen XML files are the exchange format for PLC code across vendors — enabling portability of structured text, ladder diagram, FBD, and SFC programs.

## What the dialecte provides

`@dialecte/plc` packages three PLC-specific layers on top of `@dialecte/core`:

### 1. Generated definition

The PLC definition is generated from the **IEC 61131-10 Ed1.0 XSD** by `@dialecte/create`. Every element, attribute, parent-child constraint and namespace declared in the standard is captured in a typed config object:

- a tag the schema declares several ways lists its declarations
- a value's facets sit in its datatype
- the content model and the identity fields sit on the declaration that declares them
- `TYPES` holds the types an element may take with `xsi:type`; the config carries it as `PLC_DIALECTE_CONFIG.types`

Read an element's definition through `query.getDefinition(ref)`: it returns the declaration that applies under the element's parent, and what the type it names with `xsi:type` lets it hold. Code that reads `DEFINITION` directly must handle the declarations itself.

```ts
import { createPlcProject } from '@dialecte/plc/v1'
```

### 2. Domain extensions

No extensions are bundled yet. Custom extensions can be added via the `extensions` parameter:

```ts
const project = await createPlcProject({
	extensions: { myFeature },
}).open('my-project')
```

### 3. IO

`project.import` accepts `.xml` files and streams them into IndexedDB. A PLCopen TC6 v201 file (root `project` in the namespace `http://www.plcopen.org/xml/tc6_0201`) is normalised to IEC 61131-10 before import by the bundled `beforeImport` hook; an IEC 61131-10 file is imported as is. `project.export` serializes back to IEC 61131-10 XML.

Supported file extensions: `.xml`
