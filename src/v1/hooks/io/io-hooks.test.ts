import { isTc6v201, normalizeTc6v201 } from './io-hooks'

import { describe, it, expect } from 'vitest'

import { PLC_NAMESPACES } from '@/v1/config/namespaces'
import { assertExpectedElementQueries, assertUnexpectedElementQueries } from '@/v1/test'

/** Every fixture file of the folder, by path. */
const FIXTURES = import.meta.glob<string>('./fixtures/tc6/*.xml', {
	query: '?raw',
	import: 'default',
	eager: true,
})

const TC6_NS = 'http://www.plcopen.org/xml/tc6_0201'
const IEC_NS = PLC_NAMESPACES.default.uri

/** The text of a fixture file; a name no file carries is a mistake of this test, not an empty input. */
function readFixture(params: { file: string }): string {
	const text = FIXTURES[`./fixtures/tc6/${params.file}`]
	if (text === undefined) throw new Error(`no fixture file ${params.file} in fixtures/tc6`)
	return text
}

const fbdWiringInput = readFixture({ file: 'fbd-wiring.tc6.xml' })
const commentConnectorInput = readFixture({ file: 'comment-connector.tc6.xml' })
const variableDeclarationsInput = readFixture({ file: 'variable-declarations.tc6.xml' })
const headersInput = readFixture({ file: 'headers.tc6.xml' })
const bodyStInput = readFixture({ file: 'body-st.tc6.xml' })
const bodyIlInput = readFixture({ file: 'body-il.tc6.xml' })
const bodyLdInput = readFixture({ file: 'body-ld.tc6.xml' })

describe('isTc6v201', () => {
	it.each([
		['TC6 namespace present', `<project xmlns="${TC6_NS}"/>`, true],
		['canonical IEC document', `<Project xmlns="${IEC_NS}"/>`, false],
		['unrelated xml', `<foo/>`, false],
		[
			'TC6 project under another root',
			`<export xmlns="${TC6_NS}"><project><types/></project></export>`,
			false,
		],
		[
			'TC6 project held as data in an IEC document',
			`<Project xmlns="${IEC_NS}"><AddData><Data><project xmlns="${TC6_NS}"/></Data></AddData></Project>`,
			false,
		],
		['TC6 root after a byte order mark', `\uFEFF<project xmlns="${TC6_NS}"/>`, true],
		[
			'TC6 root after a comment and a processing instruction',
			`<!-- c --><?p x?><project xmlns="${TC6_NS}"/>`,
			true,
		],
	])('%s', (_label, xml, expected) => {
		expect(isTc6v201(xml)).toBe(expected)
	})
})

describe('normalizeTc6v201 passthrough', () => {
	it('returns non-TC6 input unchanged', () => {
		const xml = `<Project xmlns="${IEC_NS}"/>`
		expect(normalizeTc6v201(xml)).toBe(xml)
	})

	it('returns an unclosed non-TC6 input unchanged', () => {
		const xml = `<Project xmlns="${IEC_NS}"><unclosed>`
		expect(normalizeTc6v201(xml)).toBe(xml)
	})

	it('returns a tc6_0200 namespace input unchanged', () => {
		const xml = `<project xmlns="http://www.plcopen.org/xml/tc6_0200"><types/></project>`
		expect(normalizeTc6v201(xml)).toBe(xml)
	})
})

