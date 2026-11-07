import { describe, expect, it } from 'vitest'

import type { WorkerAnswer } from './__tests__/normalize-in-worker'

/** The fixture files the worker case reads, by path (the names are written in full where they are used). */
const FIXTURES = import.meta.glob<string>('./fixtures/tc6/*.xml', {
	query: '?raw',
	import: 'default',
	eager: true,
})

/**
 * How long the worker has to answer, its start and the modules the dev server serves it included: a wide bound, many
 * times what a quiet machine takes, that holds while another suite loads the machine.
 */
const WORKER_ANSWER_TIMEOUT_MS = 30_000
/** The case outlives the worker's bound, so what fails is the bound with its message. */
const WORKER_CASE_TIMEOUT_MS = 35_000

/** The text of a fixture file; a name no file carries is a mistake of this test, not an empty input. */
function readFixture(params: { file: string }): string {
	const text = FIXTURES[`./fixtures/tc6/${params.file}`]
	if (text === undefined) throw new Error(`no fixture file ${params.file} in fixtures/tc6`)
	return text
}

/** Starts a real dedicated worker, posts one input and resolves with its answer; a worker that fails to start rejects. */
function askWorker(params: { input: string }): Promise<WorkerAnswer> {
	const { input } = params
	return new Promise(function waitForAnswer(resolve, reject) {
		const worker = new Worker(new URL('./__tests__/normalize-in-worker.ts', import.meta.url), {
			type: 'module',
		})
		const timer = setTimeout(function giveUp() {
			worker.terminate()
			reject(new Error(`the worker did not answer within ${WORKER_ANSWER_TIMEOUT_MS} ms`))
		}, WORKER_ANSWER_TIMEOUT_MS)
		worker.addEventListener('message', function answered(event: MessageEvent<WorkerAnswer>) {
			clearTimeout(timer)
			worker.terminate()
			resolve(event.data)
		})
		worker.addEventListener('error', function failed(event) {
			clearTimeout(timer)
			worker.terminate()
			reject(new Error(`the worker failed: ${event.message}`))
		})
		worker.postMessage({ input })
	})
}

/** The answer's text, whichever it is: a worker error shows as the received text, so an assertion names what the worker threw. */
function textOf(params: { answer: WorkerAnswer }): string {
	const { answer } = params
	return 'error' in answer ? answer.error : answer.output
}

describe('normalizeTc6v201 in a dedicated worker', () => {
	it(
		'fbd-wiring -> the golden output, byte for byte',
		async () => {
			const answer = await askWorker({ input: readFixture({ file: 'fbd-wiring.tc6.xml' }) })
			expect(textOf({ answer })).toBe(readFixture({ file: 'fbd-wiring.iec.xml' }))
		},
		WORKER_CASE_TIMEOUT_MS,
	)

	it(
		'malformed -> the answer is a TC6 v201 parse error',
		async () => {
			const answer = await askWorker({ input: readFixture({ file: 'malformed.tc6.xml' }) })
			expect(textOf({ answer })).toMatch(/^TC6 v201 parse error: /)
		},
		WORKER_CASE_TIMEOUT_MS,
	)
})
