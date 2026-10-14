---
description: Types reference for @dialecte/plc - pre-bound generics from @dialecte/core.
---

# Types

`@dialecte/plc` exports a `Plc` namespace that re-exports every `@dialecte/core` generic pre-applied to the PLC config. Import it once; use across your entire codebase without repeating the config type argument.

```ts
import type { Plc } from '@dialecte/plc/v1'

function processProgram(record: Plc.TrackedRecord<'Program'>) { ... }
```

## Type table

| Type                                     | Core equivalent                                             | Description                                                                                                                                                |
| ---------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Plc.Project<Custom>`                    | `Core.Project<Config, Extensions & Custom>`                 | Project instance returned by `createPlcProject().open()`. `Custom` is the extension modules passed to `createPlcProject`.                                  |
| `Plc.Document`                           | `Core.Document<Config, Extensions>`                         | Per-file accessor returned by `project.openDocument()`.                                                                                                    |
| `Plc.ExtendedDocument<Custom>`           | `Core.ExtendedDocument<Config, Modules & Custom>`           | Document carrying the custom extension modules.                                                                                                            |
| `Plc.Query`                              | `Core.Query<Config> & Core.QueryExtensions<Extensions>`     | Read-only accessor. Passed as first arg to query extensions.                                                                                               |
| `Plc.Transaction`                        | `Core.Transaction<Config> & Core.AllExtensions<Extensions>` | Staged mutation accessor. Also extends `Query` - all read methods are available.                                                                           |
| `Plc.TransactionHooks`                   | `Core.TransactionHooks<Config>`                             | Hook definitions for before/after transaction lifecycle events.                                                                                            |
| `Plc.Context`                            | `Core.Context<Config>`                                      | Raw DB handle, used when writing low-level hooks or standalone utilities.                                                                                  |
| `Plc.ElementsOf`                         | `Core.ElementsOf<Config>`                                   | String union of all 105 element tag names (`'Project' \| 'FileHeader' \| 'FunctionBlock' \| ...`).                                                         |
| `Plc.SingletonElementsOf`                | `Core.SingletonElementsOf<Config>`                          | Subset of `ElementsOf` for elements that may only appear once per document.                                                                                |
| `Plc.Ref<E>`                             | `Core.Ref<Config, E>`                                       | Lightweight stable reference to a record.                                                                                                                  |
| `Plc.TrackedRecord<E>`                   | `Core.TrackedRecord<Config, E>`                             | A persisted record as returned by query methods.                                                                                                           |
| `Plc.RawRecord<E>`                       | `Core.RawRecord<Config, E>`                                 | Record shape without DB tracking - used in hooks and before-persist operations.                                                                            |
| `Plc.TreeRecord<E>`                      | `Core.TreeRecord<Config, E>`                                | Record with its full subtree inlined. Produced by `query.getTree()`.                                                                                       |
| `Plc.AttributesValueObjectOf<E, Parent>` | `Core.AttributesValueObjectOf<Config, E, Parent>`           | Plain object of attribute name to value for element `E` - as declared under `Parent` when one is named. A union on `'xsi:type'` where `E` may name a type. |
| `Plc.FullAttributeObjectOf<E>`           | `Core.FullAttributeObjectOf<Config, E>`                     | Full attribute object including optional fields for element `E`.                                                                                           |
| `Plc.AttributesOf<E, Parent>`            | `Core.AttributesOf<Config, E, Parent>`                      | Union of valid attribute name strings for element `E` - as declared under `Parent` when one is named.                                                      |
| `Plc.ChildrenOf<E>`                      | `Core.ChildrenOf<Config, E>`                                | Union of element tag names that may appear as direct children of `E`.                                                                                      |
| `Plc.ParentsOf<E>`                       | `Core.ParentsOf<Config, E>`                                 | Union of element tag names that may be a direct parent of `E`.                                                                                             |
| `Plc.DescendantsOf<E>`                   | `Core.DescendantsOf<Config, E>`                             | All element tag names transitively reachable as descendants of `E`.                                                                                        |
| `Plc.AncestorsOf<E>`                     | `Core.AncestorsOf<Config, E>`                               | All element tag names that can appear as ancestors of `E`.                                                                                                 |
| `Plc.RootElementOf`                      | `Core.RootElementOf<Config>`                                | The root element tag name - `'Project'`.                                                                                                                   |
| `Plc.ParentRelationship<E>`              | `Core.ParentRelationship<Config, E>`                        | Typed parent relationship descriptor for element `E`.                                                                                                      |
| `Plc.ChildRelationship<E>`               | `Core.ChildRelationship<Config, E>`                         | Typed child relationship descriptor for element `E`.                                                                                                       |
| `Plc.Attribute<E>`                       | `Core.Attribute<Config, E>`                                 | A single attribute name-value pair for element `E`.                                                                                                        |
| `Plc.QualifiedAttribute<E>`              | `Core.QualifiedAttribute<Config, E>`                        | Attribute with namespace qualification for element `E`.                                                                                                    |
| `Plc.Operation`                          | `Core.Operation<Config>`                                    | A single staged DB operation (insert, update, delete).                                                                                                     |
| `Plc.CloneMapping`                       | `Core.CloneMapping<Config>`                                 | Mapping of original record IDs to cloned record IDs, produced by `tx.clone()`.                                                                             |

`Parent` is optional: without it, `AttributesValueObjectOf` and `AttributesOf` give the tag-level type.

## Elements that take a type with `xsi:type`

An element the schema lets take another type with `xsi:type` has a union attribute type, one member per type: `Attributes<Tag>_<type>` for each type it may name, `Attributes<Tag>_Own` for the element's own attributes (`AttributesFbdObject_Block`, `AttributesFbdObject_DataSource`, `AttributesAddress_Own`, ...). Each member carries the attributes its type declares, so an attribute only one type declares exists on that member alone. `Plc.AttributesValueObjectOf<'FbdObject'>` is that union.

`FbdObject` typed `Block` declares `typeName` and `instanceName`; typed `DataSink` it declares `identifier` instead. Write with the type - the member then allows its attributes:

```ts
await tx.addChild(network, {
	tagName: 'FbdObject',
	attributes: { 'xsi:type': 'Block', typeName: 'TON', instanceName: 'Timer1' },
})
```

A filter may leave the type out and match across types, or name it to narrow:

```ts
// only the Block objects named Timer1
await doc.query.findByAttributes({
	tagName: 'FbdObject',
	attributes: { 'xsi:type': 'Block', instanceName: 'Timer1' },
})

