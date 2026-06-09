import { createPlcProject } from './dialecte'

import { describe, it, expect } from 'vitest'

describe('createPlcProject', () => {
	it('returns a project instance', () => {
		const project = createPlcProject()
		expect(project).toBeDefined()
	})
})
