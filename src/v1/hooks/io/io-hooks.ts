/**
 * Pre-parse normalizer: TC6 XML TC6_0201 → IEC 61131-10 Ed1.0 canonical form.
 *
 * Transform pipeline (DOM-based, runs once before Dialecte import):
 *
 * 1. Parse TC6 XML with DOMParser.
 * 2. Build the IEC `Project > Types > GlobalNamespace` tree, one POU at a time.
 * 3. Convert each POU's `interface` variable sections and its `body`.
 *    - Variable decls: `inputVars`/`outputVars`/`inOutVars` → `Parameters >
 *      InputVars`/`OutputVars`/`InoutVars`; `localVars` → `Vars`; `externalVars`
 *      → `ExternalVars`; `tempVars` → `TempVars`.
 *    - FBD body  → `MainBody > BodyContent xsi:type="FBD" > Network` with
 *      `FbdObject`/`CommonObject` graphic nodes.
 *    - ST/IL body → `MainBody > BodyContent xsi:type="ST"|"IL"` carrying text.
 *    - LD body   → `MainBody > BodyContent xsi:type="LD" > Rung` with `LdObject`.
 * 4. FBD graphic mapping (matches the SET Logic Editor write contract):
 *    - `block`       → `FbdObject xsi:type="Block"` with `InputVariables >
 *      InputVariable[parameterName] > ConnectionPointIn > Connection` and
 *      `OutputVariables > OutputVariable[parameterName] > ConnectionPointOut`.
 *    - `inVariable`  → `FbdObject xsi:type="DataSource"` (`OutputVariable` "value").
 *    - `outVariable` → `FbdObject xsi:type="DataSink"`   (`InputVariable` "value").
 *    - `comment`     → `CommonObject xsi:type="Comment"`.
 *    - `connector`/`continuation` → `CommonObject xsi:type="Connector"|"Continuation"`.
 * 5. Wiring uses `connectionPointOutId`/`refConnectionPointOutId`: every output
 *    pin is assigned a unique id; TC6 `connection/@refLocalId` (+ optional
 *    `@formalParameter`) is resolved to the producing pin's id.
 * 6. Serialize to IEC 61131-10 namespace XML string.
 */

import { inspectXml } from '@dialecte/core'

import { PLC_NAMESPACES } from '@/v1/config/namespaces'

const TC6_NS = 'http://www.plcopen.org/xml/tc6_0201'
const IEC_NS = PLC_NAMESPACES.default.uri
const XSI_NS = PLC_NAMESPACES.xsi.uri

/**
 * Detect whether an XML string is TC6 v201 format.
 * Uses `inspectXml` to look for the root `project` element and check its
 * default namespace, rather than a plain string search.
 */
export function isTc6v201(xml: string): boolean {
	const report = inspectXml(xml, { elements: ['project'] as const })
	return report['project']?.namespace === TC6_NS
}

/**
 * Transform a TC6 XML TC6_0201 string to IEC 61131-10 Ed1.0 canonical XML string.
 * Idempotent: already-canonical XML is returned unchanged (no TC6 namespace).
 */
