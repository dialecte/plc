import type { DeclaredTestFile } from './vitest.config.types'

/**
 * The test files that need a browser API: the `browser` project runs them, the `node` project leaves them out. Every
 * other test file runs in node, on the in-memory store.
 */
export const BROWSER_ONLY_TEST_FILES: readonly DeclaredTestFile[] = [
	{
		path: 'src/v1/hooks/io/io-hooks.test.ts',
		why: "normalizeTc6v201 (plc's import hook) parses, builds and serializes XML with the page's DOMParser, document.implementation and XMLSerializer; the test reads its output with DOMParser",
	},
]

/**
 * The test files that read the package from disk or start node: the `browser-all` project leaves them out. Empty: no
 * test of this package needs node.
 */
export const NODE_ONLY_TEST_FILES: readonly DeclaredTestFile[] = []
