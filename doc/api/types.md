---
description: Types reference for @dialecte/plc - pre-bound generics from @dialecte/core.
---

# Types

`@dialecte/plc` exports a `Plc` namespace that re-exports every `@dialecte/core` generic pre-applied to the PLC config. Import it once; use across your entire codebase without repeating the config type argument.

```ts
import type { Plc } from '@dialecte/plc'

function processProgram(record: Plc.TrackedRecord<'Program'>) { ... }
```

## Type table

| Type                             | Core equivalent                           | Description                                                                                        |
| -------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `Plc.Query`                      | `Core.Query<Config>`                      | Read-only accessor. Passed as first arg to query extensions.                                       |
| `Plc.Transaction`                | `Core.Transaction<Config>`                | Staged mutation accessor. Also extends `Query` - all read methods are available.                   |
| `Plc.Context`                    | `Core.Context<Config>`                    | Raw DB handle, used when writing low-level hooks or standalone utilities.                          |
| `Plc.ElementsOf`                 | `Core.ElementsOf<Config>`                 | String union of all 66+ element tag names (`'Project' \| 'FileHeader' \| 'FunctionBlock' \| ...`). |
| `Plc.Ref<E>`                     | `Core.Ref<Config, E>`                     | Lightweight stable reference to a record.                                                          |
| `Plc.TrackedRecord<E>`           | `Core.TrackedRecord<Config, E>`           | A persisted record as returned by query methods.                                                   |
| `Plc.RawRecord<E>`               | `Core.RawRecord<Config, E>`               | Record shape without DB tracking - used in hooks and before-persist operations.                    |
| `Plc.TreeRecord<E>`              | `Core.TreeRecord<Config, E>`              | Record with its full subtree inlined. Produced by `query.getTree()`.                               |
| `Plc.AttributesValueObjectOf<E>` | `Core.AttributesValueObjectOf<Config, E>` | Plain object of attribute name to value for element `E`.                                           |
| `Plc.AttributesOf<E>`            | `Core.AttributesOf<Config, E>`            | Union of valid attribute name strings for element `E`.                                             |
| `Plc.ChildrenOf<E>`              | `Core.ChildrenOf<Config, E>`              | Union of element tag names that may appear as direct children of `E`.                              |
| `Plc.ParentsOf<E>`               | `Core.ParentsOf<Config, E>`               | Union of element tag names that may be a direct parent of `E`.                                     |
| `Plc.DescendantsOf<E>`           | `Core.DescendantsOf<Config, E>`           | All element tag names transitively reachable as descendants of `E`.                                |
| `Plc.AncestorsOf<E>`             | `Core.AncestorsOf<Config, E>`             | All element tag names that can appear as ancestors of `E`.                                         |
| `Plc.RootElementOf`              | `Core.RootElementOf<Config>`              | The root element tag name - `'Project'`.                                                           |
| `Plc.Operation`                  | `Core.Operation<Config>`                  | A single staged DB operation (insert, update, delete).                                             |

## How types stay in sync with core

Each alias is defined in `src/config/hydrated.types.ts` as:

```ts
export namespace Plc {
	export type Query = Core.Query<Config>
	export type TrackedRecord<E extends ElementsOf> = Core.TrackedRecord<Config, E>
	// ...
}
```

The `Config` type is derived from `PLC_DIALECTE_CONFIG` which is generated from the IEC 61131-10 XSD - so the types update automatically whenever the definition is regenerated.
