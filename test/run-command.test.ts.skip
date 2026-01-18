import { Config } from '@oclif/core'
import { expect } from 'chai'
import { join } from 'node:path'

// import {runCommand} from '../src'
import { runCommand } from '../src/index.js'

describe('runCommand', () => {
  const root = join(__dirname, 'fixtures/multi')

  it('should run a command', async () => {
    const { result, stdout } = await runCommand<{ name: string }>(['foo:bar'], { root })
    expect(stdout).to.equal('hello world!\n')
    expect(result?.name).to.equal('world')
  })

  it('should run a command with a flag', async () => {
    const { result, stdout } = await runCommand<{ name: string }>(['foo:bar', '--name=foo'], { root })
    expect(stdout).to.equal('hello foo!\n')
    expect(result?.name).to.equal('foo')
  })

  it('should run a command using spaces', async () => {
    const { result, stdout } = await runCommand<{ name: string }>(['foo bar', '--name=foo'], { root })
    expect(stdout).to.equal('hello foo!\n')
    expect(result?.name).to.equal('foo')
  })

  it('should handle expected exit codes', async () => {
    const { error, stdout } = await runCommand(['exit', '--code=101'], { root })
    expect(stdout).to.equal('exiting with code 101\n')
    expect(error?.message).to.equal('EEXIT: 101')
    expect(error?.oclif?.exit).to.equal(101)
  })

  it('should take existing Config instance', async () => {
    const config = await Config.load(root)
    const { result, stdout } = await runCommand<{ name: string }>(['foo:bar'], config)
    expect(stdout).to.equal('hello world!\n')
    expect(result?.name).to.equal('world')
  })

  it('should find root dynamically if not provided', async () => {
    const { stdout } = await runCommand(['--help'])
    expect(stdout).to.include('$ @oclif/test [COMMAND]')
  })

  describe('single command cli', () => {
    const root = join(__dirname, 'fixtures/single')

    it('should run a single command cli', async () => {
      const { result, stdout } = await runCommand<{ name: string }>(['.'], { root })
      expect(stdout).to.equal('hello world!\n')
      expect(result?.name).to.equal('world')
    })
  })

  const cases = [
    {
      description: 'should handle single string',
      expected: 'foo',
      input: 'foo%sbar --name foo'
    },
    {
      description: 'should handle an array of strings',
      expected: 'foo',
      input: ['foo%sbar', '--name', 'foo']
    },
    {
      description: 'should handle a string with =',
      expected: 'foo',
      input: 'foo%sbar --name=foo'
    },
    {
      description: 'should handle an array of strings with =',
      expected: 'foo',
      input: ['foo%sbar', '--name=foo']
    },
    {
      description: 'should handle a string with quotes',
      expected: 'foo',
      input: 'foo%sbar --name "foo"'
    },
    {
      description: 'should handle an array of strings with quotes',
      expected: 'foo',
      input: ['foo%sbar', '--name', '"foo"']
    },
    {
      description: 'should handle a string with quotes and with =',
      expected: 'foo',
      input: 'foo%sbar --name="foo"'
    },
    {
      description: 'should handle an array of strings with quotes and with =',
      expected: 'foo',
      input: ['foo%sbar', '--name="foo"']
    },
    {
      description: 'should handle a string with spaces in quotes',
      expected: 'foo bar',
      input: 'foo%sbar --name "foo bar"'
    },
    {
      description: 'should handle an array of strings with spaces in quotes',
      expected: 'foo bar',
      input: ['foo%sbar', '--name', '"foo bar"']
    },
    {
      description: 'should handle a string with spaces in quotes and with =',
      expected: 'foo bar',
      input: 'foo%sbar --name="foo bar"'
    },
    {
      description: 'should handle an array of strings with spaces in quotes and with =',
      expected: 'foo bar',
      input: ['foo%sbar', '--name="foo bar"']
    }
  ]

  const makeTestCases = (separator: string) =>
    cases.map(({ description, expected, input }) => ({
      description: description.replace('%s', separator),
      expected,
      input: Array.isArray(input) ? input.map((i) => i.replace('%s', separator)) : input.replace('%s', separator)
    }))

  describe('arg input (colon separator)', () => {
    const testCases = makeTestCases(':')

    for (const { description, expected, input } of testCases) {
      it(description, async () => {
        const { result, stdout } = await runCommand<{ name: string }>(input, { root })
        expect(stdout).to.equal(`hello ${expected}!\n`)
        expect(result?.name).to.equal(expected)
      })
    }
  })

  describe('arg input (space separator)', () => {
    const testCases = makeTestCases(' ')
    for (const { description, expected, input } of testCases) {
      it(description, async () => {
        const { result, stdout } = await runCommand<{ name: string }>(input, { root })
        expect(stdout).to.equal(`hello ${expected}!\n`)
        expect(result?.name).to.equal(expected)
      })
    }
  })
})
