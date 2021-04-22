import {expect, test} from '@oclif/test'

describe('howto:configuration', () => {
  test
  .stdout()
  .command(['howto:configuration'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['howto:configuration', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
