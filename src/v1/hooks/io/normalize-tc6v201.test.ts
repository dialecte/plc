import { normalizeTc6v201 } from './io-hooks'

import { describe, expect, it } from 'vitest'

/**
 * Every fixture file of the folder, by path. Every file name is written in full in the tables below (the test-code
 * freeze finds a file by its name in this text).
 */
const FIXTURES = import.meta.glob<string>('./fixtures/tc6/*.xml', {
	query: '?raw',
	import: 'default',
	eager: true,
})

const TC6_NS = 'http://www.plcopen.org/xml/tc6_0201'

/** A TC6 v2.01 input and the IEC 61131-10 text the DOM implementation produced for it, run in headless Chromium. */
type GoldenCase = { name: string; input: string; golden: string }

/** A TC6 v2.01 input that must be refused with the parse error prefix. */
type ParseErrorCase = { name: string; input: string }

/** An input the detection (`isTc6v201`, core's `inspectXml`) refuses before the normaliser starts. */
type DetectionRejectedCase = { name: string; input: string }

/** The text of a fixture file; a name no file carries is a mistake of this test, not an empty input. */
function readFixture(params: { file: string }): string {
	const text = FIXTURES[`./fixtures/tc6/${params.file}`]
	if (text === undefined) throw new Error(`no fixture file ${params.file} in fixtures/tc6`)
	return text
}

