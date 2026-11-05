import { version } from '../../package.json'
import { PLC_DIALECTE_CONFIG } from './config'
import { PLC_EXTENSION_MODULES } from './extensions'

import { describe, expect, it } from 'vitest'

import { PLC_DIALECTE } from '@/v1'

/**
 * Every fixture file of the hook folder, by path. Every file name is written in full where it is used (the test-code
 * freeze finds a file by its name in this text).
 */
const FIXTURES = import.meta.glob<string>('./hooks/io/fixtures/tc6/*.xml', {
	query: '?raw',
	import: 'default',
	eager: true,
})

/** The text of a fixture file; a name no file carries is a mistake of this test, not an empty input. */
function readFixture(params: { file: string }): string {
	const text = FIXTURES[`./hooks/io/fixtures/tc6/${params.file}`]
	if (text === undefined) throw new Error(`no fixture file ${params.file} in hooks/io/fixtures/tc6`)
	return text
}

describe('PLC_DIALECTE', () => {
	type TestCase = { read: () => unknown; expected: unknown }
	const testCases: Record<string, TestCase> = {
		'id -> plc/v1, the dialecte its projects are stored under': {
			read: () => PLC_DIALECTE.id,
			expected: 'plc/v1',
		},
		"version -> the package's version, the one a view and its engine must share": {
			read: () => PLC_DIALECTE.version,
			expected: version,
		},
		'configs -> plc alone, the package config': {
			read: () => ({
				keys: Object.keys(PLC_DIALECTE.configs),
				plc: PLC_DIALECTE.configs.plc === PLC_DIALECTE_CONFIG,
			}),
			expected: { keys: ['plc'], plc: true },
		},
		'default config key -> plc: a file imported under no config is a PLC file': {
			read: () => PLC_DIALECTE.defaultConfigKey,
			expected: 'plc',
		},
		"extensions -> the package's extension modules": {
			read: () => PLC_DIALECTE.extensions === PLC_EXTENSION_MODULES,
			expected: true,
		},
		'createHooks -> hooks whose beforeImport turns a TC6 input into the IEC golden': {
			read: () =>
				PLC_DIALECTE.createHooks().beforeImport?.(readFixture({ file: 'fbd-wiring.tc6.xml' })),
			expected: readFixture({ file: 'fbd-wiring.iec.xml' }),
		},
		'createHooks, called twice -> two distinct hook objects, each turning a TC6 input into the IEC golden: no realm shares hook state':
			{
				read: () => {
					const first = PLC_DIALECTE.createHooks()
					const second = PLC_DIALECTE.createHooks()
					const input = readFixture({ file: 'fbd-wiring.tc6.xml' })
					return {
						distinct: first !== second,
						first: first.beforeImport?.(input),
						second: second.beforeImport?.(input),
					}
				},
				expected: {
					distinct: true,
					first: readFixture({ file: 'fbd-wiring.iec.xml' }),
					second: readFixture({ file: 'fbd-wiring.iec.xml' }),
				},
			},
	}

	for (const [name, { read, expected }] of Object.entries(testCases)) {
		it(name, () => {
			expect(read()).toEqual(expected)
		})
	}
})
