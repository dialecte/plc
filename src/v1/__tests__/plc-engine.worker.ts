import { PLC_DIALECTE } from '../declaration.constants'

// The app's one engine worker file, as a test needs it: it serves projects of the PLC declaration on sqlite storage.
import { serveSqliteEngine } from '@dialecte/core/sqlite'

serveSqliteEngine({ dialectes: [PLC_DIALECTE] })
