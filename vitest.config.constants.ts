import type { DeclaredTestFile } from './vitest.config.types'

/**
 * The test files that need a browser API: the `browser` project runs them, the `node` project leaves them out. Every
 * other test file runs in node, on the in-memory store.
 */
export const BROWSER_ONLY_TEST_FILES: readonly DeclaredTestFile[] = [
	{
		path: 'src/v1/declaration.engine.test.ts',
		why: "a project on `sqlite` storage: an engine worker of the declaration and the origin's private file system",
	},
	{
		path: 'src/plc.default-store.test.ts',
		why: 'a project on the default `local` store: real IndexedDB, listed by `indexedDB.databases()`',
	},
	{
		path: 'src/v1/hooks/io/normalize-tc6v201.worker.test.ts',
		why: "starts a real dedicated Worker to run plc's TC6 normaliser where core runs a dialecte's import hooks, an engine worker with no DOM",
	},
]

/**
 * The test files that read the package from disk or start node: the `browser-all` project leaves them out. Empty: no
 * test of this package needs node.
 */
export const NODE_ONLY_TEST_FILES: readonly DeclaredTestFile[] = []