const GOLDEN_CASES: readonly GoldenCase[] = [
	{
		name: 'doctype-literal-bracket',
		input: 'doctype-literal-bracket.tc6.xml',
		golden: 'doctype-literal-bracket.iec.xml',
	},
	{
		name: 'doctype-literal-quotes',
		input: 'doctype-literal-quotes.tc6.xml',
		golden: 'doctype-literal-quotes.iec.xml',
	},
	{
		name: 'doctype-literal-single-bracket',
		input: 'doctype-literal-single-bracket.tc6.xml',
		golden: 'doctype-literal-single-bracket.iec.xml',
	},
	{
		name: 'pi-double-question',
		input: 'pi-double-question.tc6.xml',
		golden: 'pi-double-question.iec.xml',
	},
	{
		name: 'pi-double-question-last',
		input: 'pi-double-question-last.tc6.xml',
		golden: 'pi-double-question-last.iec.xml',
	},
	{
		name: 'scanner-apostrophe-value',
		input: 'scanner-apostrophe-value.tc6.xml',
		golden: 'scanner-apostrophe-value.iec.xml',
	},
	{
		name: 'scanner-cdata-quoted-tab',
		input: 'scanner-cdata-quoted-tab.tc6.xml',
		golden: 'scanner-cdata-quoted-tab.iec.xml',
	},
	{
		name: 'scanner-comment-lone-quote',
		input: 'scanner-comment-lone-quote.tc6.xml',
		golden: 'scanner-comment-lone-quote.iec.xml',
	},
	{
		name: 'scanner-pi-lone-quote',
		input: 'scanner-pi-lone-quote.tc6.xml',
		golden: 'scanner-pi-lone-quote.iec.xml',
	},
	{
		name: 'attribute-values',
		input: 'attribute-values.tc6.xml',
		golden: 'attribute-values.iec.xml',
	},
	{
		name: 'attribute-values-pou-name',
		input: 'attribute-values-pou-name.tc6.xml',
		golden: 'attribute-values-pou-name.iec.xml',
	},
	{ name: 'body-il', input: 'body-il.tc6.xml', golden: 'body-il.iec.xml' },
	{ name: 'body-ld', input: 'body-ld.tc6.xml', golden: 'body-ld.iec.xml' },
	{ name: 'body-priority', input: 'body-priority.tc6.xml', golden: 'body-priority.iec.xml' },
	{ name: 'body-st', input: 'body-st.tc6.xml', golden: 'body-st.iec.xml' },
	{
		name: 'comment-connector',
		input: 'comment-connector.tc6.xml',
		golden: 'comment-connector.iec.xml',
	},
	{ name: 'comment-content', input: 'comment-content.tc6.xml', golden: 'comment-content.iec.xml' },
	{ name: 'cr-line-ends', input: 'cr-line-ends.tc6.xml', golden: 'cr-line-ends.iec.xml' },
	{ name: 'crlf-line-ends', input: 'crlf-line-ends.tc6.xml', golden: 'crlf-line-ends.iec.xml' },
	{
		name: 'declaration-encoding-bogus',
		input: 'declaration-encoding-bogus.tc6.xml',
		golden: 'declaration-encoding-bogus.iec.xml',
	},
	{
		name: 'declaration-encoding-utf16',
		input: 'declaration-encoding-utf16.tc6.xml',
		golden: 'declaration-encoding-utf16.iec.xml',
	},
	{
		name: 'declaration-latin1',
		input: 'declaration-latin1.tc6.xml',
		golden: 'declaration-latin1.iec.xml',
	},
	{
		name: 'declaration-none',
		input: 'declaration-none.tc6.xml',
		golden: 'declaration-none.iec.xml',
	},
	{
		name: 'declaration-single-quoted',
		input: 'declaration-single-quoted.tc6.xml',
		golden: 'declaration-single-quoted.iec.xml',
	},
	{
		name: 'declaration-version-1-1',
		input: 'declaration-version-1-1.tc6.xml',
		golden: 'declaration-version-1-1.iec.xml',
	},
	{
		name: 'decoy-body-kinds',
		input: 'decoy-body-kinds.tc6.xml',
		golden: 'decoy-body-kinds.iec.xml',
	},
	{ name: 'decoy-fbd', input: 'decoy-fbd.tc6.xml', golden: 'decoy-fbd.iec.xml' },
	{ name: 'decoy-headers', input: 'decoy-headers.tc6.xml', golden: 'decoy-headers.iec.xml' },
	{ name: 'decoy-ld', input: 'decoy-ld.tc6.xml', golden: 'decoy-ld.iec.xml' },
	{ name: 'decoy-pou-parts', input: 'decoy-pou-parts.tc6.xml', golden: 'decoy-pou-parts.iec.xml' },
	{
		name: 'decoy-variable-parts',
		input: 'decoy-variable-parts.tc6.xml',
		golden: 'decoy-variable-parts.iec.xml',
	},
	{ name: 'doctype-bare', input: 'doctype-bare.tc6.xml', golden: 'doctype-bare.iec.xml' },
	{ name: 'fbd-block-bare', input: 'fbd-block-bare.tc6.xml', golden: 'fbd-block-bare.iec.xml' },
	{ name: 'fbd-block-pins', input: 'fbd-block-pins.tc6.xml', golden: 'fbd-block-pins.iec.xml' },
	{
		name: 'fbd-duplicate-localid',
		input: 'fbd-duplicate-localid.tc6.xml',
		golden: 'fbd-duplicate-localid.iec.xml',
	},
	{ name: 'fbd-elements', input: 'fbd-elements.tc6.xml', golden: 'fbd-elements.iec.xml' },
	{ name: 'fbd-empty', input: 'fbd-empty.tc6.xml', golden: 'fbd-empty.iec.xml' },
	{
		name: 'fbd-missing-localid',
		input: 'fbd-missing-localid.tc6.xml',
		golden: 'fbd-missing-localid.iec.xml',
	},
	{
		name: 'fbd-missing-position',
		input: 'fbd-missing-position.tc6.xml',
		golden: 'fbd-missing-position.iec.xml',
	},
	{
		name: 'fbd-unresolved-refs',
		input: 'fbd-unresolved-refs.tc6.xml',
		golden: 'fbd-unresolved-refs.iec.xml',
	},
	{ name: 'fbd-wiring', input: 'fbd-wiring.tc6.xml', golden: 'fbd-wiring.iec.xml' },
	{ name: 'headers', input: 'headers.tc6.xml', golden: 'headers.iec.xml' },
	{
		name: 'headers-attribute-order',
		input: 'headers-attribute-order.tc6.xml',
		golden: 'headers-attribute-order.iec.xml',
	},
	{
		name: 'headers-content-only',
		input: 'headers-content-only.tc6.xml',
		golden: 'headers-content-only.iec.xml',
	},
	{
		name: 'headers-creation-both',
		input: 'headers-creation-both.tc6.xml',
		golden: 'headers-creation-both.iec.xml',
	},
	{
		name: 'headers-empty-values',
		input: 'headers-empty-values.tc6.xml',
		golden: 'headers-empty-values.iec.xml',
	},
	{
		name: 'headers-file-only',
		input: 'headers-file-only.tc6.xml',
		golden: 'headers-file-only.iec.xml',
	},
	{
		name: 'headers-forbidden-attributes',
		input: 'headers-forbidden-attributes.tc6.xml',
		golden: 'headers-forbidden-attributes.iec.xml',
	},
	{
		name: 'interface-empty-sections',
		input: 'interface-empty-sections.tc6.xml',
		golden: 'interface-empty-sections.iec.xml',
	},
	{
		name: 'interface-only-inout',
		input: 'interface-only-inout.tc6.xml',
		golden: 'interface-only-inout.iec.xml',
	},
	{
		name: 'interface-only-outputs',
		input: 'interface-only-outputs.tc6.xml',
		golden: 'interface-only-outputs.iec.xml',
	},
	{
		name: 'interface-repeated-sections',
		input: 'interface-repeated-sections.tc6.xml',
		golden: 'interface-repeated-sections.iec.xml',
	},
	{
		name: 'interface-section-order',
		input: 'interface-section-order.tc6.xml',
		golden: 'interface-section-order.iec.xml',
	},
	{ name: 'ld-bare', input: 'ld-bare.tc6.xml', golden: 'ld-bare.iec.xml' },
	{
		name: 'ld-duplicate-localid',
		input: 'ld-duplicate-localid.tc6.xml',
		golden: 'ld-duplicate-localid.iec.xml',
	},
	{ name: 'ld-empty', input: 'ld-empty.tc6.xml', golden: 'ld-empty.iec.xml' },
	{ name: 'ld-kinds', input: 'ld-kinds.tc6.xml', golden: 'ld-kinds.iec.xml' },
	{
		name: 'ld-missing-localid',
		input: 'ld-missing-localid.tc6.xml',
		golden: 'ld-missing-localid.iec.xml',
	},
	{
		name: 'ld-unmapped-producer',
		input: 'ld-unmapped-producer.tc6.xml',
		golden: 'ld-unmapped-producer.iec.xml',
	},
	{
		name: 'leading-whitespace-no-declaration',
		input: 'leading-whitespace-no-declaration.tc6.xml',
		golden: 'leading-whitespace-no-declaration.iec.xml',
	},
	{
		name: 'nested-connection',
		input: 'nested-connection.tc6.xml',
		golden: 'nested-connection.iec.xml',
	},
	{ name: 'nested-pou', input: 'nested-pou.tc6.xml', golden: 'nested-pou.iec.xml' },
	{
		name: 'nested-variables',
		input: 'nested-variables.tc6.xml',
		golden: 'nested-variables.iec.xml',
	},
	{ name: 'non-ascii-names', input: 'non-ascii-names.tc6.xml', golden: 'non-ascii-names.iec.xml' },
	{ name: 'pi-after-root', input: 'pi-after-root.tc6.xml', golden: 'pi-after-root.iec.xml' },
	{ name: 'pou-bare', input: 'pou-bare.tc6.xml', golden: 'pou-bare.iec.xml' },
	{ name: 'pou-types', input: 'pou-types.tc6.xml', golden: 'pou-types.iec.xml' },
	{ name: 'prefixed-fbd', input: 'prefixed-fbd.tc6.xml', golden: 'prefixed-fbd.iec.xml' },
	{ name: 'prefixed-ld', input: 'prefixed-ld.tc6.xml', golden: 'prefixed-ld.iec.xml' },
	{
		name: 'prefixed-namespace',
		input: 'prefixed-namespace.tc6.xml',
		golden: 'prefixed-namespace.iec.xml',
	},
	{ name: 'project-bare', input: 'project-bare.tc6.xml', golden: 'project-bare.iec.xml' },
	{
		name: 'quirk-foreign-namespace',
		input: 'quirk-foreign-namespace.tc6.xml',
		golden: 'quirk-foreign-namespace.iec.xml',
	},
	{
		name: 'quirk-prefixed-attributes',
		input: 'quirk-prefixed-attributes.tc6.xml',
		golden: 'quirk-prefixed-attributes.iec.xml',
	},
	{
		name: 'quirk-selector-depth',
		input: 'quirk-selector-depth.tc6.xml',
		golden: 'quirk-selector-depth.iec.xml',
	},
	{
		name: 'quirk-types-nested-first',
		input: 'quirk-types-nested-first.tc6.xml',
		golden: 'quirk-types-nested-first.iec.xml',
	},
	{
		name: 'realworld-pretty-crlf',
		input: 'realworld-pretty-crlf.tc6.xml',
		golden: 'realworld-pretty-crlf.iec.xml',
	},
	{
		name: 'realworld-pretty-tabs-st',
		input: 'realworld-pretty-tabs-st.tc6.xml',
		golden: 'realworld-pretty-tabs-st.iec.xml',
	},
	{
		name: 'root-not-project',
		input: 'root-not-project.tc6.xml',
		golden: 'root-not-project.iec.xml',
	},
	{ name: 'st-comments-pi', input: 'st-comments-pi.tc6.xml', golden: 'st-comments-pi.iec.xml' },
	{ name: 'st-xhtml-cdata', input: 'st-xhtml-cdata.tc6.xml', golden: 'st-xhtml-cdata.iec.xml' },
	{
		name: 'text-body-whitespace',
		input: 'text-body-whitespace.tc6.xml',
		golden: 'text-body-whitespace.iec.xml',
	},
	{ name: 'text-escapes', input: 'text-escapes.tc6.xml', golden: 'text-escapes.iec.xml' },
	{
		name: 'variable-declarations',
		input: 'variable-declarations.tc6.xml',
		golden: 'variable-declarations.iec.xml',
	},
	{
		name: 'variable-initial-values',
		input: 'variable-initial-values.tc6.xml',
		golden: 'variable-initial-values.iec.xml',
	},
	{
		name: 'variable-nested-not-direct',
		input: 'variable-nested-not-direct.tc6.xml',
		golden: 'variable-nested-not-direct.iec.xml',
	},
	{ name: 'variable-types', input: 'variable-types.tc6.xml', golden: 'variable-types.iec.xml' },
	{ name: 'xml-lang-space', input: 'xml-lang-space.tc6.xml', golden: 'xml-lang-space.iec.xml' },
].map(function loadGoldenCase(entry) {
	return {
		name: entry.name,
		input: readFixture({ file: entry.input }),
		golden: readFixture({ file: entry.golden }),
	}
})

