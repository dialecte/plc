import { PLC_DIALECTE } from '../declaration.constants'

// The PLC declaration served as a project engine, for the tests that open a project on sqlite storage.
import { serveDialecteEngine } from '@dialecte/core/engine'

serveDialecteEngine({ dialecte: PLC_DIALECTE })