export function normalizeTc6v201(xml: string): string {
	if (!isTc6v201(xml)) return xml

	const parser = new DOMParser()
	const tc6Doc = parser.parseFromString(xml, 'application/xml')

	const parseError = tc6Doc.querySelector('parsererror')
	if (parseError) throw new Error(`TC6 v201 parse error: ${parseError.textContent}`)

	const iecDoc = document.implementation.createDocument(IEC_NS, '', null)

	// Build Project root
	const tcProject = tc6Doc.documentElement
	const iecProject = iecDoc.createElementNS(IEC_NS, 'Project')
	const schemaVersion = tcProject.getAttribute('schemaVersion')
	if (schemaVersion) iecProject.setAttribute('schemaVersion', schemaVersion)
	iecDoc.appendChild(iecProject)

	// FileHeader
	const fileHeader = tcProject.querySelector('fileHeader')
	if (fileHeader) {
		const fh = iecDoc.createElementNS(IEC_NS, 'FileHeader')
		for (const attr of fileHeader.attributes) fh.setAttribute(attr.name, attr.value)
		iecProject.appendChild(fh)
	}

	// ContentHeader
	const contentHeader = tcProject.querySelector('contentHeader')
	if (contentHeader) {
		const ch = iecDoc.createElementNS(IEC_NS, 'ContentHeader')
		for (const attr of contentHeader.attributes) ch.setAttribute(attr.name, attr.value)
		iecProject.appendChild(ch)
	}

	// Types (POUs)
	const types = tcProject.querySelector('types')
	if (types) {
		const iecTypes = iecDoc.createElementNS(IEC_NS, 'Types')
		const globalNs = iecDoc.createElementNS(IEC_NS, 'GlobalNamespace')
		iecTypes.appendChild(globalNs)

		for (const pou of types.querySelectorAll('pou')) {
			globalNs.appendChild(convertPou(iecDoc, pou))
		}

		iecProject.appendChild(iecTypes)
	}

	// Instances
	const iecInstances = iecDoc.createElementNS(IEC_NS, 'Instances')
	iecProject.appendChild(iecInstances)

	return new XMLSerializer().serializeToString(iecDoc)
}

// ── POU conversion ────────────────────────────────────────────────────────────

function convertPou(doc: XMLDocument, pou: Element): Element {
	const name = pou.getAttribute('name') ?? ''
	const pouType = pou.getAttribute('pouType') ?? 'functionBlock'

	const tagName = pouType === 'program' ? 'Program' : 'FunctionBlock'
	const iecPou = doc.createElementNS(IEC_NS, tagName)
	iecPou.setAttribute('name', name)

	const iface = pou.querySelector('interface')
	if (iface) convertInterface(doc, iecPou, iface)

	const body = pou.querySelector('body')
	if (body) convertBody(doc, iecPou, body)

	return iecPou
}

// ── Interface (variable declarations) ─────────────────────────────────────────

/**
 * Map TC6 `interface` variable sections to IEC POU variable sections.
 * Input/output/inout vars nest under a single `Parameters`; locals map to `Vars`
 * (IEC has no `LocalVars`); external/temp vars map directly. Sections are
 * appended in IEC POU child order (`Parameters`, `ExternalVars`, `Vars`,
 * `TempVars`) so they precede `MainBody`.
 */
function convertInterface(doc: XMLDocument, iecPou: Element, iface: Element): void {
	const inputVars = collectVarDecls(doc, iface, 'inputVars')
	const outputVars = collectVarDecls(doc, iface, 'outputVars')
	const inOutVars = collectVarDecls(doc, iface, 'inOutVars')

	if (inputVars.length || outputVars.length || inOutVars.length) {
		const parameters = doc.createElementNS(IEC_NS, 'Parameters')
		appendVarSection(doc, parameters, 'InoutVars', inOutVars)
		appendVarSection(doc, parameters, 'InputVars', inputVars)
		appendVarSection(doc, parameters, 'OutputVars', outputVars)
		iecPou.appendChild(parameters)
	}

	appendVarSection(doc, iecPou, 'ExternalVars', collectVarDecls(doc, iface, 'externalVars'))
	appendVarSection(doc, iecPou, 'Vars', collectVarDecls(doc, iface, 'localVars'))
	appendVarSection(doc, iecPou, 'TempVars', collectVarDecls(doc, iface, 'tempVars'))
}

function appendVarSection(
	doc: XMLDocument,
	parent: Element,
	tagName: string,
	vars: Element[],
): void {
	if (!vars.length) return
	const section = doc.createElementNS(IEC_NS, tagName)
	for (const v of vars) section.appendChild(v)
	parent.appendChild(section)
}

/** Collect variable declarations from every `sectionName` block under `iface`. */
function collectVarDecls(doc: XMLDocument, iface: Element, sectionName: string): Element[] {
	const out: Element[] = []
	for (const section of iface.querySelectorAll(`:scope > ${sectionName}`)) {
		for (const tcVar of section.querySelectorAll(':scope > variable')) {
			out.push(convertVarDecl(doc, tcVar))
		}
	}
	return out
}