/**
 * Inputs the parser refuses. The well-formedness classes Chromium rejects and the strict sax parser accepts are not
 * pinned here (a parser follow-up).
 */
const PARSE_ERROR_CASES: readonly ParseErrorCase[] = [
	{ name: 'doctype-attlist', input: 'doctype-attlist.tc6.xml' },
	{ name: 'doctype-empty-subset', input: 'doctype-empty-subset.tc6.xml' },
	{ name: 'doctype-internal-entity', input: 'doctype-internal-entity.tc6.xml' },
	{ name: 'malformed', input: 'malformed.tc6.xml' },
	{ name: 'malformed-char-ref-nul', input: 'malformed-char-ref-nul.tc6.xml' },
	{ name: 'malformed-mismatched-end-tag', input: 'malformed-mismatched-end-tag.tc6.xml' },
	{ name: 'malformed-text-after-root', input: 'malformed-text-after-root.tc6.xml' },
	{ name: 'malformed-pi-splits-entity', input: 'malformed-pi-splits-entity.tc6.xml' },
	{ name: 'malformed-pi-splits-char-ref', input: 'malformed-pi-splits-char-ref.tc6.xml' },
	{ name: 'malformed-pi-then-bom', input: 'malformed-pi-then-bom.tc6.xml' },
	{ name: 'malformed-unclosed-pi', input: 'malformed-unclosed-pi.tc6.xml' },
	{ name: 'malformed-unbound-prefix', input: 'malformed-unbound-prefix.tc6.xml' },
	{
		name: 'malformed-undeclared-entity-attribute',
		input: 'malformed-undeclared-entity-attribute.tc6.xml',
	},
].map(function loadParseErrorCase(entry) {
	return { name: entry.name, input: readFixture({ file: entry.input }) }
})

