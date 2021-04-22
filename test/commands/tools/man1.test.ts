import {expect, test} from '@oclif/test'

describe('tools:man1', () => {
  test
  .stdout()
  .command(['tools:man1'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['tools:man1', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
