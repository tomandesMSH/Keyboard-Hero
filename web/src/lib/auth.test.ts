import { describe, expect, it } from 'vitest'
import { makeInternalEmail } from './auth'

describe('makeInternalEmail', () => {
  it('lowercases and strips whitespace', () => {
    expect(makeInternalEmail('  TomasKral  ')).toBe('tomaskral@keyboardhero.internal')
  })

  it('removes internal spaces', () => {
    expect(makeInternalEmail('tomas kral')).toBe('tomaskral@keyboardhero.internal')
  })
})
