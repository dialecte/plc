# Plc public-type readability audit

Every public method (resolved param + return — the form an editor shows when you hover a call)
and every namespace type is rendered with NoTruncation, then measured. Methods are discovered
dynamically (Query/Transaction/Document/Project incl. extension groups), so this covers core's
classes AND the dialect's extensions. Rows sorted worst-first.

**Columns** — `len`: characters in the render (proxy for hover size; bigger = noisier).
`members`: element-union members surfaced. `causes`: matched root cause(s) (legend below).

**Root-cause legend**

- **C1 module-noise** — `import("…/extensions/…")` refs inflate the render. Fix: name containers / annotate returns.
- **C2/C4 element-union** — the full element-name union appears. Largely inherent to a config-driven DSL.
- **C3 wide-input-union** — a wide multi-member input union, each member expanded.
- **C5 record-seam** — a record renders as `RawRecord<…> & { status }` instead of one clean object.
- **C6 recursive** — self-referential `TreeRecord`/`TreeSelect`.

## Methods — resolved param/return (105 methods discovered)

| Member                                      | len     | members | causes                          |
| ------------------------------------------- | ------- | ------- | ------------------------------- |
| q.findDescendants(…) → return               | 568,288 | 0       | C1 module-noise                 |
| tx.findDescendants(…) → return              | 568,288 | 0       | C1 module-noise                 |
| doc.query.findDescendants(…) → return       | 568,288 | 0       | C1 module-noise                 |
| q.findByAttributes(…) param                 | 306,091 | 1       | C1 module-noise                 |
| tx.findByAttributes(…) param                | 306,091 | 1       | C1 module-noise                 |
| doc.query.findByAttributes(…) param         | 306,091 | 1       | C1 module-noise                 |
| q.getRecords(…) → return                    | 284,158 | 0       | C1 module-noise                 |
| tx.getRecords(…) → return                   | 284,158 | 0       | C1 module-noise                 |
| doc.query.getRecords(…) → return            | 284,158 | 0       | C1 module-noise                 |
| q.getRecords(…) param                       | 284,156 | 0       | C1 module-noise                 |
| tx.getRecords(…) param                      | 284,156 | 0       | C1 module-noise                 |
| doc.query.getRecords(…) param               | 284,156 | 0       | C1 module-noise                 |
| q.getRecord(…) → return                     | 284,154 | 0       | C1 module-noise                 |
| tx.getRecord(…) → return                    | 284,154 | 0       | C1 module-noise                 |
| doc.query.getRecord(…) → return             | 284,154 | 0       | C1 module-noise                 |
| q.getRecord(…) param                        | 284,152 | 0       | C1 module-noise                 |
| q.getChild(…) param                         | 284,152 | 0       | C1 module-noise                 |
| q.getChildren(…) param                      | 284,152 | 0       | C1 module-noise                 |
| q.findDescendants(…) param                  | 284,152 | 0       | C1 module-noise                 |
| q.findAncestors(…) param                    | 284,152 | 0       | C1 module-noise                 |
| q.getTree(…) param                          | 284,152 | 0       | C1 module-noise                 |
| q.getAttribute(…) param                     | 284,152 | 0       | C1 module-noise                 |
| q.getAttributes(…) param                    | 284,152 | 0       | C1 module-noise                 |
| tx.addChild(…) param                        | 284,152 | 0       | C1 module-noise                 |
| tx.ensureChild(…) param                     | 284,152 | 0       | C1 module-noise                 |
| tx.update(…) param                          | 284,152 | 0       | C1 module-noise                 |
| tx.delete(…) param                          | 284,152 | 0       | C1 module-noise                 |
| tx.deepClone(…) param                       | 284,152 | 0       | C1 module-noise                 |
| tx.getRecord(…) param                       | 284,152 | 0       | C1 module-noise                 |
| tx.getChild(…) param                        | 284,152 | 0       | C1 module-noise                 |
| tx.getChildren(…) param                     | 284,152 | 0       | C1 module-noise                 |
| tx.findDescendants(…) param                 | 284,152 | 0       | C1 module-noise                 |
| tx.findAncestors(…) param                   | 284,152 | 0       | C1 module-noise                 |
| tx.getTree(…) param                         | 284,152 | 0       | C1 module-noise                 |
| tx.getAttribute(…) param                    | 284,152 | 0       | C1 module-noise                 |
| tx.getAttributes(…) param                   | 284,152 | 0       | C1 module-noise                 |
| doc.query.getRecord(…) param                | 284,152 | 0       | C1 module-noise                 |
| doc.query.getChild(…) param                 | 284,152 | 0       | C1 module-noise                 |
| doc.query.getChildren(…) param              | 284,152 | 0       | C1 module-noise                 |
| doc.query.findDescendants(…) param          | 284,152 | 0       | C1 module-noise                 |
| doc.query.findAncestors(…) param            | 284,152 | 0       | C1 module-noise                 |
| doc.query.getTree(…) param                  | 284,152 | 0       | C1 module-noise                 |
| doc.query.getAttribute(…) param             | 284,152 | 0       | C1 module-noise                 |
| doc.query.getAttributes(…) param            | 284,152 | 0       | C1 module-noise                 |
| q.getTree(…) → return                       | 284,151 | 0       | C1 module-noise, C6 recursive   |
| tx.getTree(…) → return                      | 284,151 | 0       | C1 module-noise, C6 recursive   |
| doc.query.getTree(…) → return               | 284,151 | 0       | C1 module-noise, C6 recursive   |
| q.findAncestors(…) → return                 | 284,144 | 0       | C1 module-noise                 |
| q.findByAttributes(…) → return              | 284,144 | 0       | C1 module-noise                 |
| tx.findAncestors(…) → return                | 284,144 | 0       | C1 module-noise                 |
| tx.findByAttributes(…) → return             | 284,144 | 0       | C1 module-noise                 |
| doc.query.findAncestors(…) → return         | 284,144 | 0       | C1 module-noise                 |
| doc.query.findByAttributes(…) → return      | 284,144 | 0       | C1 module-noise                 |
| tx.update(…) → return                       | 284,138 | 0       | C1 module-noise                 |
| tx.deepClone(…) → return                    | 284,109 | 0       | C1 module-noise                 |
| tx.addChild(…) → return                     | 284,107 | 0       | C1 module-noise                 |
| tx.ensureChild(…) → return                  | 284,107 | 0       | C1 module-noise                 |
| tx.delete(…) → return                       | 283,750 | 0       | C1 module-noise                 |
| doc.transaction(…) param                    | 282,625 | 0       | C1 module-noise                 |
| doc.prepare(…) param                        | 282,622 | 0       | C1 module-noise                 |
| project.openDocument(…) → return            | 282,602 | 0       | C1 module-noise                 |
| project.queryAll(…) param                   | 282,575 | 0       | C1 module-noise                 |
| project.queryFirst(…) param                 | 282,573 | 0       | C1 module-noise                 |
| q.getRoot(…) → return                       | 282,568 | 0       | C1 module-noise, C5 record-seam |
| tx.getRoot(…) → return                      | 282,568 | 0       | C1 module-noise, C5 record-seam |
| doc.query.getRoot(…) → return               | 282,568 | 0       | C1 module-noise, C5 record-seam |
| tx.getStagedOperations(…) → return          | 282,510 | 0       | C1 module-noise                 |
| doc.prepare(…) → return                     | 282,509 | 0       | C1 module-noise                 |
| q.getRecordsByTagName(…) param              | 1,637   | 0       | —                               |
| tx.getRecordsByTagName(…) param             | 1,637   | 0       | —                               |
| doc.query.getRecordsByTagName(…) param      | 1,637   | 0       | —                               |
| tx.any.deepClone(…) → return                | 233     | 2       | C1 module-noise                 |
| tx.any.ensureChild(…) → return              | 81      | 0       | C1 module-noise                 |
| project.getBlob(…) → return                 | 76      | 0       | C1 module-noise                 |
| q.any.findByAttributes(…) param             | 72      | 1       | —                               |
| tx.any.findByAttributes(…) param            | 72      | 1       | —                               |
| project.initEmptyDocument(…) param          | 61      | 0       | C1 module-noise                 |
| q.any.findDescendants(…) → return           | 59      | 0       | C1 module-noise                 |
| tx.any.findDescendants(…) → return          | 59      | 0       | C1 module-noise                 |
| q.any.getRecords(…) → return                | 57      | 0       | C1 module-noise                 |
| tx.any.getRecords(…) → return               | 57      | 0       | C1 module-noise                 |
| q.any.getRecord(…) → return                 | 53      | 0       | C1 module-noise                 |
| q.any.getChild(…) → return                  | 53      | 0       | C1 module-noise                 |
| tx.any.getRecord(…) → return                | 53      | 0       | C1 module-noise                 |
| tx.any.getChild(…) → return                 | 53      | 0       | C1 module-noise                 |
| project.export(…) → return                  | 52      | 0       | —                               |
| q.any.getAttribute(…) param                 | 51      | 0       | C1 module-noise                 |
| q.any.getAttributes(…) param                | 51      | 0       | C1 module-noise                 |
| q.any.getTree(…) param                      | 51      | 0       | C1 module-noise                 |
| q.any.findDescendants(…) param              | 51      | 0       | C1 module-noise                 |
| q.any.findAncestors(…) param                | 51      | 0       | C1 module-noise                 |
| tx.any.getAttribute(…) param                | 51      | 0       | C1 module-noise                 |
| tx.any.getAttributes(…) param               | 51      | 0       | C1 module-noise                 |
| tx.any.getTree(…) param                     | 51      | 0       | C1 module-noise                 |
| tx.any.findDescendants(…) param             | 51      | 0       | C1 module-noise                 |
| tx.any.findAncestors(…) param               | 51      | 0       | C1 module-noise                 |
| project.import(…) → return                  | 51      | 0       | —                               |
| project.getDocument(…) → return             | 51      | 0       | C1 module-noise                 |
| q.any.getTree(…) → return                   | 50      | 0       | C1 module-noise                 |
| tx.any.getTree(…) → return                  | 50      | 0       | C1 module-noise                 |
| q.any.getAttribute(…) → return              | 49      | 0       | C1 module-noise                 |
| tx.any.getAttribute(…) → return             | 49      | 0       | C1 module-noise                 |
| q.any.getChildren(…) → return               | 43      | 0       | C1 module-noise                 |
| q.any.getRecordsByTagName(…) → return       | 43      | 0       | C1 module-noise                 |
| q.any.findAncestors(…) → return             | 43      | 0       | C1 module-noise                 |
| q.any.findByAttributes(…) → return          | 43      | 0       | C1 module-noise                 |
| tx.any.getChildren(…) → return              | 43      | 0       | C1 module-noise                 |
| tx.any.getRecordsByTagName(…) → return      | 43      | 0       | C1 module-noise                 |
| tx.any.findAncestors(…) → return            | 43      | 0       | C1 module-noise                 |
| tx.any.findByAttributes(…) → return         | 43      | 0       | C1 module-noise                 |
| project.getDocuments(…) → return            | 41      | 0       | C1 module-noise                 |
| project.exportBlob(…) → return              | 41      | 0       | C1 module-noise                 |
| q.any.getChild(…) param                     | 39      | 0       | C1 module-noise                 |
| q.any.getChildren(…) param                  | 39      | 0       | C1 module-noise                 |
| q.any.getAttributes(…) → return             | 39      | 0       | C1 module-noise                 |
| tx.any.addChild(…) param                    | 39      | 0       | C1 module-noise                 |
| tx.any.ensureChild(…) param                 | 39      | 0       | C1 module-noise                 |
| tx.any.update(…) param                      | 39      | 0       | C1 module-noise                 |
| tx.any.delete(…) param                      | 39      | 0       | C1 module-noise                 |
| tx.any.deepClone(…) param                   | 39      | 0       | C1 module-noise                 |
| tx.any.getChild(…) param                    | 39      | 0       | C1 module-noise                 |
| tx.any.getChildren(…) param                 | 39      | 0       | C1 module-noise                 |
| tx.any.getAttributes(…) → return            | 39      | 0       | C1 module-noise                 |
| tx.any.addChild(…) → return                 | 37      | 0       | C1 module-noise                 |
| tx.any.update(…) → return                   | 37      | 0       | C1 module-noise                 |
| tx.any.delete(…) → return                   | 37      | 0       | C1 module-noise                 |
| project.getBlobsByDocument(…) → return      | 37      | 0       | C1 module-noise                 |
| project.getBlobsByRecord(…) → return        | 37      | 0       | C1 module-noise                 |
| project.getStandaloneBlobs(…) → return      | 37      | 0       | C1 module-noise                 |
| Plc.Project (container)                     | 33      | -       | —                               |
| q.any.getRecords(…) param                   | 33      | 0       | C1 module-noise                 |
| tx.any.getRecords(…) param                  | 33      | 0       | C1 module-noise                 |
| project.open(…) → return                    | 33      | 0       | —                               |
| q.any.getRecord(…) param                    | 31      | 0       | C1 module-noise                 |
| tx.any.getRecord(…) param                   | 31      | 0       | C1 module-noise                 |
| Plc.Transaction (container)                 | 15      | -       | —                               |
| Plc.Document (container)                    | 12      | -       | —                               |
| Plc.Query (container)                       | 9       | -       | —                               |
| q.getFilename(…) param                      | 9       | 0       | —                               |
| q.getRoot(…) param                          | 9       | 0       | —                               |
| q.getAttribute(…) → return                  | 9       | 0       | —                               |
| tx.getStagedOperations(…) param             | 9       | 0       | —                               |
| tx.clearStagedOperations(…) param           | 9       | 0       | —                               |
| tx.clearRecordCache(…) param                | 9       | 0       | —                               |
| tx.clearCumulativeCloneMappings(…) param    | 9       | 0       | —                               |
| tx.commit(…) param                          | 9       | 0       | —                               |
| tx.getFilename(…) param                     | 9       | 0       | —                               |
| tx.getRoot(…) param                         | 9       | 0       | —                               |
| tx.getAttribute(…) → return                 | 9       | 0       | —                               |
| doc.query.getFilename(…) param              | 9       | 0       | —                               |
| doc.query.getRoot(…) param                  | 9       | 0       | —                               |
| doc.query.getAttribute(…) → return          | 9       | 0       | —                               |
| doc.close(…) param                          | 9       | 0       | —                               |
| doc.destroy(…) param                        | 9       | 0       | —                               |
| project.close(…) param                      | 9       | 0       | —                               |
| project.destroy(…) param                    | 9       | 0       | —                               |
| project.getDocuments(…) param               | 9       | 0       | —                               |
| project.getStandaloneBlobs(…) param         | 9       | 0       | —                               |
| project.queryAll(…) → return                | 9       | 0       | —                               |
| project.getDatabaseInstance(…) param        | 9       | 0       | —                               |
| q.getAttributes(…) → return                 | 7       | 0       | —                               |
| tx.getAttributes(…) → return                | 7       | 0       | —                               |
| doc.query.getAttributes(…) → return         | 7       | 0       | —                               |
| doc.transaction(…) → return                 | 7       | 0       | —                               |
| project.queryFirst(…) → return              | 7       | 0       | —                               |
| project.getDatabaseInstance(…) → return     | 7       | 0       | —                               |
| q.any.getRecordsByTagName(…) param          | 6       | 0       | —                               |
| q.getFilename(…) → return                   | 6       | 0       | —                               |
| tx.any.getRecordsByTagName(…) param         | 6       | 0       | —                               |
| tx.getFilename(…) → return                  | 6       | 0       | —                               |
| doc.query.getFilename(…) → return           | 6       | 0       | —                               |
| project.open(…) param                       | 6       | 0       | —                               |
| project.initEmptyDocument(…) → return       | 6       | 0       | —                               |
| project.removeDocument(…) param             | 6       | 0       | —                               |
| project.import(…) param                     | 6       | 0       | —                               |
| project.export(…) param                     | 6       | 0       | —                               |
| project.getDocument(…) param                | 6       | 0       | —                               |
| project.openDocument(…) param               | 6       | 0       | —                               |
| project.getDocumentConfig(…) param          | 6       | 0       | —                               |
| project.undo(…) param                       | 6       | 0       | —                               |
| project.redo(…) param                       | 6       | 0       | —                               |
| project.addBlob(…) param                    | 6       | 0       | —                               |
| project.addBlob(…) → return                 | 6       | 0       | —                               |
| project.getBlob(…) param                    | 6       | 0       | —                               |
| project.exportBlob(…) param                 | 6       | 0       | —                               |
| project.getBlobsByDocument(…) param         | 6       | 0       | —                               |
| project.getBlobsByRecord(…) param           | 6       | 0       | —                               |
| project.attachBlob(…) param                 | 6       | 0       | —                               |
| project.detachBlob(…) param                 | 6       | 0       | —                               |
| project.removeBlob(…) param                 | 6       | 0       | —                               |
| project.getDocumentConfig(…) → return       | 5       | 0       | —                               |
| tx.clearStagedOperations(…) → return        | 4       | 0       | —                               |
| tx.clearRecordCache(…) → return             | 4       | 0       | —                               |
| tx.clearCumulativeCloneMappings(…) → return | 4       | 0       | —                               |
| tx.commit(…) → return                       | 4       | 0       | —                               |
| doc.close(…) → return                       | 4       | 0       | —                               |
| doc.destroy(…) → return                     | 4       | 0       | —                               |
| project.close(…) → return                   | 4       | 0       | —                               |
| project.destroy(…) → return                 | 4       | 0       | —                               |
| project.removeDocument(…) → return          | 4       | 0       | —                               |
| project.undo(…) → return                    | 4       | 0       | —                               |
| project.redo(…) → return                    | 4       | 0       | —                               |
| project.attachBlob(…) → return              | 4       | 0       | —                               |
| project.detachBlob(…) → return              | 4       | 0       | —                               |
| project.removeBlob(…) → return              | 4       | 0       | —                               |
| q.getChild(…) → return                      | 3       | 0       | —                               |
| q.getChildren(…) → return                   | 3       | 0       | —                               |
| q.getRecordsByTagName(…) → return           | 3       | 0       | —                               |
| tx.getChild(…) → return                     | 3       | 0       | —                               |
| tx.getChildren(…) → return                  | 3       | 0       | —                               |
| tx.getRecordsByTagName(…) → return          | 3       | 0       | —                               |
| doc.query.getChild(…) → return              | 3       | 0       | —                               |
| doc.query.getChildren(…) → return           | 3       | 0       | —                               |
| doc.query.getRecordsByTagName(…) → return   | 3       | 0       | —                               |