/**
 * Convert a TC6 `variable` declaration to an IEC `Variable` with a resolved
 * `Type > TypeName` (elementary type tag name or `derived/@name`) and an
 * optional `InitialValue > SimpleValue`.
 */
function convertVarDecl(doc: XMLDocument, tcVar: Element): Element {
	const variable = doc.createElementNS(IEC_NS, 'Variable')
	variable.setAttribute('name', tcVar.getAttribute('name') ?? '')

	const type = doc.createElementNS(IEC_NS, 'Type')
	const typeName = doc.createElementNS(IEC_NS, 'TypeName')
	typeName.textContent = resolveTypeName(tcVar.querySelector('type'))
	type.appendChild(typeName)
	variable.appendChild(type)

	const simpleValue = tcVar.querySelector('initialValue > simpleValue')
	if (simpleValue) {
		const initialValue = doc.createElementNS(IEC_NS, 'InitialValue')
		const sv = doc.createElementNS(IEC_NS, 'SimpleValue')
		sv.setAttribute('value', simpleValue.getAttribute('value') ?? '')
		initialValue.appendChild(sv)
		variable.appendChild(initialValue)
	}

	return variable
}

function resolveTypeName(type: Element | null): string {
	if (!type) return ''
	const derived = type.querySelector('derived')
	if (derived) return derived.getAttribute('name') ?? ''
	const first = type.firstElementChild
	return first ? first.localName : ''
}

// ── Body dispatch ─────────────────────────────────────────────────────────────

function convertBody(doc: XMLDocument, iecPou: Element, body: Element): void {
	const fbd = body.querySelector('FBD')
	if (fbd) {
		iecPou.appendChild(convertFbdBody(doc, fbd))
		return
	}
	const ld = body.querySelector('LD')
	if (ld) {
		iecPou.appendChild(convertLdBody(doc, ld))
		return
	}
	const st = body.querySelector('ST')
	if (st) {
		iecPou.appendChild(convertTextBody(doc, 'ST', st))
		return
	}
	const il = body.querySelector('IL')
	if (il) {
		iecPou.appendChild(convertTextBody(doc, 'IL', il))
	}
}

// ── Textual bodies (ST / IL) ──────────────────────────────────────────────────

function convertTextBody(doc: XMLDocument, kind: 'ST' | 'IL', src: Element): Element {
	const mainBody = doc.createElementNS(IEC_NS, 'MainBody')
	const bodyContent = doc.createElementNS(IEC_NS, 'BodyContent')
	bodyContent.setAttributeNS(XSI_NS, 'xsi:type', kind)
	const text = doc.createElementNS(IEC_NS, kind)
	text.textContent = extractPlainText(src)
	bodyContent.appendChild(text)
	mainBody.appendChild(bodyContent)
	return mainBody
}

// ── FBD body ──────────────────────────────────────────────────────────────────

function convertFbdBody(doc: XMLDocument, fbd: Element): Element {
	const outIds = allocateFbdOutIds(fbd)

	const mainBody = doc.createElementNS(IEC_NS, 'MainBody')
	const bodyContent = doc.createElementNS(IEC_NS, 'BodyContent')
	bodyContent.setAttributeNS(XSI_NS, 'xsi:type', 'FBD')

	const network = doc.createElementNS(IEC_NS, 'Network')
	network.setAttribute('evaluationOrder', '0')

	for (const child of fbd.children) {
		const converted = convertFbdElement(doc, child, outIds)
		if (converted) network.appendChild(converted)
	}

	bodyContent.appendChild(network)
	mainBody.appendChild(bodyContent)
	return mainBody
}

/**
 * Allocate a unique `connectionPointOutId` for every output pin in the network.
 * Keyed by `${localId}|${formalParameter}`; each source's first output also
 * registers a `${localId}|` default so connections that omit `formalParameter`
 * still resolve. IDs are monotonic integers (editor-compatible namespace).
 */
