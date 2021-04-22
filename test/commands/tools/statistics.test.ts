import {expect, test} from '@oclif/test'

describe('tools:statistics', () => {
  test
  .stdout()
  .command(['tools:statistics'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['tools:statistics', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