## Namespace type aliases (concrete `LNode` + wide `ElementsOf`)

| Member                                  | len   | members | causes |
| --------------------------------------- | ----- | ------- | ------ |
| Plc.ElementsOf                          | 1,637 | 0       | —      |
| Plc.ChildrenOf<ElementsOf>              | 1,606 | 0       | —      |
| Plc.DescendantsOf<ElementsOf>           | 1,606 | 0       | —      |
| Plc.AncestorsOf<ElementsOf>             | 1,249 | 0       | —      |
| Plc.ParentsOf<ElementsOf>               | 1,249 | 0       | —      |
| Plc.Ref                                 | 56    | 1       | —      |
| Plc.AttributesValueObjectOf<ElementsOf> | 27    | 0       | —      |
| Plc.SingletonElementsOf                 | 23    | 0       | —      |
| Plc.ParentRelationship<ElementsOf>      | 22    | 0       | —      |
| Plc.QualifiedAttribute<ElementsOf>      | 22    | 0       | —      |
| Plc.ChildRelationship<ElementsOf>       | 21    | 0       | —      |
| Plc.ParentRelationship                  | 21    | 0       | —      |
| Plc.QualifiedAttribute                  | 21    | 0       | —      |
| Plc.ChildRelationship                   | 20    | 0       | —      |
| Plc.TransactionHooks                    | 20    | 0       | —      |
| Plc.TrackedRecord<ElementsOf>           | 17    | 0       | —      |
| Plc.CloneMapping                        | 16    | 0       | —      |
| Plc.TrackedRecord                       | 16    | 0       | —      |
| Plc.Transaction                         | 15    | 0       | —      |
| Plc.TreeRecord<ElementsOf>              | 14    | 0       | —      |
| Plc.Attribute<ElementsOf>               | 13    | 0       | —      |
| Plc.Operation                           | 13    | 0       | —      |
| Plc.RawRecord<ElementsOf>               | 13    | 0       | —      |
| Plc.TreeRecord                          | 13    | 0       | —      |
| Plc.Attribute                           | 12    | 0       | —      |
| Plc.Document                            | 12    | 0       | —      |
| Plc.RawRecord                           | 12    | 0       | —      |
| Plc.Context                             | 11    | 0       | —      |
| Plc.Project                             | 10    | 0       | —      |
| Plc.Query                               | 9     | 0       | —      |
| Plc.RootElementOf                       | 9     | 0       | —      |
| Plc.AncestorsOf                         | 7     | 0       | —      |
| Plc.AttributesValueObjectOf             | 7     | 0       | —      |
| Plc.ChildrenOf                          | 7     | 0       | —      |
| Plc.DescendantsOf                       | 7     | 0       | —      |
| Plc.ParentsOf                           | 7     | 0       | —      |
| Plc.Ref<ElementsOf>                     | 7     | 0       | —      |
| Plc.AttributesOf                        | 5     | 0       | —      |
| Plc.AttributesOf<ElementsOf>            | 5     | 0       | —      |
| Plc.FullAttributeObjectOf               | 5     | 0       | —      |
| Plc.FullAttributeObjectOf<ElementsOf>   | 5     | 0       | —      |

**Summary:** 105 methods, 26 namespace types, 126/255 rows flagged. Total 20,240,655 chars.
