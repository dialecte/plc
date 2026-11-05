import { normalizeTc6v201 } from '../io-hooks'

/** What the test posts: one TC6 v2.01 text. */
type WorkerRequest = { input: string }

/** The worker's answer: the normalised text, or the message of what the normaliser threw. */
export type WorkerAnswer = { output: string } | { error: string }

/** The dedicated worker's global scope, as far as this file uses it (the build's libs carry no worker scope). */
type WorkerScope = {
	postMessage(message: WorkerAnswer): void
	addEventListener(type: 'message', listener: (event: MessageEvent<WorkerRequest>) => void): void
}

const scope = self as unknown as WorkerScope

scope.addEventListener('message', function answer(event) {
	try {
		scope.postMessage({ output: normalizeTc6v201(event.data.input) })
	} catch (error) {
		scope.postMessage({ error: error instanceof Error ? error.message : String(error) })
	}
})
