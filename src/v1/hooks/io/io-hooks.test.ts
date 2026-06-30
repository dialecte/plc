import { isTc6v201, normalizeTc6v201 } from './io-hooks'

import { describe, it, expect } from 'vitest'

import { PLC_NAMESPACES } from '@/v1/config/namespaces'

const TC6_NS = 'http://www.plcopen.org/xml/tc6_0201'
const IEC_NS = PLC_NAMESPACES.default.uri
const XSI_NS = PLC_NAMESPACES.xsi.uri

/** Wrap POU inner markup (interface/body) in a minimal TC6 v201 project. */
function tc6(inner: string, pouType = 'functionBlock'): string {
	return (
		`<?xml version="1.0" encoding="UTF-8"?>` +
		`<project xmlns="${TC6_NS}">` +
		`<types><pou name="FB1" pouType="${pouType}">${inner}</pou></types>` +
		`</project>`
	)
}

function parse(xml: string): XMLDocument {
	return new DOMParser().parseFromString(xml, 'application/xml')
}

function byTag(doc: Document | Element, tag: string): Element[] {
	return Array.from(doc.getElementsByTagNameNS(IEC_NS, tag))
}

function xsi(el: Element): string | null {
	return el.getAttributeNS(XSI_NS, 'type')
}

function firstByType(doc: Document, tag: string, type: string): Element {
	const el = byTag(doc, tag).find((e) => xsi(e) === type)
	if (!el) throw new Error(`no <${tag} xsi:type="${type}">`)
	return el
}

describe('isTc6v201', () => {
	it.each([
		['TC6 namespace present', `<project xmlns="${TC6_NS}"/>`, true],
		['canonical IEC document', `<Project xmlns="${IEC_NS}"/>`, false],
		['unrelated xml', `<foo/>`, false],
	])('%s', (_label, xml, expected) => {
		expect(isTc6v201(xml)).toBe(expected)
	})
})

describe('normalizeTc6v201 passthrough', () => {
	it('returns non-TC6 input unchanged', () => {
		const xml = `<Project xmlns="${IEC_NS}"/>`
		expect(normalizeTc6v201(xml)).toBe(xml)
	})
})

describe('normalizeTc6v201 FBD wiring', () => {
	const input = tc6(
		`<body><FBD>` +
			`<inVariable localId="1"><position x="10" y="20"/>` +
			`<connectionPointOut><relPosition x="30" y="10"/></connectionPointOut>` +
			`<expression>A</expression></inVariable>` +
			`<block localId="2" typeName="AND"><position x="100" y="50"/>` +
			`<inputVariables>` +
			`<variable formalParameter="IN1" negated="true">` +
			`<connectionPointIn><relPosition x="0" y="30"/><connection refLocalId="1"/></connectionPointIn>` +
			`</variable></inputVariables>` +
			`<outputVariables>` +
			`<variable formalParameter="OUT"><connectionPointOut><relPosition x="70" y="30"/></connectionPointOut></variable>` +
			`</outputVariables></block>` +
			`<outVariable localId="3"><position x="200" y="50"/>` +
			`<connectionPointIn><connection refLocalId="2" formalParameter="OUT"/></connectionPointIn>` +
			`<expression>B</expression></outVariable>` +
			`</FBD></body>`,
	)
	const doc = parse(normalizeTc6v201(input))

	const dataSource = firstByType(doc, 'FbdObject', 'DataSource')
	const block = firstByType(doc, 'FbdObject', 'Block')
	const dataSink = firstByType(doc, 'FbdObject', 'DataSink')

	it('maps inVariable to a DataSource with a direct ConnectionPointOut (no OutputVariables wrapper)', () => {
		expect(dataSource.getAttribute('identifier')).toBe('A')
		// The connection point sits directly on the FbdObject; the OutputVariables
		// wrapper is only valid on xsi:type="Block".
		const cpOut = Array.from(dataSource.children).find((c) => c.localName === 'ConnectionPointOut')
		expect(cpOut).toBeTruthy()
		expect(byTag(dataSource, 'OutputVariables')).toHaveLength(0)
		expect(byTag(dataSource, 'OutputVariable')).toHaveLength(0)
	})

	it('maps outVariable to a DataSink with a direct ConnectionPointIn (no InputVariables wrapper)', () => {
		expect(dataSink.getAttribute('identifier')).toBe('B')
		const cpIn = Array.from(dataSink.children).find((c) => c.localName === 'ConnectionPointIn')
		expect(cpIn).toBeTruthy()
		expect(byTag(dataSink, 'InputVariables')).toHaveLength(0)
		expect(byTag(dataSink, 'InputVariable')).toHaveLength(0)
	})

	it('maps block with positioned RelPosition and typed pins', () => {
		expect(block.getAttribute('typeName')).toBe('AND')
		const rel = byTag(block, 'RelPosition')[0]
		expect([rel.getAttribute('x'), rel.getAttribute('y')]).toEqual(['100', '50'])
		const input = byTag(block, 'InputVariable')[0]
		expect(input.getAttribute('parameterName')).toBe('IN1')
		expect(input.getAttribute('negated')).toBe('true')
	})

	it('wires DataSource output -> block IN1 via connectionPointOutId', () => {
		const sourceId = byTag(dataSource, 'ConnectionPointOut')[0].getAttribute('connectionPointOutId')
		const conn = byTag(byTag(block, 'InputVariable')[0], 'Connection')[0]
		expect(sourceId).toBeTruthy()
		expect(conn.getAttribute('refConnectionPointOutId')).toBe(sourceId)
	})

	it('wires block OUT -> DataSink via formalParameter-resolved id', () => {
		const out = byTag(block, 'OutputVariable')[0]
		const outId = byTag(out, 'ConnectionPointOut')[0].getAttribute('connectionPointOutId')
		const sinkConn = byTag(dataSink, 'Connection')[0]
		expect(outId).toBeTruthy()
		expect(sinkConn.getAttribute('refConnectionPointOutId')).toBe(outId)
	})

	it('places graphic nodes under MainBody > BodyContent(FBD) > Network', () => {
		const bodyContent = firstByType(doc, 'BodyContent', 'FBD')
		expect(byTag(bodyContent, 'Network')).toHaveLength(1)
	})
})

