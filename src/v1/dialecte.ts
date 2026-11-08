import { PLC_DIALECTE } from './declaration.constants'

import { createProjectFactory } from '@dialecte/core'

import type { Config } from './config/dialecte.config'
import type { PLC_EXTENSION_MODULES } from './extensions'
import type { ProjectFactory } from '@dialecte/core'

/**
 * Create a PLC project: its config, extensions and import hook come from the dialecte's declaration (`PLC_DIALECTE`).
 * Call .open(name) to initialize the store and hydrate state; the store is the local one unless `storage` names
 * another. `createPlcProject.destroyProject({ name, storage })` deletes a PLC project without opening it, and
 * `createPlcProject.dialecte` is the declaration.
 *
 * @intent open a PLC project, import and edit PLCopen files, register custom extensions on a PLC project, delete a PLC project without opening it
 */
export const createPlcProject: ProjectFactory<Config, typeof PLC_EXTENSION_MODULES, 'plc'> =
	/* @__PURE__ */ createProjectFactory({ dialecte: PLC_DIALECTE })
