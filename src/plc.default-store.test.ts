import { describe, it, expect, onTestFinished } from 'vitest'

import { createPlcProject } from '@/v1'

/** The names of the databases IndexedDB lists. */
async function listDatabaseNames(): Promise<(string | undefined)[]> {
	const databases = await indexedDB.databases()
	return databases.map((database) => database.name)
}

/** The PLC project of that name on the local store deleted by the factory, never opened. */
async function destroyLocalProject(params: { name: string }): Promise<void> {
	await createPlcProject.destroyProject({ name: params.name, storage: { type: 'local' } })
}

describe('createPlcProject on the default store', () => {
	it('a project opened with no storage given -> lives in the browser local store: IndexedDB lists its database', async () => {
		const name = `plc-default-store-${crypto.randomUUID()}`
		const project = await createPlcProject().open(name)
		onTestFinished(() => project.destroy())
		await expect(
			indexedDB.databases().then((databases) => databases.map((database) => database.name)),
		).resolves.toContain(name)
	})

	it('a closed project destroyed by name through createPlcProject.destroyProject on the local store -> IndexedDB no longer lists its database', async () => {
		const name = `plc-default-store-${crypto.randomUUID()}`
		onTestFinished(() => {
			indexedDB.deleteDatabase(name)
		})
		const project = await createPlcProject().open(name)
		await project.close()
		await expect(destroyLocalProject({ name })).resolves.toBeUndefined()
		await expect(listDatabaseNames()).resolves.not.toContain(name)
	})
})
