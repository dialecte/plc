import { convertProject } from './converters/convert-project'
import { serializeIecTree } from './iec-tree'
import { TC6_NAMESPACE, TC6_ROOT_NAME } from './io-hooks.constants'
import { parseTc6, readRootElement } from './tc6-tree'

import type { RootElement } from './tc6-tree'
import type { IOHooks } from '@dialecte/core'

/**
 * Whether an XML text is a PLCopen TC6 v2.01 file: its root element is a `project` in that namespace. Only the root's
 * start tag is read, so the cost does not grow with the file, and a TC6 `project` held deeper (a document's own data)
 * does not make the text one.
 *
 * @intent tell a TC6 v2.01 file from one already in IEC 61131-10 form, before normalising it on import
 */
export function isTc6v201(xml: string): boolean {
	const root = readRootElement(xml)
	return root !== undefined && isTc6Root(root)
}

/** Whether an element is a TC6 v2.01 file's root: a `project` in that namespace. */
function isTc6Root(element: RootElement): boolean {
	return element.localName === TC6_ROOT_NAME && element.namespace === TC6_NAMESPACE
}

/**
 * Transforms a PLCopen TC6 v2.01 text to its canonical IEC 61131-10 Ed1.0 text, once, before a file is imported; any
 * other text comes back unchanged, so the transform is idempotent. Needs no DOM: it runs in a worker, in node and in a
 * page alike, and gives the same bytes in each.
 *
 * - The tree: `Project > Types > GlobalNamespace`, one POU after the other.
 * - Variables: `inputVars`, `outputVars`, `inOutVars` to `Parameters > InputVars`, `OutputVars`, `InoutVars`;
 *   `localVars` to `Vars`; `externalVars` to `ExternalVars`; `tempVars` to `TempVars`.
 * - Bodies: FBD to `MainBody > BodyContent xsi:type="FBD" > Network` with `FbdObject` and `CommonObject` nodes; ST and
 *   IL to `MainBody > BodyContent xsi:type="ST"|"IL"` carrying text; LD to `MainBody > BodyContent xsi:type="LD" > Rung`
 *   with `LdObject`.
 * - FBD graphics, each to the object of the IEC 61131-10 schema with the pins it holds: `block` to `FbdObject xsi:type="Block"` with
 *   `InputVariables > InputVariable[parameterName] > ConnectionPointIn > Connection` and
 *   `OutputVariables > OutputVariable[parameterName] > ConnectionPointOut`; `inVariable` to
 *   `FbdObject xsi:type="DataSource"`; `outVariable` to `FbdObject xsi:type="DataSink"`; `comment` to
 *   `CommonObject xsi:type="Comment"`; `connector` and `continuation` to `CommonObject xsi:type="Connector"|"Continuation"`.
 * - Wiring: every output pin gets a unique `connectionPointOutId`; a `connection/@refLocalId` (and its optional
 *   `@formalParameter`) resolves to the producing pin's id as `refConnectionPointOutId`.
 *
 * Elements are found by local name, in any namespace and at any depth, except where a section's children are read
 * directly.
 *
 * @throws Error `TC6 v201 parse error: <message>` for a text the parser refuses, or a DOCTYPE with an internal subset.
 * @intent turn a TC6 v2.01 file into what the dialecte's definition reads, in core's engine worker or anywhere else
 */
export function normalizeTc6v201(xml: string): string {
	if (!isTc6v201(xml)) return xml
	const root = parseTc6(xml)
	// the detection reads the text as written; the parse reads it repaired (a processing instruction closing with `??>`
	// can hide the real root from the first): only a root the parse confirms is converted
	if (!isTc6Root(root)) return xml
	return serializeIecTree(convertProject(root))
}

/**
 * The dialecte's import hooks: a file's text is normalised before it is parsed.
 *
 * @intent wire the TC6 v2.01 normalisation into a project's import
 */
export const IO_HOOKS: IOHooks = {
	beforeImport: normalizeTc6v201,
}