const DETECTION_REJECTED_CASES: readonly DetectionRejectedCase[] = [
	{
		name: 'unescaped-ampersand',
		input: '<Project xmlns="urn:iec">a & b</Project>',
	},
	{
		name: 'valueless-attribute',
		input: `<project xmlns="${TC6_NS}" TC6><types a=1>`,
	},
]

describe('normalizeTc6v201 golden output', () => {
	it.each(GOLDEN_CASES)('$name -> the golden output, byte for byte', ({ input, golden }) => {
		expect(normalizeTc6v201(input)).toBe(golden)
	})
})

describe('normalizeTc6v201 parse errors', () => {
	it.each(PARSE_ERROR_CASES)(
		'$name -> throws an Error with the TC6 v201 parse error prefix',
		({ input }) => {
			// the message after the prefix is the parser's
			expect(() => normalizeTc6v201(input)).toThrow(Error)
			expect(() => normalizeTc6v201(input)).toThrow(/^TC6 v201 parse error: /)
		},
	)
})

describe('normalizeTc6v201 rejected by the detection', () => {
	// isTc6v201 runs first and its error is core's, unprefixed: only the Error is pinned
	it.each(DETECTION_REJECTED_CASES)('$name -> throws an Error', ({ input }) => {
		expect(() => normalizeTc6v201(input)).toThrow(Error)
	})
})