describe('normalizeTc6v201 comment / connector', () => {
	const doc = parse(
		normalizeTc6v201(
			tc6(
				`<body><FBD>` +
					`<comment localId="1"><position x="5" y="5"/><content>note</content></comment>` +
					`<connector localId="2" name="L1"><position x="6" y="6"/>` +
					`<connectionPointIn><connection refLocalId="3"/></connectionPointIn></connector>` +
					`<continuation localId="3" name="L1"><position x="7" y="7"/>` +
					`<connectionPointOut><relPosition x="0" y="0"/></connectionPointOut></continuation>` +
					`</FBD></body>`,
			),
		),
	)

	it('maps comment to CommonObject with Content text', () => {
		const comment = firstByType(doc, 'CommonObject', 'Comment')
		// SimpleText is mixed content — the comment text is element content, not a `value` attribute.
		expect(byTag(comment, 'Content')[0].textContent).toBe('note')
	})

	it('links connector to continuation via connectionPointOutId', () => {
		const connector = firstByType(doc, 'CommonObject', 'Connector')
		const continuation = firstByType(doc, 'CommonObject', 'Continuation')
		const outId = byTag(continuation, 'ConnectionPointOut')[0].getAttribute('connectionPointOutId')
		const conn = byTag(connector, 'Connection')[0]
		expect(outId).toBeTruthy()
		expect(conn.getAttribute('refConnectionPointOutId')).toBe(outId)
	})
})

describe('normalizeTc6v201 variable declarations', () => {
	const doc = parse(
		normalizeTc6v201(
			tc6(
				`<interface>` +
					`<inputVars><variable name="PUTT"><type><BOOL/></type></variable></inputVars>` +
					`<localVars><variable name="Timer_1"><type><TIME/></type>` +
					`<initialValue><simpleValue value="T#170ms"/></initialValue></variable></localVars>` +
					`<localVars><variable name="Inst"><type><derived name="TON"/></type></variable></localVars>` +
					`</interface>`,
			),
		),
	)

	it('maps inputVars under Parameters > InputVars', () => {
		const inputVars = byTag(doc, 'InputVars')[0]
		const variable = byTag(inputVars, 'Variable')[0]
		expect(variable.getAttribute('name')).toBe('PUTT')
		expect(byTag(variable, 'TypeName')[0].textContent).toBe('BOOL')
	})

	it('maps localVars to Vars with initial value and derived type', () => {
		const vars = byTag(doc, 'Vars')
		const names = vars.flatMap((v) => byTag(v, 'Variable')).map((v) => v.getAttribute('name'))
		expect(names).toEqual(expect.arrayContaining(['Timer_1', 'Inst']))

		const timer = vars
			.flatMap((v) => byTag(v, 'Variable'))
			.find((v) => v.getAttribute('name') === 'Timer_1')!
		expect(byTag(timer, 'SimpleValue')[0].getAttribute('value')).toBe('T#170ms')

		const inst = vars
			.flatMap((v) => byTag(v, 'Variable'))
			.find((v) => v.getAttribute('name') === 'Inst')!
		expect(byTag(inst, 'TypeName')[0].textContent).toBe('TON')
	})

	it('does not emit an unsupported LocalVars element', () => {
		expect(byTag(doc, 'LocalVars')).toHaveLength(0)
	})

	it('stamps the required orderWithinParamSet on parameter-set variables', () => {
		const variable = byTag(byTag(doc, 'InputVars')[0], 'Variable')[0]
		expect(variable.getAttribute('orderWithinParamSet')).toBe('0')
	})

	it('sets the required accessSpecifier on Vars', () => {
		const accessSpecifier = byTag(doc, 'Vars')[0].getAttribute('accessSpecifier')
		expect(['private', 'protected', 'internal', 'public']).toContain(accessSpecifier)
	})
})

