import { createIecElement } from '../iec-tree'
import { findDescendants, findFirstDescendant } from '../tc6-tree'
import { convertPou } from './convert-pou'
import {
	CONTENT_HEADER_ATTRIBUTES,
	FALLBACK_CREATION_DATE_TIME,
	FILE_HEADER_ATTRIBUTES,
	IEC_SCHEMA_VERSION,
} from './converters.constants'

import { PLC_NAMESPACES } from '@/v1/config/namespaces'

import type { IecElement } from '../iec-tree'
import type { Tc6Element } from '../tc6-tree'

/** Copies the `allowed` attributes of the source (if any) onto the destination, in the source's order. */
function copyAttributes(params: {
	source: Tc6Element | undefined
	destination: IecElement
	allowed: readonly string[]
}): void {
	const { source, destination, allowed } = params
	if (!source) return
	for (const [name, value] of source.attributes) {
		if (allowed.includes(name)) destination.attributes.set(name, value)
	}
}

/** Sets `name` to `fallback` only when it is missing or empty on the element. */
function ensureAttribute(params: { element: IecElement; name: string; fallback: string }): void {
	const { element, name, fallback } = params
	if (!element.attributes.get(name)) element.attributes.set(name, fallback)
}

/** `Project` requires a `FileHeader`: the attributes the schema allows, the required ones guaranteed. */
function convertFileHeader(tc6FileHeader: Tc6Element | undefined): IecElement {
	const fileHeader = createIecElement({ tagName: 'FileHeader' })
	copyAttributes({
		source: tc6FileHeader,
		destination: fileHeader,
		allowed: FILE_HEADER_ATTRIBUTES,
	})
	ensureAttribute({ element: fileHeader, name: 'companyName', fallback: 'Unknown' })
	ensureAttribute({ element: fileHeader, name: 'productName', fallback: 'Unnamed' })
	ensureAttribute({ element: fileHeader, name: 'productVersion', fallback: '1' })
	return fileHeader
}

/**
 * `Project` requires a `ContentHeader`, with a `creationDateTime` the input sometimes carries on its `fileHeader`
 * instead: it comes from either.
 */
function convertContentHeader(params: {
	tc6FileHeader: Tc6Element | undefined
	tc6ContentHeader: Tc6Element | undefined
}): IecElement {
	const { tc6FileHeader, tc6ContentHeader } = params
	const contentHeader = createIecElement({ tagName: 'ContentHeader' })
	copyAttributes({
		source: tc6ContentHeader,
		destination: contentHeader,
		allowed: CONTENT_HEADER_ATTRIBUTES,
	})
	ensureAttribute({ element: contentHeader, name: 'name', fallback: 'Unnamed' })
	ensureAttribute({
		element: contentHeader,
		name: 'creationDateTime',
		fallback:
			tc6FileHeader?.attributes.get('creationDateTime') ||
			tc6ContentHeader?.attributes.get('modificationDateTime') ||
			FALLBACK_CREATION_DATE_TIME,
	})
	return contentHeader
}

/** `Types > GlobalNamespace`, one entry per `pou` under `types` at any depth: a nested one comes out flat. */
function convertTypes(types: Tc6Element): IecElement {
	const globalNamespace = createIecElement({
		tagName: 'GlobalNamespace',
		children: findDescendants({ root: types, localName: 'pou' }).map(convertPou),
	})
	return createIecElement({ tagName: 'Types', children: [globalNamespace] })
}

/**
 * The output `Project` of a parsed file's root element, whatever that root is named. Its required `schemaVersion` is
 * stamped regardless of the input's.
 */
export function convertProject(root: Tc6Element): IecElement {
	const tc6FileHeader = findFirstDescendant({ root, localName: 'fileHeader' })
	const tc6ContentHeader = findFirstDescendant({ root, localName: 'contentHeader' })
	const types = findFirstDescendant({ root, localName: 'types' })

	const project = createIecElement({
		tagName: 'Project',
		attributes: { xmlns: PLC_NAMESPACES.default.uri, schemaVersion: IEC_SCHEMA_VERSION },
		children: [
			convertFileHeader(tc6FileHeader),
			convertContentHeader({ tc6FileHeader, tc6ContentHeader }),
		],
	})
	if (types) project.children.push(convertTypes(types))
	project.children.push(createIecElement({ tagName: 'Instances' }))
	return project
}
