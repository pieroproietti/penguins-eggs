/**
 * linux-suite: bundle ultimate-linux-suite into eggs costumes
 * Upstream: https://github.com/Nerds489/ultimate-linux-suite
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const SUITE_REPO = 'https://github.com/Nerds489/ultimate-linux-suite'
const SUITE_DIR = path.join(__dirname, 'suite')

/**
 * Download the ultimate-linux-suite into the plugin directory.
 */
export function fetchSuite(): void {
  if (fs.existsSync(SUITE_DIR)) {
    execSync(`git -C ${SUITE_DIR} pull`, { stdio: 'inherit' })
  } else {
    execSync(`git clone --depth 1 ${SUITE_REPO} ${SUITE_DIR}`, {
      stdio: 'inherit',
    })
  }
}

/**
 * Install the suite into a costume directory so it is included in the ISO.
 */
export function installIntoCostume(costumePath: string): void {
  if (!fs.existsSync(SUITE_DIR)) {
    throw new Error('Suite not fetched. Run fetchSuite() first.')
  }

  const dest = path.join(costumePath, 'usr', 'local', 'bin')
  fs.mkdirSync(dest, { recursive: true })

  execSync(`cp ${SUITE_DIR}/unified.sh ${dest}/unified`, { stdio: 'inherit' })
  execSync(`chmod +x ${dest}/unified`, { stdio: 'inherit' })
}

/**
 * Run the suite interactively (for testing outside of a costume).
 */
export function runSuite(args: string[] = []): void {
  if (!fs.existsSync(SUITE_DIR)) {
    throw new Error('Suite not fetched. Run fetchSuite() first.')
  }
  execSync(`bash ${SUITE_DIR}/unified.sh ${args.join(' ')}`, {
    stdio: 'inherit',
  })
}
