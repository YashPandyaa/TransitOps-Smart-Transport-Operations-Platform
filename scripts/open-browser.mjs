// Waits for the frontend dev server then opens it in the default browser.
// Called by the root "start" script via concurrently.
import { exec } from 'child_process'
import { request } from 'http'

const URL = 'http://localhost:5173'
const TIMEOUT_MS = 120_000   // give up after 2 minutes
const POLL_INTERVAL_MS = 1_000

function probe() {
    return new Promise((resolve) => {
        const req = request(URL, (res) => resolve(res.statusCode < 500))
        req.on('error', () => resolve(false))
        req.setTimeout(800, () => { req.destroy(); resolve(false) })
        req.end()
    })
}

async function waitAndOpen() {
    const deadline = Date.now() + TIMEOUT_MS
    console.log(`[BROWSER] Waiting for ${URL} …`)

    while (Date.now() < deadline) {
        if (await probe()) {
            console.log(`[BROWSER] Frontend is up — opening ${URL}`)
            // "start" is the Windows shell command to open the default browser
            exec(`start "" "${URL}"`)
            return
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    }

    console.error(`[BROWSER] Timed out waiting for ${URL}`)
}

waitAndOpen()