describe('normalizeTc6v201 headers', () => {
	const doc = parse(
		normalizeTc6v201(
			`<?xml version="1.0" encoding="UTF-8"?>` +
				`<project xmlns="${TC6_NS}" schemaVersion="2.01">` +
				`<fileHeader companyName="ACME" productName="SET" productVersion="1" creationDateTime="2023-09-20T10:58:22"/>` +
				`<contentHeader name="P51" modificationDateTime="2023-09-21T16:58:13"/>` +
				`<types/>` +
				`</project>`,
		),
	)

	it('stamps the IEC 61131-10 schema version on Project', () => {
		expect(doc.documentElement.getAttribute('schemaVersion')).toBe('1.0')
	})

	it('drops creationDateTime from FileHeader (the XSD forbids it there)', () => {
		expect(byTag(doc, 'FileHeader')[0].getAttribute('creationDateTime')).toBeNull()
	})

	it('moves creationDateTime onto ContentHeader (required there)', () => {
		expect(byTag(doc, 'ContentHeader')[0].getAttribute('creationDateTime')).toBe(
			'2023-09-20T10:58:22',
		)
	})
})

describe('normalizeTc6v201 textual bodies', () => {
	it.each([
		['ST', `<body><ST>a := b;</ST></body>`, 'a := b;'],
		['IL', `<body><IL>LD a</IL></body>`, 'LD a'],
	])('maps %s body to BodyContent text', (kind, body, text) => {
		const doc = parse(normalizeTc6v201(tc6(body)))
		const content = firstByType(doc, 'BodyContent', kind)
		expect(byTag(content, kind)[0].textContent).toBe(text)
	})
})

describe('normalizeTc6v201 LD body', () => {
	const doc = parse(
		normalizeTc6v201(
			tc6(
				`<body><LD>` +
					`<leftPowerRail localId="1"><position x="0" y="0"/>` +
					`<connectionPointOut><relPosition x="0" y="0"/></connectionPointOut></leftPowerRail>` +
					`<contact localId="2" negated="true"><position x="50" y="0"/>` +
					`<connectionPointIn><connection refLocalId="1"/></connectionPointIn>` +
					`<connectionPointOut><relPosition x="0" y="0"/></connectionPointOut>` +
					`<variable>X</variable></contact>` +
					`<coil localId="3"><position x="100" y="0"/>` +
					`<connectionPointIn><connection refLocalId="2"/></connectionPointIn>` +
					`<variable>Y</variable></coil>` +
					`</LD></body>`,
			),
		),
	)

	it('maps rails, contacts and coils to LdObject xsi:types', () => {
		const types = byTag(doc, 'LdObject').map((e) => xsi(e))
		expect(types).toEqual(['LeftPowerRail', 'Contact', 'Coil'])
	})

	it('carries operand and negation, wired via connectionPointOutId', () => {
		const contact = firstByType(doc, 'LdObject', 'Contact')
		expect(contact.getAttribute('operand')).toBe('X')
		expect(contact.getAttribute('negated')).toBe('true')

		const rail = firstByType(doc, 'LdObject', 'LeftPowerRail')
		const railOutId = byTag(rail, 'ConnectionPointOut')[0].getAttribute('connectionPointOutId')
		const contactConn = byTag(contact, 'Connection')[0]
		expect(railOutId).toBeTruthy()
		expect(contactConn.getAttribute('refConnectionPointOutId')).toBe(railOutId)
	})

	it('places LD objects under BodyContent(LD) > Rung', () => {
		const content = firstByType(doc, 'BodyContent', 'LD')
		expect(byTag(content, 'Rung')).toHaveLength(1)
	})
})