describe('normalizeTc6v201 FBD wiring', () => {
	const dataSource = '//default:FbdObject[@xsi:type="DataSource"]'
	const block = '//default:FbdObject[@xsi:type="Block"]'
	const dataSink = '//default:FbdObject[@xsi:type="DataSink"]'

	it('maps inVariable to a DataSource with a direct ConnectionPointOut (no OutputVariables wrapper)', () => {
		// The connection point sits directly on the FbdObject; the OutputVariables
		// wrapper is only valid on xsi:type="Block".
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(fbdWiringInput),
				queries: [`${dataSource}[@identifier="A"]/default:ConnectionPointOut`],
			}),
		).not.toThrow()
		expect(() =>
			assertUnexpectedElementQueries({
				xml: normalizeTc6v201(fbdWiringInput),
				queries: [
					`${dataSource}//default:OutputVariables`,
					`${dataSource}//default:OutputVariable`,
				],
			}),
		).not.toThrow()
	})

	it('maps outVariable to a DataSink with a direct ConnectionPointIn (no InputVariables wrapper)', () => {
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(fbdWiringInput),
				queries: [`${dataSink}[@identifier="B"]/default:ConnectionPointIn`],
			}),
		).not.toThrow()
		expect(() =>
			assertUnexpectedElementQueries({
				xml: normalizeTc6v201(fbdWiringInput),
				queries: [`${dataSink}//default:InputVariables`, `${dataSink}//default:InputVariable`],
			}),
		).not.toThrow()
	})

	it('maps block with positioned RelPosition and typed pins', () => {
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(fbdWiringInput),
				queries: [
					`${block}[@typeName="AND"]`,
					// the block's own position is its first child
					`${block}/*[1][self::default:RelPosition][@x="100"][@y="50"]`,
					`${block}/default:InputVariables/default:InputVariable[1][@parameterName="IN1"][@negated="true"]`,
				],
			}),
		).not.toThrow()
	})

	it('wires DataSource output -> block IN1 via connectionPointOutId', () => {
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(fbdWiringInput),
				queries: [
					`${dataSource}/default:ConnectionPointOut[string-length(@connectionPointOutId) > 0]`,
					`${block}/default:InputVariables/default:InputVariable[1]/default:ConnectionPointIn/default:Connection[1][@refConnectionPointOutId = ${dataSource}/default:ConnectionPointOut/@connectionPointOutId]`,
				],
			}),
		).not.toThrow()
	})

	it('wires block OUT -> DataSink via formalParameter-resolved id', () => {
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(fbdWiringInput),
				queries: [
					`${block}/default:OutputVariables/default:OutputVariable[1]/default:ConnectionPointOut[string-length(@connectionPointOutId) > 0]`,
					`${dataSink}/default:ConnectionPointIn/default:Connection[1][@refConnectionPointOutId = ${block}/default:OutputVariables/default:OutputVariable[1]/default:ConnectionPointOut/@connectionPointOutId]`,
				],
			}),
		).not.toThrow()
	})

	it('places graphic nodes under MainBody > BodyContent(FBD) > Network', () => {
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(fbdWiringInput),
				queries: [
					'//default:BodyContent[@xsi:type="FBD"][count(default:Network) = 1][count(.//default:Network) = 1]',
				],
			}),
		).not.toThrow()
	})
})

describe('normalizeTc6v201 comment / connector', () => {
	it('maps comment to CommonObject with Content text', () => {
		// SimpleText is mixed content — the comment text is element content, not a `value` attribute.
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(commentConnectorInput),
				queries: ['//default:CommonObject[@xsi:type="Comment"]/default:Content[. = "note"]'],
			}),
		).not.toThrow()
	})

	it('links connector to continuation via connectionPointOutId', () => {
		const continuation = '//default:CommonObject[@xsi:type="Continuation"]'
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(commentConnectorInput),
				queries: [
					`${continuation}/default:ConnectionPointOut[string-length(@connectionPointOutId) > 0]`,
					`//default:CommonObject[@xsi:type="Connector"]/default:ConnectionPointIn/default:Connection[1][@refConnectionPointOutId = ${continuation}/default:ConnectionPointOut/@connectionPointOutId]`,
				],
			}),
		).not.toThrow()
	})
})

