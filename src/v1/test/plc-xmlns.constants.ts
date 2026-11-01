import { XMLNS_XSI_NAMESPACE } from '@dialecte/core/helpers'
import { XMLNS_DEV_NAMESPACE } from '@dialecte/core/test'

import { PLC_DIALECTE_CONFIG } from '@/v1/config'

/** The PLC default namespace, as an attribute of a fixture's root. */
export const XMLNS_PLC_NAMESPACE = `xmlns="${PLC_DIALECTE_CONFIG.namespaces.default.uri}"`
/** Every namespace a fixture's root declares: PLC, the test record ids and xsi. */
export const ALL_XMLNS_NAMESPACES = `${XMLNS_PLC_NAMESPACE} ${XMLNS_DEV_NAMESPACE} ${XMLNS_XSI_NAMESPACE}`