function allocateFbdOutIds(fbd: Element): Map<string, string> {
	const ids = new Map<string, string>()
	let counter = 0
	const assign = (localId: string, formalParameter: string): void => {
		const id = String(++counter)
		ids.set(`${localId}|${formalParameter}`, id)
		if (!ids.has(`${localId}|`)) ids.set(`${localId}|`, id)
	}

	for (const el of fbd.children) {
		const localId = el.getAttribute('localId') ?? ''
		switch (el.localName) {
			case 'block':
				for (const v of el.querySelectorAll('outputVariables > variable')) {
					assign(localId, v.getAttribute('formalParameter') ?? '')
				}
				break
			case 'inVariable':
			case 'continuation':
				assign(localId, '')
				break
		}
	}

	return ids
}

function resolveRef(conn: Element, outIds: Map<string, string>): string | undefined {
	const refLocalId = conn.getAttribute('refLocalId') ?? ''
	const formalParameter = conn.getAttribute('formalParameter') ?? ''
	return outIds.get(`${refLocalId}|${formalParameter}`) ?? outIds.get(`${refLocalId}|`)
}

// ── FBD element conversion ────────────────────────────────────────────────────

function convertFbdElement(
	doc: XMLDocument,
	el: Element,
	outIds: Map<string, string>,
): Element | null {
	switch (el.localName) {
		case 'block':
			return convertBlock(doc, el, outIds)
		case 'inVariable':
			return convertDataSource(doc, el, outIds)
		case 'outVariable':
			return convertDataSink(doc, el, outIds)
		case 'comment':
			return convertComment(doc, el)
		case 'connector':
			return convertConnector(doc, el, outIds)
		case 'continuation':
			return convertContinuation(doc, el, outIds)
		default:
			return null
	}
}

function convertBlock(doc: XMLDocument, el: Element, outIds: Map<string, string>): Element {
	const fbdObj = doc.createElementNS(IEC_NS, 'FbdObject')
	fbdObj.setAttributeNS(XSI_NS, 'xsi:type', 'Block')
	fbdObj.setAttribute('typeName', el.getAttribute('typeName') ?? '')
	const instanceName = el.getAttribute('instanceName')
	if (instanceName) fbdObj.setAttribute('instanceName', instanceName)

	appendPosition(doc, fbdObj, el)

	const inputs = el.querySelectorAll('inputVariables > variable')
	if (inputs.length) {
		const wrapper = doc.createElementNS(IEC_NS, 'InputVariables')
		for (const variable of inputs) {
			wrapper.appendChild(convertInputVariable(doc, variable, outIds))
		}
		fbdObj.appendChild(wrapper)
	}

	const localId = el.getAttribute('localId') ?? ''
	const outputs = el.querySelectorAll('outputVariables > variable')
	if (outputs.length) {
		const wrapper = doc.createElementNS(IEC_NS, 'OutputVariables')
		for (const variable of outputs) {
			const formalParameter = variable.getAttribute('formalParameter') ?? ''
			wrapper.appendChild(
				convertOutputVariable(doc, formalParameter, outIds.get(`${localId}|${formalParameter}`)),
			)
		}
		fbdObj.appendChild(wrapper)
	}

	return fbdObj
}

function convertInputVariable(
	doc: XMLDocument,
	variable: Element,
	outIds: Map<string, string>,
): Element {
	const inputVariable = doc.createElementNS(IEC_NS, 'InputVariable')
	inputVariable.setAttribute('parameterName', variable.getAttribute('formalParameter') ?? '')
	if (variable.getAttribute('negated') === 'true') inputVariable.setAttribute('negated', 'true')
	const edge = variable.getAttribute('edge')
	if (edge && edge !== 'none') inputVariable.setAttribute('edge', edge)

	inputVariable.appendChild(
		buildConnectionPointIn(doc, variable.querySelector('connectionPointIn'), outIds),
	)

	return inputVariable
}

