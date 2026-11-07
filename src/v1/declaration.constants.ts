import { version } from '../../package.json'
import { PLC_DIALECTE_CONFIG } from './config/dialecte.config'
import { PLC_EXTENSION_MODULES } from './extensions'
import { IO_HOOKS } from './hooks'

import { defineDialecte } from '@dialecte/core'

import type { Config } from './config/dialecte.config'
import type { DialecteDeclaration, DialecteHooks } from '@dialecte/core'

/**
 * Makes the hooks of one owner: the import hook that normalises a PLCopen TC6 v2.01 file to
 * IEC 61131-10 form before it is parsed. A new object on each call, so no owner shares a hook object with another.
 */
function createPlcHooks(): DialecteHooks<Config> {
	return { ...IO_HOOKS }
}

/**
 * The PLC dialecte, declared once: its id, the package's version, its config, its extensions and how its hooks are
 * made. `createPlcProject` and the test helpers are built from it; pass it to whatever takes a declaration.
 *
 * @intent get the PLC dialecte's declaration, derive a project or test helpers from the PLC dialecte
 */
export const PLC_DIALECTE: DialecteDeclaration<Config, typeof PLC_EXTENSION_MODULES, 'plc'> =
	defineDialecte({
		id: 'plc/v1',
		version,
		configs: { plc: PLC_DIALECTE_CONFIG },
		defaultConfigKey: 'plc',
		extensions: PLC_EXTENSION_MODULES,
		createHooks: createPlcHooks,
	})
