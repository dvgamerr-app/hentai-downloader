/**
 * Playwright driver for hentai-downloader Electron app.
 * Usage: node driver.mjs [command]
 *   launch  — start the app and wait for main UI
 *   ss      — take a screenshot -> screenshots/latest.png
 *   eval <js> — evaluate JS in the renderer
 *   quit    — close the app
 *
 * Or run interactively (reads commands from stdin, one per line).
 */
import { _electron as electron } from 'playwright'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'
import readline from 'readline'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..', '..')
const MAIN = join(ROOT, 'out', 'main', 'index.js')
const SS_DIR = join(__dirname, 'screenshots')
mkdirSync(SS_DIR, { recursive: true })

let app, page

async function launch() {
  if (app) return 'already running'
  app = await electron.launch({
    args: [MAIN],
    cwd: ROOT
  })
  page = await app.firstWindow()
  // wait for landing screen to finish (landing=false means main UI loaded)
  await page
    .waitForFunction(() => !document.querySelector('[style*="background-image"]'), {
      timeout: 10000
    })
    .catch(() => {})
  return 'launched'
}

async function screenshot(name = 'latest') {
  if (!page) return 'not running'
  const file = join(SS_DIR, `${name}.png`)
  await page.screenshot({ path: file })
  return file
}

async function evalJs(code) {
  if (!page) return 'not running'
  const result = await page.evaluate(code)
  return JSON.stringify(result)
}

async function quit() {
  if (!app) return 'not running'
  await app.close()
  app = null
  page = null
  return 'closed'
}

async function run(cmd, ...args) {
  switch (cmd) {
    case 'launch':
      return await launch()
    case 'ss':
      return await screenshot(args[0])
    case 'eval':
      return await evalJs(args.join(' '))
    case 'quit':
      return await quit()
    default:
      return `unknown command: ${cmd}`
  }
}

const [, , firstCmd, ...firstArgs] = process.argv
if (firstCmd) {
  const result = await run(firstCmd, ...firstArgs)
  console.log(result)
  if (firstCmd !== 'launch') process.exit(0)
} else {
  // interactive REPL
  const rl = readline.createInterface({ input: process.stdin })
  console.log('driver ready — commands: launch, ss [name], eval <js>, quit')
  rl.on('line', async (line) => {
    const [cmd, ...args] = line.trim().split(' ')
    if (!cmd) return
    const result = await run(cmd, ...args)
    console.log(result)
    if (cmd === 'quit') process.exit(0)
  })
}
