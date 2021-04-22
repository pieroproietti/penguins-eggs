import {expect, test} from '@oclif/test'

describe('tools:man', () => {
  test
  .stdout()
  .command(['tools:man'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['tools:man', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