function convertOutputVariable(
	doc: XMLDocument,
	parameterName: string,
	connectionPointOutId: string | undefined,
): Element {
	const outputVariable = doc.createElementNS(IEC_NS, 'OutputVariable')
	outputVariable.setAttribute('parameterName', parameterName)
	const cpOut = doc.createElementNS(IEC_NS, 'ConnectionPointOut')
	if (connectionPointOutId) cpOut.setAttribute('connectionPointOutId', connectionPointOutId)
	outputVariable.appendChild(cpOut)
	return outputVariable
}

function convertDataSource(doc: XMLDocument, el: Element, outIds: Map<string, string>): Element {
	const fbdObj = doc.createElementNS(IEC_NS, 'FbdObject')
	fbdObj.setAttributeNS(XSI_NS, 'xsi:type', 'DataSource')
	fbdObj.setAttribute('identifier', expressionText(el))
	appendPosition(doc, fbdObj, el)

	const localId = el.getAttribute('localId') ?? ''
	const wrapper = doc.createElementNS(IEC_NS, 'OutputVariables')
	wrapper.appendChild(convertOutputVariable(doc, 'value', outIds.get(`${localId}|`)))
	fbdObj.appendChild(wrapper)

	return fbdObj
}

function convertDataSink(doc: XMLDocument, el: Element, outIds: Map<string, string>): Element {
	const fbdObj = doc.createElementNS(IEC_NS, 'FbdObject')
	fbdObj.setAttributeNS(XSI_NS, 'xsi:type', 'DataSink')
	fbdObj.setAttribute('identifier', expressionText(el))
	appendPosition(doc, fbdObj, el)

	const inputVariable = doc.createElementNS(IEC_NS, 'InputVariable')
	inputVariable.setAttribute('parameterName', 'value')
	inputVariable.appendChild(
		buildConnectionPointIn(doc, el.querySelector('connectionPointIn'), outIds),
	)
	const wrapper = doc.createElementNS(IEC_NS, 'InputVariables')
	wrapper.appendChild(inputVariable)
	fbdObj.appendChild(wrapper)

	return fbdObj
}

function convertComment(doc: XMLDocument, el: Element): Element {
	const obj = doc.createElementNS(IEC_NS, 'CommonObject')
	obj.setAttributeNS(XSI_NS, 'xsi:type', 'Comment')
	appendPosition(doc, obj, el)

	const content = el.querySelector('content')
	const contentEl = doc.createElementNS(IEC_NS, 'Content')
	contentEl.setAttributeNS(XSI_NS, 'xsi:type', 'SimpleText')
	contentEl.setAttribute('value', content ? extractPlainText(content) : '')
	obj.appendChild(contentEl)

	return obj
}

function convertConnector(doc: XMLDocument, el: Element, outIds: Map<string, string>): Element {
	const obj = doc.createElementNS(IEC_NS, 'CommonObject')
	obj.setAttributeNS(XSI_NS, 'xsi:type', 'Connector')
	obj.setAttribute('label', el.getAttribute('name') ?? '')
	appendPosition(doc, obj, el)
	obj.appendChild(buildConnectionPointIn(doc, el.querySelector('connectionPointIn'), outIds))
	return obj
}

function convertContinuation(doc: XMLDocument, el: Element, outIds: Map<string, string>): Element {
	const obj = doc.createElementNS(IEC_NS, 'CommonObject')
	obj.setAttributeNS(XSI_NS, 'xsi:type', 'Continuation')
	obj.setAttribute('label', el.getAttribute('name') ?? '')
	appendPosition(doc, obj, el)

	const localId = el.getAttribute('localId') ?? ''
	const cpOut = doc.createElementNS(IEC_NS, 'ConnectionPointOut')
	const id = outIds.get(`${localId}|`)
	if (id) cpOut.setAttribute('connectionPointOutId', id)
	obj.appendChild(cpOut)

	return obj
}

// ── LD body ───────────────────────────────────────────────────────────────────

