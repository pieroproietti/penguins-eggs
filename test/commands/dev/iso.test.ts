import {expect, test} from '@oclif/test'

describe('dev:iso', () => {
  test
  .stdout()
  .command(['dev:iso'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['dev:iso', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
