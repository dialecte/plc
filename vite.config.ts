import path from 'node:path'
/// <reference types="vite/client" />
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
	plugins: [
		dts({
			tsconfigPath: path.resolve(__dirname, './tsconfig.build.json'),
			insertTypesEntry: true,
		}),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	build: {
		sourcemap: import.meta.env?.DEV,
		lib: {
			entry: {
				'v1/index': fileURLToPath(new URL('./src/v1/index.ts', import.meta.url)),
				'v1/test': fileURLToPath(new URL('./src/v1/test/index.ts', import.meta.url)),
			},
			name: 'PlcDialecte',
			formats: ['es'],
		},
		rollupOptions: {
			external: [/^@dialecte\/core/, 'dexie'],
		},
	},
})
