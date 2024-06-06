/**
 * run with: npx ts-node
 * #!/usr/bin/npx ts-node
 */

import Tailor from '../src/classes/tailor'
import Utils from '../src/classes/utils'

startPoint()

async function startPoint() {
  Utils.titles('order')

  const tailor = new Tailor('wardrobe.d', 'hen')
  tailor.prepare(true)
}
