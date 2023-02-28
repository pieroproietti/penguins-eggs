
/**
 * run with: npx ts-node
 * #!/usr/bin/npx ts-node
 */

import Utils from '../src/classes/utils'
import Tailor from '../src/classes/tailor'

startPoint()

async function startPoint() {
  Utils.titles('order')

  const tailor = new Tailor('wardrobe.d', 'hen')
  tailor.prepare(true)
}
