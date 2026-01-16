import {expect} from 'chai'
import {join} from 'node:path'

import {runHook} from '../src/index.js'
// import {runHook} from '../src'

 
const root = join(__dirname, 'fixtures/multi')

describe('runHook', () => {
  it('should run a hook', async () => {
    const {stdout} = await runHook('foo', {argv: ['arg']}, {root})
    expect(stdout).to.equal('foo hook args: arg\n')
  })
})
