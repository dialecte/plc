import { describe, it, expect, onTestFinished } from 'vitest'

import { createPlcProject } from '@/v1'

describe('createPlcProject on the default store', () => {
	it('a project opened with no storage given -> lives in the browser local store: IndexedDB lists its database', async () => {
		const name = `plc-default-store-${crypto.randomUUID()}`
		const project = await createPlcProject().open(name)
		onTestFinished(() => project.destroy())
		await expect(
			indexedDB.databases().then((databases) => databases.map((database) => database.name)),
		).resolves.toContain(name)
	})
})
