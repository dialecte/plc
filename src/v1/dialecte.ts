import { Plc } from './config'
import { PLC_DIALECTE_CONFIG } from './config/dialecte.config'
import { PLC_EXTENSION_MODULES } from './extensions'

import { Project } from '@dialecte/core'

import type { StorageParam, ExtensionModules } from '@dialecte/core'

/**
 * Create a PLC project with pre-configured config and extensions.
 * Call .open(name) to initialize the store and hydrate state.
 */
export function createPlcProject<
	CustomModules extends ExtensionModules = Record<never, never>,
>(params?: { storage?: StorageParam; extensions?: CustomModules }): Plc.Project<CustomModules> {
	const { storage = { type: 'local' }, extensions } = params ?? {}

	return new Project({
		configs: { plc: PLC_DIALECTE_CONFIG },
		defaultConfigKey: 'plc',
		storage,
		extensions: {
			base: PLC_EXTENSION_MODULES,
			custom: extensions,
		},
	}) as Plc.Project<CustomModules>
}
