import { render, RenderOptions } from 'ink'

import Utils from '../../../classes/utils.js'

/**
 * confirm
 * @returns
 */
export async function confirm(elem: JSX.Element, msg = 'Confirm') {
  redraw(elem)

  const result = JSON.parse(await Utils.customConfirmAbort(msg))
  let retval = false
  if (result.confirm === 'Yes') {
    retval = true
  } else if (result.confirm === 'Abort') {
    process.exit()
  }

  return retval
}

/**
 * Occorre farglierlo rigenerare a forza
 * anche quando NON cambiano i dati
 * forceUpdate
 */
function redraw(elem: JSX.Element) {
  const opt: RenderOptions = {}
  opt.patchConsole = true
  opt.debug = false
  console.clear()
  render(elem, opt)
}