const LD_XSI_TYPES: Record<string, string> = {
	leftPowerRail: 'LeftPowerRail',
	rightPowerRail: 'RightPowerRail',
	coil: 'Coil',
	contact: 'Contact',
}

function convertLdBody(doc: XMLDocument, ld: Element): Element {
	const outIds = allocateLdOutIds(ld)

	const mainBody = doc.createElementNS(IEC_NS, 'MainBody')
	const bodyContent = doc.createElementNS(IEC_NS, 'BodyContent')
	bodyContent.setAttributeNS(XSI_NS, 'xsi:type', 'LD')

	const rung = doc.createElementNS(IEC_NS, 'Rung')
	rung.setAttribute('evaluationOrder', '0')

	for (const child of ld.children) {
		const converted = convertLdElement(doc, child, outIds)
		if (converted) rung.appendChild(converted)
	}

	bodyContent.appendChild(rung)
	mainBody.appendChild(bodyContent)
	return mainBody
}

function allocateLdOutIds(ld: Element): Map<string, string> {
	const ids = new Map<string, string>()
	let counter = 0
	for (const el of ld.children) {
		if (el.querySelector(':scope > connectionPointOut')) {
			const localId = el.getAttribute('localId') ?? ''
			ids.set(`${localId}|`, String(++counter))
		}
	}
	return ids
}

function convertLdElement(
	doc: XMLDocument,
	el: Element,
	outIds: Map<string, string>,
): Element | null {
	const xsiType = LD_XSI_TYPES[el.localName]
	if (!xsiType) return null

	const obj = doc.createElementNS(IEC_NS, 'LdObject')
	obj.setAttributeNS(XSI_NS, 'xsi:type', xsiType)
	if (el.getAttribute('negated') === 'true') obj.setAttribute('negated', 'true')
	const operand = el.querySelector('variable')
	if (operand) obj.setAttribute('operand', extractPlainText(operand))

	appendPosition(doc, obj, el)

	const cpIn = el.querySelector(':scope > connectionPointIn')
	if (cpIn) obj.appendChild(buildConnectionPointIn(doc, cpIn, outIds))

	if (el.querySelector(':scope > connectionPointOut')) {
		const localId = el.getAttribute('localId') ?? ''
		const iecCpOut = doc.createElementNS(IEC_NS, 'ConnectionPointOut')
		const id = outIds.get(`${localId}|`)
		if (id) iecCpOut.setAttribute('connectionPointOutId', id)
		obj.appendChild(iecCpOut)
	}

	return obj
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function buildConnectionPointIn(
	doc: XMLDocument,
	cpIn: Element | null,
	outIds: Map<string, string>,
): Element {
	const iecCpIn = doc.createElementNS(IEC_NS, 'ConnectionPointIn')
	if (!cpIn) return iecCpIn
	for (const conn of cpIn.querySelectorAll('connection')) {
		const refId = resolveRef(conn, outIds)
		if (!refId) continue
		const iecConn = doc.createElementNS(IEC_NS, 'Connection')
		iecConn.setAttribute('refConnectionPointOutId', refId)
		iecCpIn.appendChild(iecConn)
	}
	return iecCpIn
}

function appendPosition(doc: XMLDocument, parent: Element, el: Element): void {
	const pos = el.querySelector(':scope > position')
	if (!pos) return
	const relPos = doc.createElementNS(IEC_NS, 'RelPosition')
	relPos.setAttribute('x', pos.getAttribute('x') ?? '0')
	relPos.setAttribute('y', pos.getAttribute('y') ?? '0')
	parent.appendChild(relPos)
}

function expressionText(el: Element): string {
	const expression = el.querySelector('expression')
	return expression ? extractPlainText(expression) : ''
}

function extractPlainText(el: Element): string {
	return el.textContent?.trim() ?? ''
}

import type { IOHooks } from '@dialecte/core'

export const IO_HOOKS: IOHooks = {
	beforeImport: normalizeTc6v201,
}