describe('normalizeTc6v201 variable declarations', () => {
	it('maps inputVars under Parameters > InputVars', () => {
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(variableDeclarationsInput),
				queries: [
					'//default:Parameters/default:InputVars/default:Variable[1][@name="PUTT"]/default:Type/default:TypeName[. = "BOOL"]',
				],
			}),
		).not.toThrow()
	})

	it('maps localVars to Vars with initial value and derived type', () => {
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(variableDeclarationsInput),
				queries: [
					'//default:Vars/default:Variable[@name="Timer_1"]/default:InitialValue/default:SimpleValue[@value="T#170ms"]',
					'//default:Vars/default:Variable[@name="Inst"]/default:Type/default:TypeName[. = "TON"]',
				],
			}),
		).not.toThrow()
	})

	it('does not emit an unsupported LocalVars element', () => {
		expect(() =>
			assertUnexpectedElementQueries({
				xml: normalizeTc6v201(variableDeclarationsInput),
				queries: ['//default:LocalVars'],
			}),
		).not.toThrow()
	})

	it('stamps the required orderWithinParamSet on parameter-set variables', () => {
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(variableDeclarationsInput),
				queries: ['//default:InputVars/default:Variable[1][@orderWithinParamSet="0"]'],
			}),
		).not.toThrow()
	})

	it('sets the required accessSpecifier on Vars', () => {
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(variableDeclarationsInput),
				queries: ['//default:Vars'],
			}),
		).not.toThrow()
		expect(() =>
			assertUnexpectedElementQueries({
				xml: normalizeTc6v201(variableDeclarationsInput),
				queries: [
					'//default:Vars[not(@accessSpecifier = "private" or @accessSpecifier = "protected" or @accessSpecifier = "internal" or @accessSpecifier = "public")]',
				],
			}),
		).not.toThrow()
	})
})

describe('normalizeTc6v201 headers', () => {
	it('stamps the IEC 61131-10 schema version on Project', () => {
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(headersInput),
				queries: ['/default:Project[@schemaVersion="1.0"]'],
			}),
		).not.toThrow()
	})

	it('drops creationDateTime from FileHeader (the XSD forbids it there)', () => {
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(headersInput),
				queries: ['//default:Project/default:FileHeader[@companyName="ACME"]'],
			}),
		).not.toThrow()
		expect(() =>
			assertUnexpectedElementQueries({
				xml: normalizeTc6v201(headersInput),
				queries: ['//default:Project/default:FileHeader[@creationDateTime]'],
			}),
		).not.toThrow()
	})

	it('moves creationDateTime onto ContentHeader (required there)', () => {
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(headersInput),
				queries: ['//default:ContentHeader[@creationDateTime="2023-09-20T10:58:22"]'],
			}),
		).not.toThrow()
	})
})

describe('normalizeTc6v201 textual bodies', () => {
	it.each([
		['ST', bodyStInput, 'a := b;'],
		['IL', bodyIlInput, 'LD a'],
	])('maps %s body to BodyContent text', (kind, input, text) => {
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(input),
				queries: [`//default:BodyContent[@xsi:type="${kind}"]/default:${kind}[. = "${text}"]`],
			}),
		).not.toThrow()
	})
})

describe('normalizeTc6v201 LD body', () => {
	it('maps rails, contacts and coils to LdObject xsi:types', () => {
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(bodyLdInput),
				queries: [
					'//default:Rung/default:LdObject[1][@xsi:type="LeftPowerRail"]',
					'//default:Rung/default:LdObject[2][@xsi:type="Contact"]',
					'//default:Rung/default:LdObject[3][@xsi:type="Coil"]',
					'/default:Project[count(//default:LdObject) = 3]',
				],
			}),
		).not.toThrow()
	})

	it('carries operand and negation, wired via connectionPointOutId', () => {
		const contact = '//default:LdObject[@xsi:type="Contact"]'
		const rail = '//default:LdObject[@xsi:type="LeftPowerRail"]'
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(bodyLdInput),
				queries: [
					`${contact}[@operand="X"][@negated="true"]`,
					`${rail}/default:ConnectionPointOut[string-length(@connectionPointOutId) > 0]`,
					`${contact}/default:ConnectionPointIn/default:Connection[1][@refConnectionPointOutId = ${rail}/default:ConnectionPointOut/@connectionPointOutId]`,
				],
			}),
		).not.toThrow()
	})

	it('places LD objects under BodyContent(LD) > Rung', () => {
		expect(() =>
			assertExpectedElementQueries({
				xml: normalizeTc6v201(bodyLdInput),
				queries: [
					'//default:BodyContent[@xsi:type="LD"][count(default:Rung) = 1][count(.//default:Rung) = 1]',
				],
			}),
		).not.toThrow()
	})
})

