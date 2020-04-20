import {expect, test} from '@oclif/test'

describe('dev:grub', () => {
  test
  .stdout()
  .command(['dev:grub'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['dev:grub', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
