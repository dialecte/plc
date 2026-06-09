import {
	DEFINITION,
	ELEMENT_NAMES,
	ATTRIBUTES,
	CHILDREN,
	PARENTS,
	DESCENDANTS,
	ANCESTORS,
	ROOT_ELEMENT,
	SINGLETON_ELEMENTS,
} from '../definition'

import type { IOConfig, AnyDialecteConfig, DatabaseConfig } from '@dialecte/core'

// PLC-specific IO configuration
export const PLC_IO_CONFIG = {
	supportedFileExtensions: ['.xml'],
} as const satisfies IOConfig

// PLC database configuration
export const PLC_DATABASE_CONFIG = {
	recordSchema: {
		primaryKey: 'id',
		indexes: ['tagName', 'parent.id', 'parent.tagName'],
		compoundIndexes: [['id', 'tagName']],
		arrayIndexes: ['children.id', 'children.tagName'],
	},
} as const satisfies DatabaseConfig

export const PLC_NAMESPACES = {
	default: { uri: 'www.iec.ch/public/TC65SC65BWG7TF10', prefix: '' },
} as const

export const PLC_DIALECTE_CONFIG = {
	singletonElements: SINGLETON_ELEMENTS,
	elements: ELEMENT_NAMES,
	namespaces: PLC_NAMESPACES,
	attributes: ATTRIBUTES,
	children: CHILDREN,
	parents: PARENTS,
	descendants: DESCENDANTS,
	ancestors: ANCESTORS,
	database: PLC_DATABASE_CONFIG,
	io: PLC_IO_CONFIG,
	definition: DEFINITION,
	rootElementName: ROOT_ELEMENT,
} as const satisfies AnyDialecteConfig

export type Config = Readonly<typeof PLC_DIALECTE_CONFIG>
