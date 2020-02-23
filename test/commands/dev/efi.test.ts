import {expect, test} from '@oclif/test'

describe('dev:efi', () => {
  test
  .stdout()
  .command(['dev:efi'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['dev:efi', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