// every FbdObject with that globalId, whatever its type
await doc.query.findByAttributes({
	tagName: 'FbdObject',
	attributes: { globalId: 'g-1' },
})
```

## Attributes as declared under a parent

A tag the schema declares several ways has one attribute type per declaration. `AttributesOf` and `AttributesValueObjectOf` take the parent as second parameter to pick the declaration under it:

```ts
// the tag-level type: a union, 'xsi:type' may name AddressExpression
type AnyAddress = Plc.AttributesValueObjectOf<'Address'>

// under Member: a fixed address, no 'xsi:type' key
type AddressInMember = Plc.AttributesValueObjectOf<'Address', 'Member'>
// { address?: string; globalId?: string; location?: ...; notYetFixed?: string; pragma?: string; size?: ... }

type AddressInMemberNames = Plc.AttributesOf<'Address', 'Member'>
// 'address' | 'globalId' | 'location' | 'notYetFixed' | 'pragma' | 'size'
```

## How types stay in sync with core

Each alias is defined in `src/v1/config/hydrated.types.ts` as:

```ts
export namespace Plc {
	export type Query = Core.Query<Config> & Core.QueryExtensions<PlcExtensions>
	export type TrackedRecord<E extends ElementsOf> = Core.TrackedRecord<Config, E>
	// ...
}
```

The `Config` type is derived from `PLC_DIALECTE_CONFIG`, which `@dialecte/create` generates from the IEC 61131-10 XSD - so the types update automatically whenever the definition is regenerated.
