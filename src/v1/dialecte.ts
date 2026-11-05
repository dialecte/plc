import { Plc } from './config'
import { PLC_DIALECTE } from './declaration.constants'

import { Project } from '@dialecte/core'

import type { StorageParam, ExtensionModules } from '@dialecte/core'

/**
 * Create a PLC project: its config, extensions and import hook come from the dialecte's declaration (`PLC_DIALECTE`).
 * Call .open(name) to initialize the store and hydrate state.
 *
 * @intent open a PLC project, import and edit PLCopen files, register custom extensions on a PLC project
 */
export function createPlcProject<
	CustomModules extends ExtensionModules = Record<never, never>,
>(params?: { storage?: StorageParam; extensions?: CustomModules }): Plc.Project<CustomModules> {
	const { storage = { type: 'local' }, extensions } = params ?? {}

	return new Project({
		configs: PLC_DIALECTE.configs,
		defaultConfigKey: PLC_DIALECTE.defaultConfigKey,
		storage,
		extensions: {
			base: PLC_DIALECTE.extensions,
			custom: extensions,
		},
		hooks: PLC_DIALECTE.createHooks(),
		dialecteId: PLC_DIALECTE.id,
		dialecteVersion: PLC_DIALECTE.version,
	}) as Plc.Project<CustomModules>
}
