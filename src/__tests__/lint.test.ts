import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'

describe('ESLint', () => {
  it('passes on all source files with zero errors', { timeout: 30_000 }, () => {
    try {
      execSync('npx eslint . --max-warnings 0', {
        cwd: process.cwd(),
        encoding: 'utf-8',
        stdio: 'pipe',
      })
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string }
      const output = (err.stdout ?? '') + '\n' + (err.stderr ?? '')
      expect.fail(`ESLint found errors:\n${output}`)
    }
  })
})

describe('TypeScript', () => {
  it('compiles with zero type errors', { timeout: 30_000 }, () => {
    try {
      execSync('npx tsc --noEmit', {
        cwd: process.cwd(),
        encoding: 'utf-8',
        stdio: 'pipe',
      })
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string }
      const output = (err.stdout ?? '') + '\n' + (err.stderr ?? '')
      expect.fail(`TypeScript found type errors:\n${output}`)
    }
  })
})
