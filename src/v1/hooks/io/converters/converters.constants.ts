/** The output's schema version: the schema declares `version="1.0"`, whatever the input carries. */
export const IEC_SCHEMA_VERSION = '1.0'

/** The attributes the output `FileHeader` permits (the input carries extras like `creationDateTime`). */
export const FILE_HEADER_ATTRIBUTES = [
	'companyName',
	'companyURL',
	'productName',
	'productVersion',
	'productRelease',
] as const

/** The attributes the output `ContentHeader` permits. */
export const CONTENT_HEADER_ATTRIBUTES = [
	'name',
	'version',
	'creationDateTime',
	'modificationDateTime',
	'organization',
	'author',
	'language',
] as const

/** Stands in for the required `ContentHeader/@creationDateTime` when no source carries one. */
export const FALLBACK_CREATION_DATE_TIME = '1970-01-01T00:00:00'

/** The `xsi:type` of each mapped LD element; an element of any other name is skipped. */
export const LD_XSI_TYPES: ReadonlyMap<string, string> = new Map([
	['leftPowerRail', 'LeftPowerRail'],
	['rightPowerRail', 'RightPowerRail'],
	['coil', 'Coil'],
	['contact', 'Contact'],
])