/**
 * The IEC text for the input below, written by hand: the DOM implementation gives a different (wrong) text for it, so
 * it is no recorded output. Derived from the same input without the three skipped elements (its recorded output:
 * leftPowerRail id 1, contact id 2 wired to 1, the coil's connection to localId 9 unresolved), then by what
 * the LD id allocation does to the ids: it numbers every child that holds a connectionPointOut in document order, the
 * skipped ones included (constructor 1, toString 2, __proto__ 3), so the rail becomes 4, the contact 5 and its
 * connection 4, and the coil's connection to localId 9 resolves to the skipped constructor's id 1.
 */
const LD_PROTOTYPE_NAMES_OUTPUT =
	`<Project xmlns="www.iec.ch/public/TC65SC65BWG7TF10" schemaVersion="1.0">` +
	`<FileHeader companyName="Unknown" productName="Unnamed" productVersion="1"/>` +
	`<ContentHeader name="Unnamed" creationDateTime="1970-01-01T00:00:00"/>` +
	`<Types><GlobalNamespace><FunctionBlock name="FB1"><MainBody>` +
	`<BodyContent xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="LD">` +
	`<Rung evaluationOrder="0">` +
	`<LdObject xsi:type="LeftPowerRail"><RelPosition x="0" y="0"/><ConnectionPointOut connectionPointOutId="4"/></LdObject>` +
	`<LdObject xsi:type="Contact" operand="X"><RelPosition x="1" y="0"/>` +
	`<ConnectionPointIn><Connection refConnectionPointOutId="4"/></ConnectionPointIn>` +
	`<ConnectionPointOut connectionPointOutId="5"/></LdObject>` +
	`<LdObject xsi:type="Coil" operand="Y"><RelPosition x="2" y="0"/>` +
	`<ConnectionPointIn><Connection refConnectionPointOutId="1"/></ConnectionPointIn></LdObject>` +
	`</Rung></BodyContent></MainBody></FunctionBlock></GlobalNamespace></Types><Instances/></Project>`

describe('normalizeTc6v201 LD elements without a mapping', () => {
	// element names that are also keys of every JavaScript object must be skipped like any other unmapped element
	const input =
		`<?xml version="1.0" encoding="UTF-8"?>` +
		`<project xmlns="${TC6_NS}"><types><pou name="FB1"><body><LD>` +
		`<constructor localId="9"><position x="0" y="0"/><connectionPointOut/></constructor>` +
		`<toString localId="10"><position x="1" y="0"/><connectionPointOut/></toString>` +
		`<__proto__ localId="11"><position x="2" y="0"/><connectionPointOut/></__proto__>` +
		`<leftPowerRail localId="1"><position x="0" y="0"/><connectionPointOut/></leftPowerRail>` +
		`<contact localId="2"><position x="1" y="0"/>` +
		`<connectionPointIn><connection refLocalId="1"/></connectionPointIn><connectionPointOut/>` +
		`<variable>X</variable></contact>` +
		`<coil localId="3"><position x="2" y="0"/>` +
		`<connectionPointIn><connection refLocalId="9"/></connectionPointIn><variable>Y</variable></coil>` +
		`</LD></body></pou></types></project>`

	it('skips the LD elements named like an Object member, keeping only the mapped LdObjects', () => {
		expect(normalizeTc6v201(input)).toBe(LD_PROTOTYPE_NAMES_OUTPUT)
	})
})
